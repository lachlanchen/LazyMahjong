import { TILE_TYPES, type HandAnalysis, type TileInstance, type TileType } from './types'
import { isSuit, rankOf, suitOf, tileTypeIndex } from './tiles'

export function countsOf(types: readonly TileType[]): number[] {
  const counts = Array.from({ length: TILE_TYPES.length }, () => 0)
  for (const type of types) {
    counts[tileTypeIndex(type)] = (counts[tileTypeIndex(type)] ?? 0) + 1
  }
  return counts
}

function canFormSets(counts: number[], setsNeeded: number, memo: Map<string, boolean>): boolean {
  if (setsNeeded === 0) return counts.every((count) => count === 0)
  const key = `${setsNeeded}:${counts.join('')}`
  const known = memo.get(key)
  if (known !== undefined) return known
  const first = counts.findIndex((count) => count > 0)
  if (first < 0) return false

  if ((counts[first] ?? 0) >= 3) {
    counts[first] = (counts[first] ?? 0) - 3
    if (canFormSets(counts, setsNeeded - 1, memo)) {
      counts[first] = (counts[first] ?? 0) + 3
      memo.set(key, true)
      return true
    }
    counts[first] = (counts[first] ?? 0) + 3
  }

  const type = TILE_TYPES[first]
  if (type && isSuit(type)) {
    const rank = rankOf(type)
    if (rank != null && rank <= 7 && (counts[first + 1] ?? 0) > 0 && (counts[first + 2] ?? 0) > 0) {
      counts[first] = (counts[first] ?? 0) - 1
      counts[first + 1] = (counts[first + 1] ?? 0) - 1
      counts[first + 2] = (counts[first + 2] ?? 0) - 1
      if (canFormSets(counts, setsNeeded - 1, memo)) {
        counts[first] = (counts[first] ?? 0) + 1
        counts[first + 1] = (counts[first + 1] ?? 0) + 1
        counts[first + 2] = (counts[first + 2] ?? 0) + 1
        memo.set(key, true)
        return true
      }
      counts[first] = (counts[first] ?? 0) + 1
      counts[first + 1] = (counts[first + 1] ?? 0) + 1
      counts[first + 2] = (counts[first + 2] ?? 0) + 1
    }
  }

  memo.set(key, false)
  return false
}

export function isCompleteTypes(types: readonly TileType[], openMeldCount = 0): boolean {
  const setsNeeded = 4 - openMeldCount
  if (setsNeeded < 0 || types.length !== setsNeeded * 3 + 2) return false
  const counts = countsOf(types)

  if (openMeldCount === 0 && types.length === 14) {
    const pairs = counts.filter((count) => count === 2).length
    if (pairs === 7) return true
  }

  for (let pair = 0; pair < counts.length; pair += 1) {
    if ((counts[pair] ?? 0) < 2) continue
    counts[pair] = (counts[pair] ?? 0) - 2
    const complete = canFormSets(counts, setsNeeded, new Map())
    counts[pair] = (counts[pair] ?? 0) + 2
    if (complete) return true
  }
  return false
}

export function waitsForTypes(types: readonly TileType[], openMeldCount = 0): TileType[] {
  const targetLength = (4 - openMeldCount) * 3 + 1
  if (types.length !== targetLength) return []
  const counts = countsOf(types)
  return TILE_TYPES.filter((type, index) =>
    (counts[index] ?? 0) < 4 && isCompleteTypes([...types, type], openMeldCount),
  )
}

export function shapeMetrics(types: readonly TileType[]): Pick<HandAnalysis, 'shapeScore' | 'pairs' | 'connected' | 'isolated'> {
  const counts = countsOf(types)
  const pairs = counts.filter((count) => count >= 2).length
  let connected = 0
  let isolated = 0

  for (let index = 0; index < TILE_TYPES.length; index += 1) {
    const count = counts[index] ?? 0
    if (count === 0) continue
    const type = TILE_TYPES[index]
    if (!type) continue
    if (!isSuit(type)) {
      if (count === 1) isolated += 1
      continue
    }
    const suit = suitOf(type)
    const rank = rankOf(type)
    const neighbor = TILE_TYPES.some((candidate, candidateIndex) =>
      (counts[candidateIndex] ?? 0) > 0 && suitOf(candidate) === suit && rankOf(candidate) != null && rank != null && Math.abs((rankOf(candidate) ?? 99) - rank) <= 2 && candidate !== type,
    )
    if (neighbor) connected += count
    else isolated += count
  }

  return {
    pairs,
    connected,
    isolated,
    shapeScore: pairs * 3 + connected * 2 - isolated,
  }
}

export function analyzeHand(
  hand: readonly TileInstance[],
  openMeldCount = 0,
  visibleCounts: Partial<Record<TileType, number>> = {},
): HandAnalysis {
  const types = hand.map((tile) => tile.type)
  const complete = isCompleteTypes(types, openMeldCount)
  const waits = complete ? [] : waitsForTypes(types, openMeldCount)
  const metrics = shapeMetrics(types)
  const ownCounts = countsOf(types)
  const available = (type: TileType) => Math.max(0, 4 - (visibleCounts[type] ?? (ownCounts[tileTypeIndex(type)] ?? 0)))
  const ukeire = waits.reduce((total, type) => total + available(type), 0)

  let improvingTiles: TileType[] = waits
  if (!complete && waits.length === 0) {
    improvingTiles = TILE_TYPES.filter((type, index) => {
      if ((visibleCounts[type] ?? ownCounts[index] ?? 0) >= 4) return false
      const improved = shapeMetrics([...types, type])
      return improved.shapeScore > metrics.shapeScore
    })
  }

  return {
    complete,
    tenpai: waits.length > 0,
    waits,
    ukeire: waits.length > 0 ? ukeire : improvingTiles.reduce((total, type) => total + available(type), 0),
    improvingTiles,
    ...metrics,
  }
}
