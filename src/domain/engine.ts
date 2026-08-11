import { canonicalAction, digest } from './hash'
import { analyzeHand, isCompleteTypes } from './hand'
import { PROFILES } from './profiles'
import { shuffled } from './rng'
import {
  SEATS,
  type Action,
  type ActionCandidate,
  type CandidatePreview,
  type CandidateRecommendation,
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
import { composeWall, isTerminalOrHonor, nextTileType, tileGlyph, tileSort, tileTypeIndex } from './tiles'

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
  if (isCompleteTypes([...hand.map((tile) => tile.type), discard.tile.type], state.melds[seat].length, state.profile)) {
    actions.push({ kind: 'ron' })
  }
  const same = findTiles(hand, discard.tile.type, 3)
  // This teaching subset takes a kan supplement from the same undealt draw
  // pile. With no tile left, that transition cannot be completed, so it must
  // never be offered as an authoritative candidate. Pon and chi remain legal:
  // both move directly to the caller's required discard, after which ordinary
  // claim resolution runs and an all-pass branch ends exhaustively.
  if (state.wall.length > 0 && PROFILES[state.profile].allowsKan && same.length >= 3) {
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
    if (isCompleteTypes(hand.map((tile) => tile.type), state.melds[seat].length, state.profile)) {
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
    // A lower-priority call may never erase a later ron. A seat with an exact
    // supported-shape completion must take it or pass before lower calls are
    // considered. Scoring eligibility is deliberately outside this subset.
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
  const viewerOwnsClaim = state.phase === 'claim' && viewerId === actorId(state.activeSeat)
  // A claim queue is authority-private because membership proves something
  // about concealed tiles. Non-claimants see the same public turn envelope as
  // an ordinary all-pass advance until a call or completion is declared. The
  // projection also handles a zero-tile wall, where all passes end the hand.
  let visibleState = state
  if (state.phase === 'claim' && !viewerOwnsClaim) {
    while (visibleState.phase === 'claim') visibleState = applyKnownAction(visibleState, { kind: 'pass' })
  }
  const projectedPublicEvents = visibleState.events
    .slice(state.events.length)
    .filter((item) => item.kind !== 'pass')
  const publicEvents = [...state.events, ...projectedPublicEvents]
    .filter((item) => item.kind !== 'pass' || viewerId === actorId(item.seat))
    .map((item, number) => ({
      ...item,
      number,
      tile: item.kind === 'draw' && viewerId !== actorId(item.seat) ? null : structuredClone(item.tile),
    }))
  const visible = {
    sessionId: visibleState.sessionId,
    profile: visibleState.profile,
    dealer: visibleState.dealer,
    roundWind: visibleState.roundWind,
    activeSeat: visibleState.activeSeat,
    activeActorId: actorId(visibleState.activeSeat),
    phase: visibleState.phase,
    drawPileCount: visibleState.wall.length,
    turn: visibleState.turn,
    players: SEATS.map((seat) => ({
      seat,
      actorId: actorId(seat),
      hand: viewerId === actorId(seat) ? structuredClone(visibleState.hands[seat]) : { hidden: true as const, count: visibleState.hands[seat].length },
      melds: structuredClone(visibleState.melds[seat]),
      river: structuredClone(visibleState.rivers[seat]),
      isActive: visibleState.activeSeat === seat,
    })),
    lastDiscard: structuredClone(visibleState.lastDiscard),
    events: publicEvents,
    result: structuredClone(visibleState.result),
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
  return analyzeHand(state.hands[seat], state.melds[seat].length, visibleTileCounts(state, seat), state.profile)
}

function discardSafety(state: MahjongState, actor: Seat, type: TileType): number {
  return SEATS.filter((seat) => seat !== actor && state.rivers[seat].some((discard) => discard.tile.type === type)).length
}

function actionTile(state: MahjongState, candidate: ActionCandidate): TileInstance | null {
  const action = candidate.action
  if (action.kind !== 'discard') return null
  return state.hands[candidate.seat].find((tile) => tile.id === action.tileId) ?? null
}

function analysisAfterCandidate(state: MahjongState, candidate: ActionCandidate): HandAnalysis | null {
  if (candidate.action.kind === 'draw') return null
  if (candidate.action.kind === 'ron') {
    const offered = state.lastDiscard?.tile
    return offered
      ? analyzeHand(
          [...state.hands[candidate.seat], offered],
          state.melds[candidate.seat].length,
          visibleTileCounts(state, candidate.seat),
          state.profile,
        )
      : analyzeSeat(state, candidate.seat)
  }
  if (candidate.action.kind === 'tsumo') {
    return analyzeSeat(state, candidate.seat)
  }
  const simulated = applyKnownAction(state, candidate.action)
  if (candidate.action.kind === 'pass' && simulated.result?.kind === 'exhaustive-draw') return null
  return analyzeHand(
    simulated.hands[candidate.seat],
    simulated.melds[candidate.seat].length,
    visibleTileCounts(simulated, candidate.seat),
    state.profile,
  )
}

function compareTuple(left: readonly (number | string)[], right: readonly (number | string)[]): number {
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0
    const b = right[index] ?? 0
    const difference = typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b))
    if (difference !== 0) return difference
  }
  return 0
}

