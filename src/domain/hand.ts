import {
  TILE_TYPES,
  type HandAnalysis,
  type HandRoute,
  type ImprovementTile,
  type ProfileId,
  type ShapeFamilyAnalysis,
  type ShapeRole,
  type TileFamily,
  type TileInstance,
  type TileType,
} from './types'
import { PROFILES } from './profiles'
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

function sevenPairUnits(counts: readonly number[], profile: ProfileId): number {
  return PROFILES[profile].sevenPairsMode === 'quad-as-two-pairs'
    ? counts.reduce((total, count) => total + Math.floor(count / 2), 0)
    : counts.filter((count) => count >= 2).length
}

function isCompleteSevenPairs(counts: readonly number[], profile: ProfileId): boolean {
  if (PROFILES[profile].sevenPairsMode === 'quad-as-two-pairs') {
    return counts.every((count) => count % 2 === 0) && sevenPairUnits(counts, profile) === 7
  }
  return counts.filter((count) => count === 2).length === 7
}

export function isCompleteTypes(
  types: readonly TileType[],
  openMeldCount = 0,
  profile: ProfileId = 'riichi',
): boolean {
  const setsNeeded = 4 - openMeldCount
  if (setsNeeded < 0 || types.length !== setsNeeded * 3 + 2) return false
  const counts = countsOf(types)

  if (openMeldCount === 0 && types.length === 14) {
    if (isCompleteSevenPairs(counts, profile)) return true
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

export function waitsForTypes(
  types: readonly TileType[],
  openMeldCount = 0,
  profile: ProfileId = 'riichi',
): TileType[] {
  const targetLength = (4 - openMeldCount) * 3 + 1
  if (types.length !== targetLength) return []
  const counts = countsOf(types)
  return TILE_TYPES.filter((type, index) =>
    (counts[index] ?? 0) < 4 && isCompleteTypes([...types, type], openMeldCount, profile),
  )
}

/**
 * Exact search over the standard four-groups-and-pair shape space. The result
 * is a calculated distance: -1 complete, 0 tenpai, then tiles away. Open melds
 * are already fixed groups and therefore enter the search as completed melds.
 */
export function standardShanten(types: readonly TileType[], openMeldCount = 0): number {
  const counts = countsOf(types)
  const memo = new Map<string, number>()

  const visit = (start: number, melds: number, blocks: number, pair: 0 | 1): number => {
    let index = start
    while (index < counts.length && (counts[index] ?? 0) === 0) index += 1
    if (index >= counts.length) {
      const usableBlocks = Math.min(blocks, Math.max(0, 4 - melds))
      return 8 - melds * 2 - usableBlocks - pair
    }

    const key = `${index}:${melds}:${blocks}:${pair}:${counts.join('')}`
    const known = memo.get(key)
    if (known !== undefined) return known
    let best = 8
    const count = counts[index] ?? 0
    const suited = index < 27
    const suitRank = index % 9

    // Leave one copy unused. Repeating this branch handles duplicate surplus.
    counts[index] = count - 1
    best = Math.min(best, visit(index, melds, blocks, pair))
    counts[index] = count

    if (melds < 4 && count >= 3) {
      counts[index] = count - 3
      best = Math.min(best, visit(index, melds + 1, blocks, pair))
      counts[index] = count
    }
    if (melds < 4 && suited && suitRank <= 6 && (counts[index + 1] ?? 0) > 0 && (counts[index + 2] ?? 0) > 0) {
      counts[index] = count - 1
      counts[index + 1] = (counts[index + 1] ?? 0) - 1
      counts[index + 2] = (counts[index + 2] ?? 0) - 1
      best = Math.min(best, visit(index, melds + 1, blocks, pair))
      counts[index] = count
      counts[index + 1] = (counts[index + 1] ?? 0) + 1
      counts[index + 2] = (counts[index + 2] ?? 0) + 1
    }

    if (pair === 0 && count >= 2) {
      counts[index] = count - 2
      best = Math.min(best, visit(index, melds, blocks, 1))
      counts[index] = count
    }

    if (melds + blocks < 4 && count >= 2) {
      counts[index] = count - 2
      best = Math.min(best, visit(index, melds, blocks + 1, pair))
      counts[index] = count
    }
    if (melds + blocks < 4 && suited && suitRank <= 7 && (counts[index + 1] ?? 0) > 0) {
      counts[index] = count - 1
      counts[index + 1] = (counts[index + 1] ?? 0) - 1
      best = Math.min(best, visit(index, melds, blocks + 1, pair))
      counts[index] = count
      counts[index + 1] = (counts[index + 1] ?? 0) + 1
    }
    if (melds + blocks < 4 && suited && suitRank <= 6 && (counts[index + 2] ?? 0) > 0) {
      counts[index] = count - 1
      counts[index + 2] = (counts[index + 2] ?? 0) - 1
      best = Math.min(best, visit(index, melds, blocks + 1, pair))
      counts[index] = count
      counts[index + 2] = (counts[index + 2] ?? 0) + 1
    }

    memo.set(key, best)
    return best
  }

  return visit(0, openMeldCount, 0, 0)
}

export function sevenPairsShanten(
  types: readonly TileType[],
  openMeldCount = 0,
  profile: ProfileId = 'riichi',
): number | null {
  if (openMeldCount !== 0) return null
  const counts = countsOf(types)
  if (PROFILES[profile].sevenPairsMode === 'quad-as-two-pairs') {
    return 6 - sevenPairUnits(counts, profile)
  }
  const pairKinds = sevenPairUnits(counts, profile)
  const distinctKinds = counts.filter((count) => count > 0).length
  return 6 - pairKinds + Math.max(0, 7 - distinctKinds)
}

export function minimumShanten(
  types: readonly TileType[],
  openMeldCount = 0,
  profile: ProfileId = 'riichi',
): { shanten: number; standard: number; sevenPairs: number | null; route: HandRoute } {
  const standard = standardShanten(types, openMeldCount)
  const sevenPairs = sevenPairsShanten(types, openMeldCount, profile)
  if (sevenPairs != null && sevenPairs < standard) {
    return { shanten: sevenPairs, standard, sevenPairs, route: 'seven-pairs' }
  }
  return { shanten: standard, standard, sevenPairs, route: 'standard' }
}

function familyOf(type: TileType): TileFamily {
  const suit = suitOf(type)
  if (suit === 'm') return 'characters'
  if (suit === 'p') return 'circles'
  if (suit === 's') return 'bamboo'
  return 'honors'
}

function roleOf(type: TileType, counts: readonly number[], profile: ProfileId): ShapeRole {
  const index = tileTypeIndex(type)
  const count = counts[index] ?? 0
  if (count === 4 && PROFILES[profile].sevenPairsMode === 'quad-as-two-pairs') return 'double-pair'
  if (count >= 3) return 'set'
  if (count >= 2) return 'pair'
  const suit = suitOf(type)
  const rank = rankOf(type)
  if (!suit || rank == null) return 'isolated'
  const connected = TILE_TYPES.some((candidate, candidateIndex) => {
    const candidateRank = rankOf(candidate)
    return candidate !== type
      && (counts[candidateIndex] ?? 0) > 0
      && suitOf(candidate) === suit
      && candidateRank != null
      && Math.abs(candidateRank - rank) <= 2
  })
  return connected ? 'connected' : 'isolated'
}

export function shapeFamilies(types: readonly TileType[], profile: ProfileId = 'riichi'): ShapeFamilyAnalysis[] {
  const counts = countsOf(types)
  const families: TileFamily[] = ['characters', 'circles', 'bamboo', 'honors']
  return families.map((family) => {
    const tiles = TILE_TYPES
      .filter((type, index) => familyOf(type) === family && (counts[index] ?? 0) > 0)
      .map((type) => ({ type, copies: counts[tileTypeIndex(type)] ?? 0, role: roleOf(type, counts, profile) }))
    return {
      family,
      tiles,
      pairKinds: tiles.reduce((total, tile) => total + (tile.role === 'double-pair' ? 2 : tile.copies >= 2 ? 1 : 0), 0),
      connectedTiles: tiles.filter((tile) => tile.role === 'connected').reduce((sum, tile) => sum + tile.copies, 0),
      isolatedTiles: tiles.filter((tile) => tile.role === 'isolated').reduce((sum, tile) => sum + tile.copies, 0),
    }
  })
}

export function shapeMetrics(
  types: readonly TileType[],
  profile: ProfileId = 'riichi',
): Pick<HandAnalysis, 'pairs' | 'connected' | 'isolated'> {
  const families = shapeFamilies(types, profile)
  const counts = countsOf(types)
  const pairs = sevenPairUnits(counts, profile)
  const connected = families.reduce((sum, family) => sum + family.connectedTiles, 0)
  const isolated = families.reduce((sum, family) => sum + family.isolatedTiles, 0)
  return {
    pairs,
    connected,
    isolated,
  }
}

export function analyzeHand(
  hand: readonly TileInstance[],
  openMeldCount = 0,
  visibleCounts: Partial<Record<TileType, number>> = {},
  profile: ProfileId = 'riichi',
): HandAnalysis {
  const types = hand.map((tile) => tile.type)
  const expectedDecisionLength = (4 - openMeldCount) * 3 + 2
  const complete = isCompleteTypes(types, openMeldCount, profile)
  const mode = complete
    ? 'complete' as const
    : types.length === expectedDecisionLength - 1
      ? 'draw' as const
      : types.length === expectedDecisionLength
        ? 'discard' as const
        : 'unsupported' as const
  const distance = mode === 'unsupported' ? null : minimumShanten(types, openMeldCount, profile)
  const waits = mode === 'draw' ? waitsForTypes(types, openMeldCount, profile) : []
  const ownCounts = countsOf(types)
  const available = (type: TileType) => Math.max(
    0,
    4 - (visibleCounts[type] ?? (ownCounts[tileTypeIndex(type)] ?? 0)),
  )
  const visibleRemaining = Object.fromEntries(
    TILE_TYPES.map((type) => [type, available(type)]),
  ) as Record<TileType, number>
  const improvements: ImprovementTile[] = []

  if (mode === 'draw' && distance) {
    for (const [index, type] of TILE_TYPES.entries()) {
      const visibleRemaining = available(type)
      if (visibleRemaining <= 0 || (ownCounts[index] ?? 0) >= 4) continue
      const after = minimumShanten([...types, type], openMeldCount, profile)
      if (after.shanten < distance.shanten) {
        improvements.push({
          type,
          visibleRemaining,
          shantenAfterDraw: after.shanten,
          completesShape: isCompleteTypes([...types, type], openMeldCount, profile),
        })
      }
    }
  }

  const metrics = shapeMetrics(types, profile)
  return {
    complete,
    tenpai: mode === 'draw' && waits.length > 0,
    mode,
    shanten: complete ? -1 : distance?.shanten ?? null,
    standardShanten: complete ? -1 : distance?.standard ?? null,
    sevenPairsShanten: complete && openMeldCount === 0
      ? sevenPairsShanten(types, openMeldCount, profile)
      : distance?.sevenPairs ?? null,
    bestRoute: distance?.route ?? (complete ? 'standard' : null),
    waits,
    ukeire: improvements.reduce((total, item) => total + item.visibleRemaining, 0),
    improvingTiles: improvements.map((item) => item.type),
    improvements,
    visibleRemaining,
    families: shapeFamilies(types, profile),
    concealedTileCount: types.length,
    openMeldCount,
    ...metrics,
  }
}
