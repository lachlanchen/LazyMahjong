import { canonicalAction, digest } from './hash'
import { analyzeHand, isCompleteTypes } from './hand'
import { PROFILES } from './profiles'
import { shuffled } from './rng'
import {
  SEATS,
  type Action,
  type ActionCandidate,
  type CandidatePreview,
  type Discard,
  type GameConfig,
  type GameEvent,
  type GameResult,
  type HandAnalysis,
  type MahjongState,
  type PublicGameView,
  type Seat,
  type TeachingFacet,
  type TileInstance,
  type TileType,
} from './types'
import { composeWall, isTerminalOrHonor, nextTileType, tileSort } from './tiles'

export class MahjongRuleError extends Error {
  constructor(public readonly code: 'UNAUTHORIZED_ACTOR' | 'STALE_CANDIDATE' | 'ILLEGAL_ACTION' | 'WALL_EXHAUSTED') {
    super(code)
    this.name = 'MahjongRuleError'
  }
}

export function actorId(seat: Seat): string {
  return `player-${seat}`
}

export function nextSeat(seat: Seat): Seat {
  const index = SEATS.indexOf(seat)
  return SEATS[(index + 1) % SEATS.length] ?? 'east'
}

function seatDistance(from: Seat, to: Seat): number {
  return (SEATS.indexOf(to) - SEATS.indexOf(from) + SEATS.length) % SEATS.length
}

function emptySeatRecord<T>(factory: (seat: Seat) => T): Record<Seat, T> {
  return Object.fromEntries(SEATS.map((seat) => [seat, factory(seat)])) as Record<Seat, T>
}

export function initialState(config: GameConfig): MahjongState {
  const wall = shuffled(composeWall(config.profile), config.seed)
  const hands = emptySeatRecord(() => [] as TileInstance[])

  for (let round = 0; round < 13; round += 1) {
    for (const seat of SEATS) {
      const tile = wall.shift()
      if (!tile) throw new MahjongRuleError('WALL_EXHAUSTED')
      hands[seat].push(tile)
    }
  }
  const dealerTile = wall.shift()
  if (!dealerTile) throw new MahjongRuleError('WALL_EXHAUSTED')
  hands.east.push(dealerTile)
  for (const seat of SEATS) hands[seat].sort(tileSort)

  const sessionId = `game_${digest({ profile: config.profile, seed: config.seed }).slice(0, 24)}`
  return {
    schemaVersion: 1,
    sessionId,
    seed: config.seed,
    profile: config.profile,
    dealer: 'east',
    roundWind: 'east',
    activeSeat: 'east',
    phase: 'discard',
    wall,
    hands,
    melds: emptySeatRecord(() => []),
    rivers: emptySeatRecord(() => []),
    claimQueue: [],
    lastDiscard: null,
    turn: 0,
    events: [{ number: 0, kind: 'deal', seat: 'east', tile: null, messageKey: 'event.deal' }],
    result: null,
  }
}

function stateAuthorityShape(state: MahjongState): unknown {
  return {
    ...state,
    activeActorId: actorId(state.activeSeat),
  }
}

function authorityToken(state: MahjongState): string {
  return `s_${digest(stateAuthorityShape(state))}`
}

function actionCandidate(state: MahjongState, seat: Seat, action: Action, labelKey: string): ActionCandidate {
  const token = authorityToken(state)
  return {
    id: `c_${digest({ token, actorId: actorId(seat), action })}`,
    actorId: actorId(seat),
    seat,
    action,
    labelKey,
    evidence: 'exact',
  }
}

function findTiles(hand: readonly TileInstance[], type: TileType, amount: number): TileInstance[] {
  return hand.filter((tile) => tile.type === type).sort(tileSort).slice(0, amount)
}

function chiTilePairs(hand: readonly TileInstance[], called: TileType): [string, string][] {
  const options: [number, number][] = [[-2, -1], [-1, 1], [1, 2]]
  const pairs: [string, string][] = []
  for (const [leftOffset, rightOffset] of options) {
    const leftType = nextTileType(called, leftOffset)
    const rightType = nextTileType(called, rightOffset)
    if (!leftType || !rightType) continue
    const left = findTiles(hand, leftType, 1)[0]
    const right = findTiles(hand, rightType, 1)[0]
    if (left && right) pairs.push([left.id, right.id])
  }
  return pairs
}

