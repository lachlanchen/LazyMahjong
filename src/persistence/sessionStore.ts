import { applyAction, actorId, chooseDeterministicBotAction, initialState, publicView } from '../domain/engine'
import { canonicalAction, digest } from '../domain/hash'
import type { ActionCandidate, GameConfig, Seat, SessionRecord, SessionSummary } from '../domain/types'

const INDEX_KEY = 'four-winds:sessions:v1'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface SessionIndex {
  ids: string[]
  launches: Record<string, string>
}

export interface MutationResult {
  record: SessionRecord
  applied: boolean
  responseRevision: number
}

export class SessionConflictError extends Error {
  constructor(message = 'REVISION_CONFLICT') {
    super(message)
    this.name = 'SessionConflictError'
  }
}

/**
 * Serialize this app's same-origin browser writers before revision CAS.
 * Server adapters still need their own transactional compare-and-swap.
 */
export async function withPersistenceMutationLock<T>(operation: () => T | Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('four-winds:persistence:v1', { mode: 'exclusive' }, operation)
  }
  return operation()
}

function requestFingerprint(candidate: ActionCandidate): string {
  return canonicalAction(candidate)
}

function assertIdempotentMatch(processed: SessionRecord['processedRequests'][string], candidate: ActionCandidate): void {
  if (
    processed.candidateId !== candidate.id ||
    processed.requestFingerprint !== requestFingerprint(candidate)
  ) {
    throw new Error('IDEMPOTENCY_KEY_REUSED')
  }
}

function sessionKey(id: string): string {
  return `four-winds:session:${id}:v1`
}

function readIndex(storage: StorageLike): SessionIndex {
  try {
    const value = storage.getItem(INDEX_KEY)
    if (!value) return { ids: [], launches: {} }
    const parsed = JSON.parse(value) as SessionIndex
    return {
      ids: Array.isArray(parsed.ids) ? [...new Set(parsed.ids.filter((id) => typeof id === 'string'))] : [],
      launches: parsed.launches && typeof parsed.launches === 'object' ? parsed.launches : {},
    }
  } catch {
    return { ids: [], launches: {} }
  }
}

function writeIndex(storage: StorageLike, index: SessionIndex): void {
  storage.setItem(INDEX_KEY, JSON.stringify(index))
}

function nowIso(now: () => Date): string {
  return now().toISOString()
}

function matchesLaunch(record: SessionRecord, config: GameConfig, viewerSeat: Seat): boolean {
  return (
    record.viewerSeat === viewerSeat &&
    record.state.profile === config.profile &&
    record.state.seed === config.seed
  )
}

export function loadSession(storage: StorageLike, id: string): SessionRecord | null {
  try {
    const raw = storage.getItem(sessionKey(id))
    if (!raw) return null
    const record = JSON.parse(raw) as SessionRecord
    if (record.id !== id || record.state.sessionId !== id || record.state.schemaVersion !== 1) return null
    return record
  } catch {
    return null
  }
}

function sameRecord(left: SessionRecord, right: SessionRecord): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/**
 * Persist a record against the revision the caller actually read.
 *
 * Passing null is creation-only (or an exact idempotent rewrite). The UI wraps
 * session creation plus human and automated writes in one same-origin Web Lock.
 * The revision check then rejects a snapshot made stale before that lock ran.
 * A server adapter must replace this with a transactional compare-and-swap.
 */
export function saveSession(
  storage: StorageLike,
  record: SessionRecord,
  expectedRevision: number | null = null,
): void {
  const current = loadSession(storage, record.id)
  if (expectedRevision === null) {
    if (current && !sameRecord(current, record)) throw new SessionConflictError()
  } else {
    if (!current || current.revision !== expectedRevision || record.revision !== expectedRevision + 1) {
      throw new SessionConflictError()
    }
  }
  storage.setItem(sessionKey(record.id), JSON.stringify(record))
  const stored = loadSession(storage, record.id)
  if (!stored || !sameRecord(stored, record)) throw new SessionConflictError()
  const index = readIndex(storage)
  index.ids = [record.id, ...index.ids.filter((id) => id !== record.id)]
  writeIndex(storage, index)
}

export function persistCandidate(
  storage: StorageLike,
  snapshot: SessionRecord,
  candidate: ActionCandidate,
  clientRequestId: string,
  now: () => Date = () => new Date(),
): MutationResult {
  const latest = loadSession(storage, snapshot.id)
  if (!latest) throw new SessionConflictError()
  const processed = latest.processedRequests[clientRequestId]
  if (processed) {
    assertIdempotentMatch(processed, candidate)
    return { record: latest, applied: false, responseRevision: processed.resultingRevision }
  }
  if (latest.revision !== snapshot.revision) throw new SessionConflictError()
  const mutation = commitCandidate(latest, candidate, clientRequestId, now)
  if (mutation.applied) saveSession(storage, mutation.record, latest.revision)
  return mutation
}

