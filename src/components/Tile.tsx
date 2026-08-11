import type { TileInstance, TileType } from '../domain/types'
import { rankOf, suitOf, tileGlyph } from '../domain/tiles'

interface TileProps {
  tile?: TileInstance
  type?: TileType
  hidden?: boolean
  compact?: boolean
  selected?: boolean
  suggested?: boolean
  claimed?: boolean
  disabled?: boolean
  onClick?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
  label?: string
}

export function Tile({ tile, type, hidden = false, compact = false, selected = false, suggested = false, claimed = false, disabled = false, onClick, onPointerEnter, onPointerLeave, onFocus, onBlur, label }: TileProps) {
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
    'mahjong-tile', hidden ? 'hidden-tile' : '', compact ? 'compact-tile' : '', selected ? 'selected' : '', suggested ? 'suggested' : '',
    claimed ? 'claimed' : '', tileType ? `tile-${tileType}` : '', onClick ? 'interactive' : '',
  ].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={label ?? (tileType ? tileGlyph(tileType) : undefined)}
        data-tile-id={tile?.id}
        data-tile-type={tileType}
      >
        {content}
      </button>
    )
  }
  return <span className={className} aria-label={label ?? (hidden || !tileType ? undefined : tileGlyph(tileType))} data-tile-type={tileType}>{content}</span>
}