function rawClaimActions(state: MahjongState, seat: Seat): Action[] {
  const discard = state.lastDiscard
  if (!discard || discard.by === seat) return []
  const hand = state.hands[seat]
  const actions: Action[] = []
  if (isCompleteTypes([...hand.map((tile) => tile.type), discard.tile.type], state.melds[seat].length)) {
    actions.push({ kind: 'ron' })
  }
  const same = findTiles(hand, discard.tile.type, 3)
  if (PROFILES[state.profile].allowsKan && same.length >= 3) {
    actions.push({ kind: 'kan', tileIds: [same[0]!.id, same[1]!.id, same[2]!.id] })
  }
  if (PROFILES[state.profile].allowsPon && same.length >= 2) {
    actions.push({ kind: 'pon', tileIds: [same[0]!.id, same[1]!.id] })
  }
  if (PROFILES[state.profile].allowsChi && nextSeat(discard.by) === seat) {
    for (const tileIds of chiTilePairs(hand, discard.tile.type)) actions.push({ kind: 'chi', tileIds })
  }
  return actions
}

function claimPriority(actions: readonly Action[]): number {
  if (actions.some((action) => action.kind === 'ron')) return 3
  if (actions.some((action) => action.kind === 'pon' || action.kind === 'kan')) return 2
  if (actions.some((action) => action.kind === 'chi')) return 1
  return 0
}

function buildClaimQueue(state: MahjongState, discarder: Seat): Seat[] {
  return SEATS
    .filter((seat) => seat !== discarder && rawClaimActions(state, seat).length > 0)
    .sort((left, right) => {
      const priority = claimPriority(rawClaimActions(state, right)) - claimPriority(rawClaimActions(state, left))
      return priority || seatDistance(discarder, left) - seatDistance(discarder, right)
    })
}

export function legalActions(state: MahjongState, requestedActorId: string): ActionCandidate[] {
  if (state.phase === 'finished') return []
  const expectedActor = actorId(state.activeSeat)
  if (requestedActorId !== expectedActor) return []
  const seat = state.activeSeat

  if (state.phase === 'draw') {
    return state.wall.length > 0 ? [actionCandidate(state, seat, { kind: 'draw' }, 'action.draw')] : []
  }
  if (state.phase === 'discard') {
    const hand = state.hands[seat]
    const candidates = hand.map((tile) => actionCandidate(state, seat, { kind: 'discard', tileId: tile.id }, 'action.discard'))
    if (isCompleteTypes(hand.map((tile) => tile.type), state.melds[seat].length)) {
      candidates.unshift(actionCandidate(state, seat, { kind: 'tsumo' }, 'action.tsumo'))
    }
    return candidates
  }
  if (state.phase === 'claim') {
    if (state.claimQueue[0] !== seat) return []
    const queuePriority = Math.max(
      0,
      ...state.claimQueue.map((queuedSeat) => claimPriority(rawClaimActions(state, queuedSeat))),
    )
    // A lower-priority call may never erase a later ron. A seat that can ron
    // must either take that win or pass before pon/kan/chi are considered.
    const priorityActions = rawClaimActions(state, seat).filter(
      (action) => claimPriority([action]) === queuePriority,
    )
    return [
      ...priorityActions.map((action) => actionCandidate(state, seat, action, `action.${action.kind}`)),
      actionCandidate(state, seat, { kind: 'pass' }, 'action.pass'),
    ]
  }
  return []
}

function event(state: MahjongState, kind: GameEvent['kind'], seat: Seat, tile: TileInstance | null, messageKey: string): void {
  state.events.push({ number: state.events.length, kind, seat, tile, messageKey })
}

function finish(state: MahjongState, result: GameResult): void {
  state.phase = 'finished'
  state.result = result
  state.claimQueue = []
}

function finishExhaustive(state: MahjongState): void {
  finish(state, {
    kind: 'exhaustive-draw',
    winner: null,
    from: null,
    exactShape: true,
    scoringStatusKey: 'result.exhaustive',
  })
  event(state, 'exhaustive-draw', state.activeSeat, null, 'event.exhaustive')
}

