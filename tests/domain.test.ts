import { describe, expect, it } from 'vitest'
import {
  MahjongRuleError,
  actorId,
  applyAction,
  chooseDeterministicBotAction,
  initialState,
  legalActions,
  publicView,
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
    expect(legalActions(prioritized, actorId('west')).some((candidate) => candidate.action.kind === 'ron')).toBe(true)

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
    expect(JSON.stringify(drawPreview)).not.toContain(hiddenTile.id)
    expect(afterDiscard.wall[0]).toEqual(hiddenTile)
    const afterOpponentDraw = applyAction(afterDiscard, draw)
    const redactedDraw = publicView(afterOpponentDraw, actorId('east')).events.at(-1)
    expect(redactedDraw?.kind).toBe('draw')
    expect(redactedDraw?.tile).toBeNull()
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