function candidateQualityTuple(
  state: MahjongState,
  candidate: ActionCandidate,
  after: HandAnalysis | null,
): readonly (number | string)[] {
  const action = candidate.action
  if (action.kind === 'tsumo' || action.kind === 'ron') return [-100, action.kind]
  if (action.kind === 'draw') return [-90, action.kind]

  // Advanced value catalogs are intentionally absent. At a call window, Pass
  // is therefore the cautious authored study lead; calls remain inspectable
  // and are never declared objectively best from shape distance alone.
  if (state.phase === 'claim' && action.kind === 'pass') return [-20, action.kind]
  if (action.kind === 'chi' || action.kind === 'pon' || action.kind === 'kan') {
    return [
      -10,
      after?.shanten ?? 99,
    ]
  }

  const tile = actionTile(state, candidate)
  return [
    0,
    after?.shanten ?? 99,
    -(after?.ukeire ?? 0),
    -(after?.improvements.length ?? 0),
  ]
}

function candidateTieBreak(state: MahjongState, candidate: ActionCandidate): readonly (number | string)[] {
  const tile = actionTile(state, candidate)
  return tile
    ? [tileTypeIndex(tile.type), tile.copy]
    : [canonicalAction(candidate.action)]
}

export interface RankedCandidate {
  candidate: ActionCandidate
  analysisAfter: HandAnalysis | null
  recommendation: CandidateRecommendation
}

function recommendationBasis(action: Action): Pick<CandidateRecommendation, 'evidence' | 'labelKey' | 'helpKey'> {
  if (action.kind === 'draw') {
    return { evidence: 'exact', labelKey: 'candidate.lead.exact', helpKey: 'candidate.leadHelp.draw' }
  }
  if (action.kind === 'ron' || action.kind === 'tsumo') {
    return { evidence: 'exact', labelKey: 'candidate.lead.shapeExact', helpKey: 'candidate.leadHelp.complete' }
  }
  if (action.kind === 'pass') {
    return { evidence: 'authored', labelKey: 'candidate.lead.authored', helpKey: 'candidate.leadHelp.pass' }
  }
  if (action.kind === 'chi' || action.kind === 'pon' || action.kind === 'kan') {
    return { evidence: 'calculated', labelKey: 'candidate.lead.calculated', helpKey: 'candidate.leadHelp.call' }
  }
  return { evidence: 'calculated', labelKey: 'candidate.lead.calculated', helpKey: 'candidate.leadHelp.discard' }
}

/**
 * Orders only current legal candidates. Discards use supported-shape shanten,
 * unseen-copy ukeire, then improving-kind count; canonical tile order breaks
 * only otherwise equal ties. No wall order or concealed opponent hand is
 * consulted, and the output never mutates the table.
 */