function removeTiles(hand: TileInstance[], ids: readonly string[]): TileInstance[] {
  const wanted = new Set(ids)
  const removed = hand.filter((tile) => wanted.has(tile.id))
  if (removed.length !== ids.length) throw new MahjongRuleError('ILLEGAL_ACTION')
  const retained = hand.filter((tile) => !wanted.has(tile.id))
  hand.splice(0, hand.length, ...retained)
  return removed
}

function latestDiscardById(river: Discard[], tileId: string): Discard | undefined {
  for (let index = river.length - 1; index >= 0; index -= 1) {
    if (river[index]?.tile.id === tileId) return river[index]
  }
  return undefined
}

function applyKnownAction(state: MahjongState, action: Action): MahjongState {
  const next = structuredClone(state)
  const seat = next.activeSeat

  if (action.kind === 'draw') {
    const tile = next.wall.shift()
    if (!tile) throw new MahjongRuleError('WALL_EXHAUSTED')
    next.hands[seat].push(tile)
    next.hands[seat].sort(tileSort)
    next.phase = 'discard'
    event(next, 'draw', seat, tile, 'event.draw')
    return next
  }

  if (action.kind === 'discard') {
    const [tile] = removeTiles(next.hands[seat], [action.tileId])
    if (!tile) throw new MahjongRuleError('ILLEGAL_ACTION')
    const discard: Discard = { tile, by: seat, turn: next.turn, claimed: false }
    next.rivers[seat].push(discard)
    next.lastDiscard = discard
    next.turn += 1
    event(next, 'discard', seat, tile, 'event.discard')
    const queue = buildClaimQueue(next, seat)
    next.claimQueue = queue
    if (queue.length > 0) {
      next.activeSeat = queue[0]!
      next.phase = 'claim'
    } else {
      next.activeSeat = nextSeat(seat)
      next.phase = 'draw'
      if (next.wall.length === 0) finishExhaustive(next)
    }
    return next
  }

  if (action.kind === 'pass') {
    const discarder = next.lastDiscard?.by
    if (!discarder || next.claimQueue[0] !== seat) throw new MahjongRuleError('ILLEGAL_ACTION')
    next.claimQueue.shift()
    event(next, 'pass', seat, null, 'event.pass')
    if (next.claimQueue.length > 0) {
      next.activeSeat = next.claimQueue[0]!
    } else {
      next.activeSeat = nextSeat(discarder)
      next.phase = 'draw'
      if (next.wall.length === 0) finishExhaustive(next)
    }
    return next
  }

  if (action.kind === 'tsumo') {
    finish(next, {
      kind: 'tsumo', winner: seat, from: null, exactShape: true,
      scoringStatusKey: `result.${next.profile}.scoring-unsupported`,
    })
    event(next, 'tsumo', seat, null, 'event.tsumo')
    return next
  }

  if (action.kind === 'ron') {
    const from = next.lastDiscard?.by
    if (!from) throw new MahjongRuleError('ILLEGAL_ACTION')
    finish(next, {
      kind: 'ron', winner: seat, from, exactShape: true,
      scoringStatusKey: `result.${next.profile}.scoring-unsupported`,
    })
    event(next, 'ron', seat, next.lastDiscard?.tile ?? null, 'event.ron')
    return next
  }

  const discard = next.lastDiscard
  if (!discard) throw new MahjongRuleError('ILLEGAL_ACTION')
  const removed = removeTiles(next.hands[seat], action.tileIds)
  const riverDiscard = latestDiscardById(next.rivers[discard.by], discard.tile.id)
  if (!riverDiscard) throw new MahjongRuleError('ILLEGAL_ACTION')
  next.rivers[discard.by] = next.rivers[discard.by].filter((item) => item !== riverDiscard)
  const meldTiles = [...removed, discard.tile].sort(tileSort)
  next.melds[seat].push({ kind: action.kind, tiles: meldTiles, calledTileId: discard.tile.id, from: discard.by, open: true })
  next.lastDiscard = null
  next.claimQueue = []
  next.activeSeat = seat
  next.phase = action.kind === 'kan' ? 'draw' : 'discard'
  event(next, action.kind, seat, discard.tile, `event.${action.kind}`)
  if (action.kind === 'kan' && next.wall.length === 0) finishExhaustive(next)
  return next
}

