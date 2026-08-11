import type { TileInstance, TileType } from '../domain/types'
import { rankOf, suitOf, tileGlyph } from '../domain/tiles'

interface TileProps {
  tile?: TileInstance
  type?: TileType
  hidden?: boolean
  compact?: boolean
  selected?: boolean
  claimed?: boolean
  disabled?: boolean
  onClick?: () => void
  label?: string
}

export function Tile({ tile, type, hidden = false, compact = false, selected = false, claimed = false, disabled = false, onClick, label }: TileProps) {
  const tileType = tile?.type ?? type
  const suit = tileType ? suitOf(tileType) : null
  const rank = tileType ? rankOf(tileType) : null
  const content = hidden ? <span className="tile-back-mark">風</span> : tileType ? (
    <>
      {suit && rank != null ? (
        <><strong>{rank}</strong><span>{suit === 'm' ? '萬' : suit === 'p' ? '筒' : '索'}</span></>
      ) : <strong className="honor-glyph">{tileGlyph(tileType)}</strong>}
    </>
  ) : null
  const className = [
    'mahjong-tile', hidden ? 'hidden-tile' : '', compact ? 'compact-tile' : '', selected ? 'selected' : '',
    claimed ? 'claimed' : '', tileType ? `tile-${tileType}` : '', onClick ? 'interactive' : '',
  ].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={label ?? tileType ?? 'concealed tile'}
        data-tile-id={tile?.id}
        data-tile-type={tileType}
      >
        {content}
      </button>
    )
  }
  return <span className={className} aria-label={label ?? (hidden ? 'concealed tile' : tileType)} data-tile-type={tileType}>{content}</span>
}
