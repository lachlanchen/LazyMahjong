import { TILE_TYPES, type ProfileId, type TileInstance, type TileType } from './types'

const glyphs: Record<TileType, string> = {
  m1: '一萬', m2: '二萬', m3: '三萬', m4: '四萬', m5: '五萬', m6: '六萬', m7: '七萬', m8: '八萬', m9: '九萬',
  p1: '一筒', p2: '二筒', p3: '三筒', p4: '四筒', p5: '五筒', p6: '六筒', p7: '七筒', p8: '八筒', p9: '九筒',
  s1: '一索', s2: '二索', s3: '三索', s4: '四索', s5: '五索', s6: '六索', s7: '七索', s8: '八索', s9: '九索',
  east: '東', south: '南', west: '西', north: '北', white: '白', green: '發', red: '中',
}

export function tileGlyph(type: TileType): string {
  return glyphs[type]
}

export function tileTypeIndex(type: TileType): number {
  return TILE_TYPES.indexOf(type)
}

export function tileSort(left: TileInstance, right: TileInstance): number {
  return tileTypeIndex(left.type) - tileTypeIndex(right.type) || left.copy - right.copy
}

export function composeWall(_profile: ProfileId): TileInstance[] {
  return TILE_TYPES.flatMap((type) =>
    ([0, 1, 2, 3] as const).map((copy) => ({ id: `${type}-${copy}`, type, copy })),
  )
}

export function isSuit(type: TileType): boolean {
  return /^[mps][1-9]$/.test(type)
}

export function suitOf(type: TileType): 'm' | 'p' | 's' | null {
  return isSuit(type) ? type[0] as 'm' | 'p' | 's' : null
}

export function rankOf(type: TileType): number | null {
  return isSuit(type) ? Number(type[1]) : null
}

export function isTerminalOrHonor(type: TileType): boolean {
  const rank = rankOf(type)
  return rank == null || rank === 1 || rank === 9
}

export function nextTileType(type: TileType, offset: number): TileType | null {
  const suit = suitOf(type)
  const rank = rankOf(type)
  if (!suit || rank == null) return null
  const nextRank = rank + offset
  if (nextRank < 1 || nextRank > 9) return null
  return `${suit}${nextRank}` as TileType
}