export function applyAction(state: MahjongState, candidate: ActionCandidate): MahjongState {
  const expectedActor = actorId(state.activeSeat)
  if (candidate.actorId !== expectedActor || candidate.seat !== state.activeSeat) {
    throw new MahjongRuleError('UNAUTHORIZED_ACTOR')
  }
  const candidates = legalActions(state, expectedActor)
  const authoritative = candidates.find((item) => item.id === candidate.id)
  if (!authoritative || canonicalAction(candidate) !== canonicalAction(authoritative)) {
    throw new MahjongRuleError('STALE_CANDIDATE')
  }
  return applyKnownAction(state, authoritative.action)
}

export function publicView(state: MahjongState, viewerId: string): PublicGameView {
  const visible = {
    sessionId: state.sessionId,
    profile: state.profile,
    dealer: state.dealer,
    roundWind: state.roundWind,
    activeSeat: state.activeSeat,
    activeActorId: actorId(state.activeSeat),
    phase: state.phase,
    wallCount: state.wall.length,
    turn: state.turn,
    players: SEATS.map((seat) => ({
      seat,
      actorId: actorId(seat),
      hand: viewerId === actorId(seat) ? structuredClone(state.hands[seat]) : { hidden: true as const, count: state.hands[seat].length },
      melds: structuredClone(state.melds[seat]),
      river: structuredClone(state.rivers[seat]),
      isActive: state.activeSeat === seat,
    })),
    lastDiscard: structuredClone(state.lastDiscard),
    events: state.events.map((item) => ({ ...item, tile: item.kind === 'draw' && viewerId !== actorId(item.seat) ? null : structuredClone(item.tile) })),
    result: structuredClone(state.result),
  }
  return {
    ...visible,
    // Only already-visible fields enter this display token. Concealed hands,
    // wall order, and the server-side authority token cannot be distinguished
    // through it.
    viewToken: `v_${digest(visible)}`,
  }
}

export function visibleTileCounts(state: MahjongState, viewer: Seat): Partial<Record<TileType, number>> {
  const counts: Partial<Record<TileType, number>> = {}
  const add = (tile: TileInstance) => { counts[tile.type] = (counts[tile.type] ?? 0) + 1 }
  state.hands[viewer].forEach(add)
  for (const seat of SEATS) {
    state.rivers[seat].forEach((discard) => add(discard.tile))
    state.melds[seat].flatMap((meld) => meld.tiles).forEach(add)
  }
  return counts
}

export function analyzeSeat(state: MahjongState, seat: Seat): HandAnalysis {
  return analyzeHand(state.hands[seat], state.melds[seat].length, visibleTileCounts(state, seat))
}

function discardSafety(state: MahjongState, actor: Seat, type: TileType): number {
  return SEATS.filter((seat) => seat !== actor && state.rivers[seat].some((discard) => discard.tile.type === type)).length
}

function actionTile(state: MahjongState, candidate: ActionCandidate): TileInstance | null {
  const action = candidate.action
  if (action.kind !== 'discard') return null
  return state.hands[candidate.seat].find((tile) => tile.id === action.tileId) ?? null
}

