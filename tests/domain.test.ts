import { describe, expect, it } from 'vitest'
import {
  MahjongRuleError,
  actorId,
  applyAction,
  chooseDeterministicBotAction,
  initialState,
  legalActions,
  publicView,
  rankLegalCandidates,
  previewAction,
} from '../src/domain/engine'
import { composeWall } from '../src/domain/tiles'
import type { MahjongState, Seat, TileInstance } from '../src/domain/types'

function passAllClaims(state: MahjongState): MahjongState {
  let current = state
  while (current.phase === 'claim') {
    const pass = legalActions(current, actorId(current.activeSeat)).find((candidate) => candidate.action.kind === 'pass')
    if (!pass) throw new Error('expected pass')
    current = applyAction(current, pass)
  }
  return current
}

function lastWallClaimState(kind: 'pon' | 'chi'): MahjongState {
  const state = initialState({ profile: 'riichi', seed: `last-wall-${kind}` })
  const tiles = composeWall('riichi')
  const take = (id: string): TileInstance => tiles.find((tile) => tile.id === id)!
  const southIds = kind === 'pon'
    ? [
        'm1-0', 'm1-1', 'm1-2', 'm4-0', 'm6-0', 'm8-0', 'p2-0',
        'p5-0', 'p8-0', 's2-0', 's5-0', 's8-0', 'white-0',
      ]
    : [
        'm2-0', 'm3-0', 'm5-0', 'm7-0', 'm9-0', 'p2-0', 'p5-0',
        'p8-0', 's2-0', 's5-0', 's8-0', 'white-0', 'red-0',
      ]
  const discarded = take('m1-3')
  const reserved = new Set([...southIds, discarded.id])
  for (const seat of ['east', 'south', 'west', 'north'] as Seat[]) {
    state.hands[seat] = state.hands[seat].filter((tile) => !reserved.has(tile.id))
  }
  state.hands.south = southIds.map(take)
  state.wall = []
  state.rivers.east = [{ tile: discarded, by: 'east', turn: 1, claimed: false }]
  state.lastDiscard = state.rivers.east[0]!
  state.phase = 'claim'
  state.activeSeat = 'south'
  state.claimQueue = ['south']
  return state
}

