import { describe, expect, it } from 'vitest'
import { analyzeHand, isCompleteTypes, minimumShanten, sevenPairsShanten, standardShanten, waitsForTypes } from '../src/domain/hand'
import { composeWall } from '../src/domain/tiles'
import type { TileInstance, TileType } from '../src/domain/types'

const standardComplete = [
  'm1', 'm2', 'm3',
  'm4', 'm5', 'm6',
  'p1', 'p2', 'p3',
  's7', 's8', 's9',
  'east', 'east',
] satisfies TileType[]

function instances(types: TileType[]): TileInstance[] {
  const wall = composeWall('riichi')
  const used = new Set<string>()
  return types.map((type) => {
    const tile = wall.find((item) => item.type === type && !used.has(item.id))
    if (!tile) throw new Error(`missing ${type}`)
    used.add(tile.id)
    return tile
  })
}

describe('completion, waits, and efficiency', () => {
  it('recognizes a representative standard four-groups-and-pair hand', () => {
    expect(isCompleteTypes(standardComplete)).toBe(true)
    expect(isCompleteTypes([...standardComplete.slice(0, 13), 'south'])).toBe(false)
  })

  it('recognizes seven pairs only when the hand is closed', () => {
    const sevenPairs = ['m1', 'm1', 'm9', 'm9', 'p2', 'p2', 'p8', 'p8', 's3', 's3', 's7', 's7', 'red', 'red'] satisfies TileType[]
    expect(isCompleteTypes(sevenPairs)).toBe(true)
    expect(isCompleteTypes(sevenPairs.slice(0, 11), 1)).toBe(false)
  })

  it('applies each declared seven-pairs profile through completion, waits, and shanten', () => {
    const mcrComplete = [
      'm1', 'm1', 'm1', 'm1',
      'm2', 'm2', 'm3', 'm3', 'p1', 'p1', 'p2', 'p2', 'east', 'east',
    ] satisfies TileType[]
    const mcrReady = mcrComplete.slice(0, -1)

    expect(isCompleteTypes(mcrComplete, 0, 'mcr')).toBe(true)
    expect(isCompleteTypes(mcrComplete, 0, 'riichi')).toBe(false)
    expect(isCompleteTypes(mcrComplete, 0, 'hong-kong')).toBe(false)
    expect(sevenPairsShanten(mcrComplete, 0, 'mcr')).toBe(-1)
    expect(sevenPairsShanten(mcrComplete, 0, 'riichi')).toBe(1)
    expect(sevenPairsShanten(mcrComplete, 0, 'hong-kong')).toBe(1)
    expect(minimumShanten(mcrReady, 0, 'mcr')).toMatchObject({ shanten: 0, route: 'seven-pairs' })
    expect(waitsForTypes(mcrReady, 0, 'mcr')).toContain('east')
    expect(waitsForTypes(mcrReady, 0, 'riichi')).not.toContain('east')
    expect(waitsForTypes(mcrReady, 0, 'hong-kong')).not.toContain('east')

    const analysis = analyzeHand(instances(mcrReady), 0, {}, 'mcr')
    expect(analysis).toMatchObject({ tenpai: true, sevenPairsShanten: 0, bestRoute: 'seven-pairs', pairs: 6 })
    expect(analysis.families.flatMap((family) => family.tiles).find((tile) => tile.type === 'm1')).toMatchObject({
      copies: 4,
      role: 'double-pair',
    })
  })

  it('finds the exact single honor wait and counts copies unseen by public information', () => {
    const thirteen = standardComplete.slice(0, 13)
    expect(waitsForTypes(thirteen)).toEqual(['east'])
    const analysis = analyzeHand(instances(thirteen), 0, { east: 2 })
    expect(analysis.tenpai).toBe(true)
    expect(analysis.waits).toEqual(['east'])
    expect(analysis.ukeire).toBe(2)
  })

  it('does not call a 14-tile complete hand tenpai', () => {
    const analysis = analyzeHand(instances(standardComplete))
    expect(analysis.complete).toBe(true)
    expect(analysis.tenpai).toBe(false)
    expect(analysis.waits).toEqual([])
  })

  it('calculates supported-pattern shanten without confusing it with profile scoring', () => {
    const thirteen = standardComplete.slice(0, 13)
    expect(standardShanten(thirteen)).toBe(0)
    expect(minimumShanten(standardComplete).shanten).toBe(-1)

    const sevenPairsTenpai = [
      'm1', 'm1', 'm9', 'm9', 'p2', 'p2', 'p8', 'p8',
      's3', 's3', 's7', 's7', 'red',
    ] satisfies TileType[]
    expect(sevenPairsShanten(sevenPairsTenpai)).toBe(0)
    expect(minimumShanten(sevenPairsTenpai).route).toBe('seven-pairs')
    expect(waitsForTypes(sevenPairsTenpai)).toEqual(['red'])
  })

  it('builds ukeire only from shanten-reducing tiles and copies unseen by public information', () => {
    const thirteen = standardComplete.slice(0, 13)
    const analysis = analyzeHand(instances(thirteen), 0, { east: 3 })
    expect(analysis.mode).toBe('draw')
    expect(analysis.improvements).toEqual([
      { type: 'east', visibleRemaining: 1, shantenAfterDraw: -1, completesShape: true },
    ])
    expect(analysis.ukeire).toBe(1)
    expect(analysis.visibleRemaining.east).toBe(1)
    expect(Object.keys(analysis.visibleRemaining)).toHaveLength(34)
  })

  it('groups shape signals by Mahjong tile family without claiming one forced decomposition', () => {
    const analysis = analyzeHand(instances(standardComplete.slice(0, 13)))
    expect(analysis.families.map((family) => family.family)).toEqual(['characters', 'circles', 'bamboo', 'honors'])
    expect(analysis.families.find((family) => family.family === 'honors')?.tiles).toEqual([
      { type: 'east', copies: 1, role: 'isolated' },
    ])
    expect(analysis.families.find((family) => family.family === 'characters')?.connectedTiles).toBeGreaterThan(0)
  })
})