export function rankLegalCandidates(
  state: MahjongState,
  supplied: readonly ActionCandidate[] = legalActions(state, actorId(state.activeSeat)),
): RankedCandidate[] {
  const legal = legalActions(state, actorId(state.activeSeat))
  const accepted = supplied.flatMap((candidate) => {
    const authoritative = legal.find((item) => item.id === candidate.id)
    return authoritative && canonicalAction(candidate) === canonicalAction(authoritative) ? [authoritative] : []
  })
  const ranked = accepted.map((candidate) => {
    const analysisAfter = analysisAfterCandidate(state, candidate)
    return {
      candidate,
      analysisAfter,
      quality: candidateQualityTuple(state, candidate, analysisAfter),
      tieBreak: candidateTieBreak(state, candidate),
    }
  }).sort((left, right) => compareTuple(left.quality, right.quality) || compareTuple(left.tieBreak, right.tieBreak))

  const bestQuality = ranked[0]?.quality
  let displayedRank = 1

  return ranked.map((item, index) => {
    if (index > 0 && compareTuple(item.quality, ranked[index - 1]!.quality) !== 0) displayedRank = index + 1
    return {
      candidate: item.candidate,
      analysisAfter: item.analysisAfter,
      recommendation: {
        rank: displayedRank,
        total: ranked.length,
        suggested: bestQuality != null && compareTuple(item.quality, bestQuality) === 0,
        ...recommendationBasis(item.candidate.action),
        reasonKey: `preview.${item.candidate.action.kind}.why`,
        params: item.analysisAfter ? {
          shanten: item.analysisAfter.shanten ?? 0,
          ukeire: item.analysisAfter.ukeire,
          kinds: item.analysisAfter.improvements.length,
        } : {},
      },
    }
  })
}

