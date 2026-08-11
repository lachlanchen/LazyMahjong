import { describe, expect, it } from 'vitest'
import { actorId, legalActions } from '../src/domain/engine'
import {
  SessionConflictError,
  listSessions,
  loadSession,
  persistAutomatedSeats,
  persistCandidate,
  saveSession,
  startOrResumeSession,
  type StorageLike,
  withPersistenceMutationLock,
} from '../src/persistence/sessionStore'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

const fixedNow = () => new Date('2026-08-11T00:00:00.000Z')

describe('durable sessions and idempotency', () => {
  it('uses one exclusive browser lock for every persistence mutation path', async () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    const requests: Array<{ name: string; mode: string }> = []
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        locks: {
          request: async (name: string, options: { mode: string }, operation: () => unknown) => {
            requests.push({ name, mode: options.mode })
            return operation()
          },
        },
      },
    })

    try {
      await expect(withPersistenceMutationLock(() => 'done')).resolves.toBe('done')
      await expect(withPersistenceMutationLock(async () => 'also-done')).resolves.toBe('also-done')
      expect(requests).toEqual([
        { name: 'four-winds:persistence:v1', mode: 'exclusive' },
        { name: 'four-winds:persistence:v1', mode: 'exclusive' },
      ])
    } finally {
      if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
      else Reflect.deleteProperty(globalThis, 'navigator')
    }
  })

  it('resumes a launch key without creating a duplicate session', () => {
    const storage = new MemoryStorage()
    const config = { profile: 'riichi' as const, seed: 'durable-seed' }
    const first = startOrResumeSession(storage, config, 'east', fixedNow)
    const second = startOrResumeSession(storage, config, 'east', fixedNow)

    expect(first.resumed).toBe(false)
    expect(second.resumed).toBe(true)
    expect(second.record.id).toBe(first.record.id)
    expect(listSessions(storage)).toHaveLength(1)
  })

  it('repairs a missing launch index entry from the deterministic session ID', () => {
    const storage = new MemoryStorage()
    const config = { profile: 'riichi' as const, seed: 'orphaned-index' }
    const first = startOrResumeSession(storage, config, 'east', fixedNow)
    storage.removeItem('four-winds:sessions:v1')

    const recovered = startOrResumeSession(storage, config, 'east', fixedNow)
    expect(recovered.resumed).toBe(true)
    expect(recovered.record).toEqual(first.record)
    expect(listSessions(storage).map((item) => item.id)).toEqual([first.record.id])
  })

  it('applies a client request once and survives reload without revision duplication', () => {
    const storage = new MemoryStorage()
    const started = startOrResumeSession(storage, { profile: 'mcr', seed: 'request-seed' }, 'east', fixedNow)
    const candidate = legalActions(started.record.state, actorId('east')).find((item) => item.action.kind === 'discard')!
    const first = persistCandidate(storage, started.record, candidate, 'request-001', fixedNow)
    const duplicate = persistCandidate(storage, started.record, candidate, 'request-001', fixedNow)

    expect(first.applied).toBe(true)
    expect(duplicate.applied).toBe(false)
    expect(duplicate.record.revision).toBe(1)
    expect(duplicate.responseRevision).toBe(1)
    expect(loadSession(storage, duplicate.record.id)?.revision).toBe(1)
    expect(() => persistCandidate(storage, first.record, { ...candidate, id: `${candidate.id}x` }, 'request-001', fixedNow)).toThrow('IDEMPOTENCY_KEY_REUSED')
    expect(() => persistCandidate(
      storage,
      first.record,
      { ...candidate, action: { kind: 'tsumo' } },
      'request-001',
      fixedNow,
    )).toThrow('IDEMPOTENCY_KEY_REUSED')
  })

  it('rejects a stale tab instead of overwriting the newer revision', () => {
    const storage = new MemoryStorage()
    const started = startOrResumeSession(storage, { profile: 'riichi', seed: 'two-tabs' }, 'east', fixedNow)
    const leftTab = structuredClone(started.record)
    const rightTab = structuredClone(started.record)
    const left = legalActions(leftTab.state, actorId('east')).find((item) => item.action.kind === 'discard')!
    const right = legalActions(rightTab.state, actorId('east')).filter((item) => item.action.kind === 'discard')[1]!

    const committed = persistCandidate(storage, leftTab, left, 'left-tab', fixedNow)
    expect(() => persistCandidate(storage, rightTab, right, 'right-tab', fixedNow)).toThrow(SessionConflictError)
    expect(loadSession(storage, started.record.id)).toEqual(committed.record)
  })

  it('requires a CAS update to advance exactly one revision', () => {
    const storage = new MemoryStorage()
    const started = startOrResumeSession(storage, { profile: 'mcr', seed: 'revision-step' }, 'east', fixedNow)
    const skipped = { ...started.record, revision: 2 }

    expect(() => saveSession(storage, skipped, 0)).toThrow(SessionConflictError)
    expect(loadSession(storage, started.record.id)).toEqual(started.record)
  })

  it('rejects stale automation without falling back to or overwriting its snapshot', () => {
    const storage = new MemoryStorage()
    const started = startOrResumeSession(storage, { profile: 'riichi', seed: 'automation-cas' }, 'east', fixedNow)
    const staleAutomationSnapshot = structuredClone(started.record)
    const discard = legalActions(started.record.state, actorId('east')).find((item) => item.action.kind === 'discard')!
    const userCommit = persistCandidate(storage, started.record, discard, 'human-move', fixedNow)

    expect(() => persistAutomatedSeats(storage, staleAutomationSnapshot, fixedNow)).toThrow(SessionConflictError)
    expect(loadSession(storage, started.record.id)).toEqual(userCommit.record)

    const automated = persistAutomatedSeats(storage, userCommit.record, fixedNow)
    expect(automated.revision).toBeGreaterThan(userCommit.record.revision)
    expect(loadSession(storage, started.record.id)).toEqual(automated)
  })

  it('uses separate durable identifiers for different authorized viewer seats', () => {
    const storage = new MemoryStorage()
    const config = { profile: 'hong-kong' as const, seed: 'same-wall' }
    const east = startOrResumeSession(storage, config, 'east', fixedNow)
    const south = startOrResumeSession(storage, config, 'south', fixedNow)
    expect(east.record.id).not.toBe(south.record.id)
    expect(listSessions(storage)).toHaveLength(2)
  })
})