function facetsForPreview(
  state: MahjongState,
  candidate: ActionCandidate,
  before: HandAnalysis | null,
  after: HandAnalysis | null,
): TeachingFacet[] {
  const tile = actionTile(state, candidate)
  const safetyCount = tile ? discardSafety(state, candidate.seat, tile.type) : 0
  const profile = PROFILES[state.profile]
  return [
    {
      id: 'shape', evidence: 'calculated', titleKey: 'facet.shape.title', bodyKey: 'facet.shape.body',
      params: { before: before?.shapeScore ?? 0, after: after?.shapeScore ?? before?.shapeScore ?? 0, pairs: after?.pairs ?? before?.pairs ?? 0, connected: after?.connected ?? before?.connected ?? 0 },
    },
    {
      id: 'ukeire', evidence: 'calculated', titleKey: 'facet.ukeire.title', bodyKey: 'facet.ukeire.body',
      params: { count: after?.ukeire ?? before?.ukeire ?? 0, kinds: after?.improvingTiles.length ?? before?.improvingTiles.length ?? 0, tenpai: after?.tenpai ? 1 : 0 },
    },
    {
      id: 'safety', evidence: tile ? 'exact' : 'authored', titleKey: 'facet.safety.title', bodyKey: tile ? 'facet.safety.body' : 'facet.safety.not-discard',
      params: { opponents: safetyCount, tile: tile?.type ?? 'none' },
    },
    {
      id: 'value', evidence: 'authored', titleKey: 'facet.value.title', bodyKey: 'facet.value.body',
      params: { profile: profile.id, tileClass: tile ? (isTerminalOrHonor(tile.type) ? 'terminal-or-honor' : 'simple') : 'none' },
    },
    {
      id: 'tempo', evidence: 'exact', titleKey: 'facet.tempo.title', bodyKey: 'facet.tempo.body',
      params: { wall: state.wall.length, turn: state.turn, phase: state.phase },
    },
  ]
}

export function previewAction(state: MahjongState, candidate: ActionCandidate): CandidatePreview {
  const authoritative = legalActions(state, actorId(state.activeSeat)).find((item) => item.id === candidate.id)
  if (!authoritative || canonicalAction(candidate) !== canonicalAction(authoritative)) {
    throw new MahjongRuleError('STALE_CANDIDATE')
  }
  const before = analyzeSeat(state, authoritative.seat)
  // A draw preview must not expose the server-only next tile. It therefore
  // describes the exact transition envelope without applying the hidden draw.
  const simulated = authoritative.action.kind === 'draw' ? null : applyKnownAction(state, authoritative.action)
  const handAfter = simulated ? structuredClone(simulated.hands[authoritative.seat]) : null
  const after = simulated && simulated.phase !== 'finished'
    ? analyzeHand(simulated.hands[authoritative.seat], simulated.melds[authoritative.seat].length, visibleTileCounts(simulated, authoritative.seat))
    : simulated
      ? analyzeHand(simulated.hands[authoritative.seat], simulated.melds[authoritative.seat].length, visibleTileCounts(simulated, authoritative.seat))
      : null
  const tile = actionTile(state, authoritative)
  const params: Record<string, string | number> = {
    action: authoritative.action.kind,
    tile: tile?.type ?? 'hidden',
    beforeUkeire: before.ukeire,
    afterUkeire: after?.ukeire ?? before.ukeire,
    wall: state.wall.length,
  }
  return {
    candidate: authoritative,
    legal: true,
    hypothetical: true,
    titleKey: `preview.${authoritative.action.kind}.title`,
    whyKey: `preview.${authoritative.action.kind}.why`,
    changesKey: `preview.${authoritative.action.kind}.changes`,
    replyKey: `preview.${authoritative.action.kind}.reply`,
    nextKey: `preview.${authoritative.action.kind}.next`,
    principleKey: `preview.${authoritative.action.kind}.principle`,
    params,
    facets: facetsForPreview(state, authoritative, before, after),
    handAfter,
    analysisBefore: before,
    analysisAfter: after,
  }
}

export function evaluate(state: MahjongState): GameResult | null {
  return structuredClone(state.result)
}

export function chooseDeterministicBotAction(state: MahjongState): ActionCandidate {
  const candidates = legalActions(state, actorId(state.activeSeat))
  const win = candidates.find((candidate) => candidate.action.kind === 'tsumo' || candidate.action.kind === 'ron')
  if (win) return win
  const forced = candidates.find((candidate) => candidate.action.kind === 'draw')
  if (forced) return forced
  const pass = candidates.find((candidate) => candidate.action.kind === 'pass')
  if (state.phase === 'claim' && pass) return pass
  const discards = candidates.filter((candidate) => candidate.action.kind === 'discard')
  if (discards.length > 0) {
    // Opponents are pacing actors, not teaching engines. Keep their policy
    // cheap, replayable, and clearly non-model: choose the lexicographically
    // first state-bound discard rather than running private analysis.
    return [...discards].sort((left, right) => left.id.localeCompare(right.id))[0]!
  }
  if (candidates[0]) return candidates[0]
  throw new MahjongRuleError('ILLEGAL_ACTION')
}