describe('deterministic table authority', () => {
  it('builds a seeded 136-tile wall with four unique copies of every type', () => {
    const first = initialState({ profile: 'riichi', seed: 'composition-seed' })
    const second = initialState({ profile: 'riichi', seed: 'composition-seed' })
    const allTiles = [
      ...first.wall,
      ...Object.values(first.hands).flat(),
      ...Object.values(first.melds).flatMap((melds) => melds.flatMap((meld) => meld.tiles)),
    ]

    expect(allTiles).toHaveLength(136)
    expect(new Set(allTiles.map((tile) => tile.id)).size).toBe(136)
    for (const type of composeWall('riichi').map((tile) => tile.type)) {
      expect(allTiles.filter((tile) => tile.type === type)).toHaveLength(4)
    }
    expect(first).toEqual(second)
    expect(initialState({ profile: 'riichi', seed: 'another-seed' }).hands.east).not.toEqual(first.hands.east)
  })

  it('enforces seat authority and the legal discard → draw → discard loop', () => {
    const initial = initialState({ profile: 'mcr', seed: 'turn-loop' })
    const eastActions = legalActions(initial, actorId('east'))
    const discard = eastActions.find((candidate) => candidate.action.kind === 'discard')
    expect(eastActions.filter((candidate) => candidate.action.kind === 'discard')).toHaveLength(14)
    expect(legalActions(initial, actorId('south'))).toEqual([])
    expect(discard).toBeDefined()

    const afterDiscard = applyAction(initial, discard!)
    expect(initial.hands.east).toHaveLength(14)
    expect(afterDiscard.hands.east).toHaveLength(13)
    expect(afterDiscard.turn).toBe(1)

    const southDrawState = passAllClaims(afterDiscard)
    expect(southDrawState.activeSeat).toBe('south')
    expect(southDrawState.phase).toBe('draw')
    const draw = legalActions(southDrawState, actorId('south'))[0]
    expect(draw?.action.kind).toBe('draw')
    const afterDraw = applyAction(southDrawState, draw!)
    expect(afterDraw.wall).toHaveLength(southDrawState.wall.length - 1)
    expect(afterDraw.hands.south).toHaveLength(14)
    expect(afterDraw.phase).toBe('discard')
  })

  it('redacts every non-viewer hand, wall order, seed, and private opponent draw', () => {
    const state = initialState({ profile: 'hong-kong', seed: 'private-seed-value' })
    const eastView = publicView(state, actorId('east'))
    const spectatorView = publicView(state, 'spectator')

    expect(Array.isArray(eastView.players.find((player) => player.seat === 'east')?.hand)).toBe(true)
    for (const seat of ['south', 'west', 'north'] as Seat[]) {
      expect(eastView.players.find((player) => player.seat === seat)?.hand).toEqual({ hidden: true, count: 13 })
    }
    expect(spectatorView.players.every((player) => !Array.isArray(player.hand))).toBe(true)
    expect(JSON.stringify(eastView)).not.toContain('private-seed-value')
    expect(eastView).not.toHaveProperty('wall')
    expect(eastView).not.toHaveProperty('seed')
    expect(eastView).not.toHaveProperty('stateToken')

    const hiddenVariant = structuredClone(state)
    ;[hiddenVariant.wall[0], hiddenVariant.wall[1]] = [hiddenVariant.wall[1]!, hiddenVariant.wall[0]!]
    ;[hiddenVariant.hands.south[0], hiddenVariant.hands.west[0]] = [hiddenVariant.hands.west[0]!, hiddenVariant.hands.south[0]!]
    const originalCandidate = legalActions(state, actorId('east'))[0]!
    const hiddenVariantCandidate = legalActions(hiddenVariant, actorId('east'))[0]!
    expect(originalCandidate.id).not.toBe(hiddenVariantCandidate.id)
    expect(originalCandidate).not.toHaveProperty('stateToken')
    expect(publicView(hiddenVariant, actorId('east'))).toEqual(eastView)
  })

  it('keeps deterministic bot ordering independent of the concealed wall order', () => {
    const state = initialState({ profile: 'riichi', seed: 'bot-wall-1' })
    const hiddenVariant = structuredClone(state)
    hiddenVariant.wall.reverse()

    expect(publicView(hiddenVariant, actorId('east'))).toEqual(publicView(state, actorId('east')))
    expect(chooseDeterministicBotAction(hiddenVariant).action).toEqual(chooseDeterministicBotAction(state).action)
  })

  it('conceals claim eligibility from non-claimants without weakening the authoritative queue', () => {
    const state = initialState({ profile: 'riichi', seed: 'valid-claim-leak-1' })
    const noClaimVariant = structuredClone(state)
    const replacement = noClaimVariant.wall.splice(0, noClaimVariant.hands.south.length)
    noClaimVariant.wall.push(...noClaimVariant.hands.south)
    noClaimVariant.hands.south = replacement

    expect(publicView(noClaimVariant, actorId('east'))).toEqual(publicView(state, actorId('east')))
    const discardType = 'm2-0'
    const discard = legalActions(state, actorId('east')).find(
      (candidate) => candidate.action.kind === 'discard' && candidate.action.tileId === discardType,
    )
    const variantDiscard = legalActions(noClaimVariant, actorId('east')).find(
      (candidate) => candidate.action.kind === 'discard' && candidate.action.tileId === discardType,
    )
    expect(discard).toBeDefined()
    expect(variantDiscard).toBeDefined()

    const hiddenClaim = applyAction(state, discard!)
    const ordinaryAdvance = applyAction(noClaimVariant, variantDiscard!)
    expect(hiddenClaim.phase).toBe('claim')
    expect(hiddenClaim.activeSeat).toBe('south')
    expect(hiddenClaim.claimQueue[0]).toBe('south')
    expect(legalActions(hiddenClaim, actorId('south')).some((candidate) => candidate.action.kind === 'pass')).toBe(true)
    expect(publicView(hiddenClaim, actorId('south')).phase).toBe('claim')
    expect(ordinaryAdvance.phase).toBe('draw')
    expect(ordinaryAdvance.activeSeat).toBe('south')

    const eastDuringClaim = publicView(hiddenClaim, actorId('east'))
    expect(eastDuringClaim).toEqual(publicView(ordinaryAdvance, actorId('east')))
    expect(eastDuringClaim.phase).toBe('draw')
    expect(eastDuringClaim.activeSeat).toBe('south')
    expect(publicView(hiddenClaim, 'spectator')).toEqual(publicView(ordinaryAdvance, 'spectator'))

    const afterHiddenPasses = passAllClaims(hiddenClaim)
    expect(afterHiddenPasses.phase).toBe('draw')
    expect(publicView(afterHiddenPasses, actorId('east'))).toEqual(publicView(ordinaryAdvance, actorId('east')))
    expect(publicView(afterHiddenPasses, actorId('east')).events.some((item) => item.kind === 'pass')).toBe(false)

    const lastWallClaim = structuredClone(state)
    const lastWallNoClaim = structuredClone(noClaimVariant)
    lastWallClaim.wall = []
    lastWallNoClaim.wall = []
    const lastWallDiscard = legalActions(lastWallClaim, actorId('east')).find(
      (candidate) => candidate.action.kind === 'discard' && candidate.action.tileId === discardType,
    )!
    const lastWallVariantDiscard = legalActions(lastWallNoClaim, actorId('east')).find(
      (candidate) => candidate.action.kind === 'discard' && candidate.action.tileId === discardType,
    )!
    const pendingAtExhaustion = applyAction(lastWallClaim, lastWallDiscard)
    const exhaustedWithoutClaim = applyAction(lastWallNoClaim, lastWallVariantDiscard)
    expect(pendingAtExhaustion.phase).toBe('claim')
    expect(exhaustedWithoutClaim.phase).toBe('finished')
    expect(publicView(pendingAtExhaustion, actorId('east'))).toEqual(publicView(exhaustedWithoutClaim, actorId('east')))
  })

  it('keeps last-wall calls executable without offering an impossible kan supplement', () => {
    const ponState = lastWallClaimState('pon')
    const ponActions = legalActions(ponState, actorId('south'))
    expect(ponActions.map((candidate) => candidate.action.kind)).toEqual(['pon', 'pass'])
    expect(ponActions.some((candidate) => candidate.action.kind === 'kan')).toBe(false)

    const pon = ponActions.find((candidate) => candidate.action.kind === 'pon')!
    const ponPreview = previewAction(ponState, pon)
    expect(ponPreview.changesKey).toBe('preview.pon.changes')
    expect(ponPreview.params.wall).toBe(0)
    const afterPon = applyAction(ponState, pon)
    expect(afterPon).toMatchObject({ activeSeat: 'south', phase: 'discard' })
    expect(afterPon.wall).toHaveLength(0)
    expect(afterPon.melds.south.at(-1)?.kind).toBe('pon')
    const ponDiscard = legalActions(afterPon, actorId('south')).find((candidate) => candidate.action.kind === 'discard')!
    const afterPonPasses = passAllClaims(applyAction(afterPon, ponDiscard))
    expect(afterPonPasses).toMatchObject({ phase: 'finished', result: { kind: 'exhaustive-draw' } })

    const chiState = lastWallClaimState('chi')
    const chiActions = legalActions(chiState, actorId('south'))
    expect(chiActions.map((candidate) => candidate.action.kind)).toEqual(['chi', 'pass'])
    const afterChi = applyAction(chiState, chiActions[0]!)
    expect(afterChi).toMatchObject({ activeSeat: 'south', phase: 'discard' })
    expect(afterChi.wall).toHaveLength(0)
    expect(afterChi.melds.south.at(-1)?.kind).toBe('chi')
    const chiDiscard = legalActions(afterChi, actorId('south')).find((candidate) => candidate.action.kind === 'discard')!
    const afterChiPasses = passAllClaims(applyAction(afterChi, chiDiscard))
    expect(afterChiPasses).toMatchObject({ phase: 'finished', result: { kind: 'exhaustive-draw' } })
  })

  it('projects a private last-wall call window as the same public exhaustive result as passing', () => {
    const pending = lastWallClaimState('pon')
    const eastProjection = publicView(pending, actorId('east'))
    const spectatorProjection = publicView(pending, 'spectator')
    expect(publicView(pending, actorId('south')).phase).toBe('claim')
    expect(eastProjection).toMatchObject({ phase: 'finished', drawPileCount: 0, result: { kind: 'exhaustive-draw' } })
    expect(spectatorProjection).toMatchObject({ phase: 'finished', drawPileCount: 0, result: { kind: 'exhaustive-draw' } })

    const pass = legalActions(pending, actorId('south')).find((candidate) => candidate.action.kind === 'pass')!
    const passPreview = previewAction(pending, pass)
    expect(passPreview.analysisAfter).toBeNull()
    expect(passPreview.analysisAfterUnavailableKey).toBe('result.exhaustive')
    expect(passPreview.facets.some((facet) => facet.evidence === 'calculated')).toBe(false)
    const settled = applyAction(pending, pass)
    expect(publicView(settled, actorId('east'))).toEqual(eastProjection)
    expect(publicView(settled, 'spectator')).toEqual(spectatorProjection)
  })

  it('never lets a lower-priority pon suppress another seat\'s pending ron', () => {
    const state = initialState({ profile: 'riichi', seed: 'ron-priority' })
    const all = composeWall('riichi')
    const take = (id: string): TileInstance => all.find((tile) => tile.id === id)!
    const south = [
      take('m1-1'), take('m1-2'), take('m5-0'), take('m7-0'), take('m9-0'),
      take('p2-0'), take('p4-0'), take('p6-0'), take('s4-0'), take('s6-0'),
      take('s8-0'), take('east-0'), take('south-0'),
    ]
    const west = [
      take('m2-1'), take('m3-1'), take('p1-1'), take('p2-1'), take('p3-1'),
      take('s1-1'), take('s2-1'), take('s3-1'), take('white-0'), take('white-1'),
      take('white-2'), take('red-0'), take('red-1'),
    ]
    const discarded = take('m1-0')
    state.hands.south = south
    state.hands.west = west
    const reserved = new Set([...south, ...west, discarded].map((tile) => tile.id))
    state.hands.east = [discarded, ...all.filter((tile) => !reserved.has(tile.id)).slice(0, 13)]
    state.phase = 'discard'
    state.activeSeat = 'east'

    const discard = legalActions(state, actorId('east')).find(
      (candidate) => candidate.action.kind === 'discard' && candidate.action.tileId === discarded.id,
    )!
    const prioritized = applyAction(state, discard)
    expect(prioritized.claimQueue[0]).toBe('west')
    const westRon = legalActions(prioritized, actorId('west')).find((candidate) => candidate.action.kind === 'ron')
    expect(westRon).toBeDefined()
    const ronPreview = previewAction(prioritized, westRon!)
    expect(ronPreview.analysisBefore?.tenpai).toBe(true)
    expect(ronPreview.analysisAfter?.complete).toBe(true)
    expect(ronPreview.handAfter).toHaveLength(14)
    expect(ronPreview.recommendation).toMatchObject({
      evidence: 'exact',
      labelKey: 'candidate.lead.shapeExact',
      helpKey: 'candidate.leadHelp.complete',
    })

    // Even a malformed/stale queue order fails closed: South may only pass
    // while West still has a higher-priority win response.
    const reordered = structuredClone(prioritized)
    reordered.activeSeat = 'south'
    reordered.claimQueue = ['south', 'west']

    const southActions = legalActions(reordered, actorId('south'))
    expect(southActions.some((candidate) => candidate.action.kind === 'ron')).toBe(false)
    expect(southActions.some((candidate) => candidate.action.kind === 'pon')).toBe(false)
    expect(southActions.map((candidate) => candidate.action.kind)).toEqual(['pass'])
    const passed = applyAction(reordered, southActions[0]!)
    expect(passed.activeSeat).toBe('west')
    expect(legalActions(passed, actorId('west')).some((candidate) => candidate.action.kind === 'ron')).toBe(true)
  })

  it('keeps previews immutable and never reveals the next wall tile before a draw is confirmed', () => {
    const state = initialState({ profile: 'riichi', seed: 'preview-envelope' })
    const before = structuredClone(state)
    const discard = legalActions(state, actorId('east')).find((candidate) => candidate.action.kind === 'discard')!
    const discardPreview = previewAction(state, discard)
    expect(state).toEqual(before)
    expect(discardPreview.hypothetical).toBe(true)
    expect(discardPreview.handAfter).toHaveLength(13)

    const afterDiscard = passAllClaims(applyAction(state, discard))
    const draw = legalActions(afterDiscard, actorId(afterDiscard.activeSeat)).find((candidate) => candidate.action.kind === 'draw')!
    const hiddenTile = afterDiscard.wall[0]!
    const drawPreview = previewAction(afterDiscard, draw)
    expect(drawPreview.handAfter).toBeNull()
    expect(drawPreview.analysisAfter).toBeNull()
    expect(drawPreview.analysisAfterUnavailableKey).toBe('analysis.afterHiddenDrawUnavailable')
    expect(drawPreview.facets.map((facet) => facet.id)).toEqual(['value', 'tempo'])
    expect(drawPreview.recommendation.params).toEqual({})
    expect(drawPreview.params).not.toHaveProperty('afterShanten')
    expect(drawPreview.params).not.toHaveProperty('afterUkeire')
    expect(drawPreview.params).not.toHaveProperty('afterKinds')
    expect(drawPreview.recommendation).toMatchObject({
      evidence: 'exact',
      labelKey: 'candidate.lead.exact',
      helpKey: 'candidate.leadHelp.draw',
    })
    expect(JSON.stringify(drawPreview)).not.toContain(hiddenTile.id)
    expect(afterDiscard.wall[0]).toEqual(hiddenTile)
    const afterOpponentDraw = applyAction(afterDiscard, draw)
    const redactedDraw = publicView(afterOpponentDraw, actorId('east')).events.at(-1)
    expect(redactedDraw?.kind).toBe('draw')
    expect(redactedDraw?.tile).toBeNull()
  })

  it('keeps calculated suggestions and preview teaching independent of hidden wall and opponent hands', () => {
    const state = initialState({ profile: 'riichi', seed: 'analysis-redaction' })
    const hiddenVariant = structuredClone(state)
    hiddenVariant.wall.reverse()
    ;[hiddenVariant.hands.south, hiddenVariant.hands.west] = [hiddenVariant.hands.west, hiddenVariant.hands.south]

    const summarizeRanking = (position: MahjongState) => rankLegalCandidates(position).map((item) => ({
      action: item.candidate.action,
      rank: item.recommendation.rank,
      suggested: item.recommendation.suggested,
      shanten: item.analysisAfter?.shanten,
      ukeire: item.analysisAfter?.ukeire,
      improvements: item.analysisAfter?.improvements,
    }))
    expect(publicView(hiddenVariant, actorId('east'))).toEqual(publicView(state, actorId('east')))
    expect(summarizeRanking(hiddenVariant)).toEqual(summarizeRanking(state))

    const tileId = state.hands.east[0]!.id
    const original = legalActions(state, actorId('east')).find(
      (item) => item.action.kind === 'discard' && item.action.tileId === tileId,
    )!
    const variant = legalActions(hiddenVariant, actorId('east')).find(
      (item) => item.action.kind === 'discard' && item.action.tileId === tileId,
    )!
    const originalPreview = previewAction(state, original)
    const variantPreview = previewAction(hiddenVariant, variant)
    expect(originalPreview.analysisToken).toBe(variantPreview.analysisToken)
    expect(originalPreview.analysisAfter).toEqual(variantPreview.analysisAfter)
    expect(originalPreview.facets).toEqual(variantPreview.facets)
    expect(originalPreview.recommendation).toEqual(variantPreview.recommendation)
    expect(JSON.stringify(originalPreview)).not.toContain(state.wall[0]!.id)
  })

  it('suggests but never selects or applies the strongest supported discard calculation', () => {
    const state = initialState({ profile: 'mcr', seed: 'opening-suggestion' })
    const before = structuredClone(state)
    const ranking = rankLegalCandidates(state)
    const suggested = ranking.find((item) => item.recommendation.suggested)
    expect(suggested?.candidate.action.kind).toBe('discard')
    expect(suggested?.recommendation.rank).toBe(1)
    expect(suggested?.recommendation).toMatchObject({
      evidence: 'calculated',
      labelKey: 'candidate.lead.calculated',
      helpKey: 'candidate.leadHelp.discard',
    })
    expect(suggested?.analysisAfter?.mode).toBe('draw')
    expect(state).toEqual(before)

    const preview = previewAction(state, suggested!.candidate)
    expect(preview.hypothetical).toBe(true)
    expect(preview.analysisToken).toBe(publicView(state, actorId('east')).viewToken)
    expect(state).toEqual(before)
  })

  it('rejects a candidate after the state token changes', () => {
    const state = initialState({ profile: 'riichi', seed: 'stale-candidate' })
    const candidate = legalActions(state, actorId('east')).find((item) => item.action.kind === 'discard')!
    const next = applyAction(state, candidate)

    expect(() => applyAction(next, candidate)).toThrowError(MahjongRuleError)
    try {
      applyAction(next, candidate)
    } catch (error) {
      expect((error as MahjongRuleError).code).toMatch(/STALE_CANDIDATE|UNAUTHORIZED_ACTOR/)
    }
  })

  it('rejects a candidate envelope changed behind an otherwise current opaque ID', () => {
    const state = initialState({ profile: 'riichi', seed: 'tampered-envelope' })
    const candidate = legalActions(state, actorId('east')).find((item) => item.action.kind === 'discard')!
    const tampered = { ...candidate, action: { kind: 'tsumo' as const } }

    expect(() => applyAction(state, tampered)).toThrowError(MahjongRuleError)
    expect(() => previewAction(state, tampered)).toThrowError(MahjongRuleError)
  })

  it.each(['riichi', 'mcr', 'hong-kong'] as const)('supports a legal sequence call in %s while keeping scoring bounded', (profile) => {
    const state = initialState({ profile, seed: `call-${profile}` })
    const tiles = composeWall(profile)
    const byId = (id: string): TileInstance => tiles.find((tile) => tile.id === id)!
    const desiredSouth = [
      byId('m1-0'), byId('m2-0'), byId('p1-0'), byId('p2-0'), byId('p3-0'), byId('p4-0'), byId('p5-0'),
      byId('s1-0'), byId('s2-0'), byId('s3-0'), byId('east-0'), byId('white-0'), byId('red-0'),
    ]
    const calledTile = byId('m3-0')
    const movedIds = new Set([...desiredSouth.map((tile) => tile.id), calledTile.id])
    const displaced = state.hands.south.filter((tile) => !movedIds.has(tile.id))
    state.wall = [...state.wall.filter((tile) => !movedIds.has(tile.id)), ...displaced]
    for (const seat of ['east', 'south', 'west', 'north'] as Seat[]) {
      state.hands[seat] = state.hands[seat].filter((tile) => !movedIds.has(tile.id))
    }
    state.hands.south = desiredSouth
    const discard = { tile: calledTile, by: 'east' as const, turn: 1, claimed: false }
    state.rivers.east = [discard]
    state.lastDiscard = discard
    state.phase = 'claim'
    state.activeSeat = 'south'
    state.claimQueue = ['south']

    const chi = legalActions(state, actorId('south')).find((candidate) => candidate.action.kind === 'chi')
    expect(chi).toBeDefined()
    expect(rankLegalCandidates(state)[0]?.candidate.action.kind).toBe('pass')
    const ranked = rankLegalCandidates(state)
    expect(ranked.find((item) => item.candidate.action.kind === 'pass')?.recommendation).toMatchObject({
      evidence: 'authored',
      labelKey: 'candidate.lead.authored',
      helpKey: 'candidate.leadHelp.pass',
    })
    expect(ranked.find((item) => item.candidate.action.kind === 'chi')?.recommendation).toMatchObject({
      evidence: 'calculated',
      labelKey: 'candidate.lead.calculated',
      helpKey: 'candidate.leadHelp.call',
    })
    const callPreview = previewAction(state, chi!)
    expect(callPreview.analysisAfter?.openMeldCount).toBe(1)
    expect(callPreview.analysisAfter?.mode).toBe('discard')
    expect(callPreview.facets.find((facet) => facet.id === 'openness')?.params).toMatchObject({
      before: 0,
      after: 1,
      action: 'chi',
    })
    const called = applyAction(state, chi!)
    expect(called.melds.south[0]?.kind).toBe('chi')
    expect(called.melds.south[0]?.tiles.map((tile) => tile.type)).toEqual(['m1', 'm2', 'm3'])
    expect(called.phase).toBe('discard')
    expect(called.activeSeat).toBe('south')
    const physicalTiles = [
      ...called.wall,
      ...Object.values(called.hands).flat(),
      ...Object.values(called.melds).flatMap((melds) => melds.flatMap((meld) => meld.tiles)),
      ...Object.values(called.rivers).flatMap((river) => river.map((item) => item.tile)),
    ]
    expect(new Set(physicalTiles.map((tile) => tile.id)).size).toBe(physicalTiles.length)
  })

  it('labels tsumo, pon, and kan recommendations with their action-specific basis', () => {
    const tiles = composeWall('mcr')
    const take = (id: string): TileInstance => tiles.find((tile) => tile.id === id)!
    const complete = initialState({ profile: 'mcr', seed: 'tsumo-provenance' })
    complete.hands.east = [
      take('m1-0'), take('m2-0'), take('m3-0'),
      take('m4-0'), take('m5-0'), take('m6-0'),
      take('p1-0'), take('p2-0'), take('p3-0'),
      take('s7-0'), take('s8-0'), take('s9-0'),
      take('east-0'), take('east-1'),
    ]
    const tsumo = rankLegalCandidates(complete).find((item) => item.candidate.action.kind === 'tsumo')
    expect(tsumo?.recommendation).toMatchObject({
      evidence: 'exact',
      labelKey: 'candidate.lead.shapeExact',
      helpKey: 'candidate.leadHelp.complete',
    })

    const claim = initialState({ profile: 'mcr', seed: 'triplet-call-provenance' })
    claim.hands.south = [
      take('m1-0'), take('m1-1'), take('m1-2'),
      take('m4-0'), take('m6-0'), take('p2-0'), take('p5-0'), take('p8-0'),
      take('s2-0'), take('s5-0'), take('s8-0'), take('white-0'), take('red-0'),
    ]
    claim.lastDiscard = { tile: take('m1-3'), by: 'east', turn: 1, claimed: false }
    claim.rivers.east = [claim.lastDiscard]
    claim.phase = 'claim'
    claim.activeSeat = 'south'
    claim.claimQueue = ['south']
    const rankedCalls = rankLegalCandidates(claim)
    for (const kind of ['pon', 'kan'] as const) {
      expect(rankedCalls.find((item) => item.candidate.action.kind === kind)?.recommendation).toMatchObject({
        evidence: 'calculated',
        labelKey: 'candidate.lead.calculated',
        helpKey: 'candidate.leadHelp.call',
      })
    }
  })

  it.each(['riichi', 'mcr', 'hong-kong'] as const)(
    'treats a %s Ron as exact supported-shape mechanics without claiming scoring eligibility',
    (profile) => {
      const state = initialState({ profile, seed: `shape-only-ron-${profile}` })
      const tiles = composeWall(profile)
      const take = (id: string): TileInstance => tiles.find((tile) => tile.id === id)!
      state.hands.south = [
        take('m1-0'), take('m2-0'), take('m3-0'),
        take('m4-0'), take('m5-0'), take('m6-0'),
        take('p7-0'), take('p8-0'), take('p9-0'),
        take('s1-0'), take('s2-0'), take('s3-0'),
        take('east-0'),
      ]
      const offered = take('east-1')
      state.rivers.east = [{ tile: offered, by: 'east', turn: 1, claimed: false }]
      state.lastDiscard = state.rivers.east[0]!
      state.phase = 'claim'
      state.activeSeat = 'south'
      state.claimQueue = ['south']

      const ron = legalActions(state, actorId('south')).find((candidate) => candidate.action.kind === 'ron')
      expect(ron).toBeDefined()
      const ranked = rankLegalCandidates(state, [ron!])[0]!
      expect(ranked.recommendation).toMatchObject({
        evidence: 'exact',
        labelKey: 'candidate.lead.shapeExact',
        helpKey: 'candidate.leadHelp.complete',
      })
      expect(previewAction(state, ron!).analysisAfter?.complete).toBe(true)

      const completed = applyAction(state, ron!)
      expect(completed.result).toMatchObject({
        kind: 'ron',
        exactShape: true,
        scoringStatusKey: `result.${profile}.scoring-unsupported`,
      })
    },
  )

  it('uses improving-kind count as the disclosed third ranking criterion', () => {
    const state = initialState({ profile: 'riichi', seed: 'tie-doc-8' })
    const ranked = rankLegalCandidates(state)
    const byType = (type: string) => ranked.find((item) => {
      const action = item.candidate.action
      if (action.kind !== 'discard') return false
      return state.hands.east.find((tile) => tile.id === action.tileId)?.type === type
    })
    const stronger = byType('s9')
    const weaker = byType('s2')
    expect(stronger?.analysisAfter).toMatchObject({ shanten: 2, ukeire: 20 })
    expect(weaker?.analysisAfter).toMatchObject({ shanten: 2, ukeire: 20 })
    expect(stronger?.analysisAfter?.improvements).toHaveLength(6)
    expect(weaker?.analysisAfter?.improvements).toHaveLength(5)
    expect(stronger!.recommendation.rank).toBeLessThan(weaker!.recommendation.rank)
  })

  it('can deterministically advance a complete table without losing or duplicating a physical tile', () => {
    let state = initialState({ profile: 'riichi', seed: 'full-table-smoke' })
    let actions = 0
    while (state.phase !== 'finished' && actions < 500) {
      state = applyAction(state, chooseDeterministicBotAction(state))
      actions += 1
    }
    expect(state.phase).toBe('finished')
    expect(actions).toBeLessThan(500)
    const physicalTiles = [
      ...state.wall,
      ...Object.values(state.hands).flat(),
      ...Object.values(state.melds).flatMap((melds) => melds.flatMap((meld) => meld.tiles)),
      ...Object.values(state.rivers).flatMap((river) => river.map((item) => item.tile)),
    ]
    expect(physicalTiles).toHaveLength(136)
    expect(new Set(physicalTiles.map((tile) => tile.id)).size).toBe(136)
  })
})
