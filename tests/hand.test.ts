import { describe, expect, it } from 'vitest'
import { analyzeHand, isCompleteTypes, waitsForTypes } from '../src/domain/hand'
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

  it('finds the exact single honor wait and counts visible remaining copies', () => {
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
})