function facetsForPreview(
  state: MahjongState,
  candidate: ActionCandidate,
  before: HandAnalysis | null,
  after: HandAnalysis | null,
): TeachingFacet[] {
  const tile = actionTile(state, candidate)
  const safetyCount = tile ? discardSafety(state, candidate.seat, tile.type) : 0
  const publicCopies = tile ? visibleTileCounts(state, candidate.seat)[tile.type] ?? 0 : 0
  const profile = PROFILES[state.profile]
  const facets: TeachingFacet[] = []
  if (after) {
    facets.push({
      id: 'shape', evidence: 'calculated', titleKey: 'facet.shape.title', bodyKey: 'facet.shape.development',
      params: {
        before: before?.shanten ?? 0,
        after: after.shanten ?? 0,
        beforeMode: before?.mode ?? 'unsupported',
        afterMode: after.mode,
        route: after.bestRoute ?? before?.bestRoute ?? 'standard',
        pairs: after.pairs,
      },
    })
  }
  if (after?.mode === 'draw') {
    facets.push({
      id: 'ukeire', evidence: 'calculated', titleKey: 'facet.ukeire.title', bodyKey: 'facet.ukeire.development',
      params: {
        count: after.ukeire,
        kinds: after.improvements.length,
        tenpai: after.tenpai ? 1 : 0,
      },
    })
  }
  if (tile) {
    facets.push({
      id: 'safety', evidence: 'exact', titleKey: 'facet.safety.title', bodyKey: 'facet.safety.body',
      params: { opponents: safetyCount, visible: publicCopies, tile: tile.type },
    })
  }
  if (candidate.action.kind === 'chi' || candidate.action.kind === 'pon' || candidate.action.kind === 'kan' || candidate.action.kind === 'pass') {
    facets.push({
      id: 'openness', evidence: 'exact', titleKey: 'facet.openness.title', bodyKey: 'facet.openness.body',
      params: {
        before: before?.openMeldCount ?? state.melds[candidate.seat].length,
        after: after?.openMeldCount ?? state.melds[candidate.seat].length,
        action: candidate.action.kind,
      },
    })
  }
  facets.push(
    {
      id: 'value', evidence: 'authored', titleKey: 'facet.value.title', bodyKey: 'facet.value.body',
      params: { profile: profile.id, tileClass: tile ? (isTerminalOrHonor(tile.type) ? 'terminal-or-honor' : 'simple') : 'none' },
    },
    {
      id: 'tempo', evidence: 'exact', titleKey: 'facet.tempo.title', bodyKey: 'facet.tempo.body',
      params: { wall: state.wall.length, turn: state.turn, phase: state.phase },
    },
  )
  return facets
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
  const offeredCompletionTile = authoritative.action.kind === 'ron' ? state.lastDiscard?.tile ?? null : null
  const handAfter = simulated
    ? structuredClone(offeredCompletionTile ? [...simulated.hands[authoritative.seat], offeredCompletionTile] : simulated.hands[authoritative.seat])
    : null
  const terminalPass = authoritative.action.kind === 'pass' && simulated?.result?.kind === 'exhaustive-draw'
  const after = simulated && !terminalPass
    ? analyzeHand(
        offeredCompletionTile ? [...simulated.hands[authoritative.seat], offeredCompletionTile] : simulated.hands[authoritative.seat],
        simulated.melds[authoritative.seat].length,
        visibleTileCounts(simulated, authoritative.seat),
        state.profile,
      )
    : null
  const tile = actionTile(state, authoritative)
  const recommendation = rankLegalCandidates(state).find((item) => item.candidate.id === authoritative.id)?.recommendation
    ?? {
      rank: 1,
      total: 1,
      suggested: true,
      ...recommendationBasis(authoritative.action),
      reasonKey: `preview.${authoritative.action.kind}.why`,
      params: {},
    }
  const params: Record<string, string | number> = {
    action: authoritative.action.kind,
    tile: tile?.type ?? 'hidden',
    beforeUkeire: before.ukeire,
    beforeShanten: before.shanten ?? 0,
    wall: state.wall.length,
  }
  if (after) {
    params.afterUkeire = after.ukeire
    params.afterShanten = after.shanten ?? 0
    params.afterKinds = after.improvements.length
    params.improving = after.improvements.slice(0, 8).map((item) => tileGlyph(item.type)).join(' · ') || '—'
  }
  return {
    candidate: authoritative,
    legal: true,
    hypothetical: true,
    analysisToken: publicView(state, actorId(authoritative.seat)).viewToken,
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
    analysisAfterUnavailableKey: authoritative.action.kind === 'draw'
      ? 'analysis.afterHiddenDrawUnavailable'
      : terminalPass ? 'result.exhaustive' : null,
    recommendation,
  }
}

export function evaluate(state: MahjongState): GameResult | null {
  return structuredClone(state.result)
}

export function chooseDeterministicBotAction(state: MahjongState): ActionCandidate {
  const candidates = legalActions(state, actorId(state.activeSeat))
  const completion = candidates.find((candidate) => candidate.action.kind === 'tsumo' || candidate.action.kind === 'ron')
  if (completion) return completion
  const forced = candidates.find((candidate) => candidate.action.kind === 'draw')
  if (forced) return forced
  const pass = candidates.find((candidate) => candidate.action.kind === 'pass')
  if (state.phase === 'claim' && pass) return pass
  const discards = candidates.filter((candidate) => candidate.action.kind === 'discard')
  if (discards.length > 0) {
    // Opponents are pacing actors, not teaching engines. Keep their policy
    // cheap, replayable, and clearly non-model. Ordering may use only the
    // actor's own canonical tile, never a full-state authority digest.
    return [...discards].sort((left, right) => {
      const leftTile = actionTile(state, left)
      const rightTile = actionTile(state, right)
      if (!leftTile || !rightTile) return canonicalAction(left.action).localeCompare(canonicalAction(right.action))
      return tileTypeIndex(leftTile.type) - tileTypeIndex(rightTile.type) || leftTile.copy - rightTile.copy
    })[0]!
  }
  if (candidates[0]) return candidates[0]
  throw new MahjongRuleError('ILLEGAL_ACTION')
}