export function persistAutomatedSeats(
  storage: StorageLike,
  snapshot: SessionRecord,
  now: () => Date = () => new Date(),
  limit = 96,
): SessionRecord {
  const latest = loadSession(storage, snapshot.id)
  if (!latest || latest.revision !== snapshot.revision) throw new SessionConflictError()
  const sequence = automatedSeatSequence(latest, now, limit)
  for (let index = 1; index < sequence.length; index += 1) {
    const previous = sequence[index - 1]!
    const current = sequence[index]!
    saveSession(storage, current, previous.revision)
  }
  return sequence.at(-1) ?? latest
}

export function startOrResumeSession(
  storage: StorageLike,
  config: GameConfig,
  viewerSeat: Seat,
  now: () => Date = () => new Date(),
): { record: SessionRecord; resumed: boolean } {
  const launchKey = digest({ profile: config.profile, seed: config.seed, viewerSeat })
  const index = readIndex(storage)
  const knownId = index.launches[launchKey]
  if (knownId) {
    const known = loadSession(storage, knownId)
    if (known && matchesLaunch(known, config, viewerSeat)) return { record: known, resumed: true }
  }

  const state = initialState(config)
  // A viewer seat is part of a durable teaching launch, so two authorized
  // viewers cannot collide on the same profile/seed storage key.
  state.sessionId = `game_${digest({ profile: config.profile, seed: config.seed, viewerSeat }).slice(0, 24)}`
  const orphaned = loadSession(storage, state.sessionId)
  if (orphaned && matchesLaunch(orphaned, config, viewerSeat)) {
    const repaired = readIndex(storage)
    repaired.ids = [orphaned.id, ...repaired.ids.filter((id) => id !== orphaned.id)]
    repaired.launches[launchKey] = orphaned.id
    writeIndex(storage, repaired)
    return { record: orphaned, resumed: true }
  }
  const timestamp = nowIso(now)
  const record: SessionRecord = {
    id: state.sessionId,
    revision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    viewerSeat,
    state,
    processedRequests: {},
  }
  saveSession(storage, record)
  const updated = readIndex(storage)
  updated.launches[launchKey] = record.id
  writeIndex(storage, updated)
  return { record, resumed: false }
}

export function commitCandidate(
  record: SessionRecord,
  candidate: ActionCandidate,
  clientRequestId: string,
  now: () => Date = () => new Date(),
): MutationResult {
  const processed = record.processedRequests[clientRequestId]
  if (processed) {
    assertIdempotentMatch(processed, candidate)
    return { record: structuredClone(record), applied: false, responseRevision: processed.resultingRevision }
  }

  const nextState = applyAction(record.state, candidate)
  const revision = record.revision + 1
  const processedRequests = {
    ...record.processedRequests,
    [clientRequestId]: {
      candidateId: candidate.id,
      requestFingerprint: requestFingerprint(candidate),
      resultingRevision: revision,
    },
  }
  const retainedKeys = Object.keys(processedRequests).slice(-256)
  const retained = Object.fromEntries(retainedKeys.map((key) => [key, processedRequests[key]!]))
  return {
    record: {
      ...record,
      revision,
      updatedAt: nowIso(now),
      state: nextState,
      processedRequests: retained,
    },
    applied: true,
    responseRevision: revision,
  }
}

export function advanceAutomatedSeats(
  record: SessionRecord,
  now: () => Date = () => new Date(),
  limit = 96,
): SessionRecord {
  return automatedSeatSequence(record, now, limit).at(-1) ?? record
}

function automatedSeatSequence(
  record: SessionRecord,
  now: () => Date,
  limit: number,
): SessionRecord[] {
  let current = record
  let steps = 0
  const records = [record]
  while (
    current.state.phase !== 'finished' &&
    current.state.activeSeat !== current.viewerSeat
  ) {
    if (steps >= limit) throw new Error('AUTOMATION_LIMIT_REACHED')
    const candidate = chooseDeterministicBotAction(current.state)
    const requestId = `system:${current.revision}:${candidate.id}`
    current = commitCandidate(current, candidate, requestId, now).record
    records.push(current)
    steps += 1
  }
  return records
}

export function listSessions(storage: StorageLike): SessionSummary[] {
  return readIndex(storage).ids.flatMap((id) => {
    const record = loadSession(storage, id)
    if (!record) return []
    const view = publicView(record.state, actorId(record.viewerSeat))
    return [{
      id: record.id,
      profile: record.state.profile,
      seedLabel: record.state.seed.slice(0, 18),
      viewerSeat: record.viewerSeat,
      turn: record.state.turn,
      phase: view.phase,
      updatedAt: record.updatedAt,
    }]
  }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function activeActorIsViewer(record: SessionRecord): boolean {
  return actorId(record.state.activeSeat) === actorId(record.viewerSeat)
}
