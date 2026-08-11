import { EyeOff, Layers3, Radio } from 'lucide-react'
import type { HiddenHand, PublicGameView, Seat, TileInstance } from '../domain/types'
import { Tile } from './Tile'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface MahjongTableProps {
  view: PublicGameView
  viewerSeat: Seat
  t: Translate
  automating: boolean
  suggestedTiles: TileInstance[]
}

function isHidden(hand: TileInstance[] | HiddenHand): hand is HiddenHand {
  return !Array.isArray(hand)
}

const placement: Record<Seat, string> = {
  east: 'seat-bottom', south: 'seat-right', west: 'seat-top', north: 'seat-left',
}

export function MahjongTable({ view, viewerSeat, t, automating, suggestedTiles }: MahjongTableProps) {
  const viewerHand = view.players.find((player) => player.seat === viewerSeat)?.hand
  const viewerTileIds = new Set(Array.isArray(viewerHand) ? viewerHand.map((tile) => tile.id) : [])
  const visibleSuggestedTiles = suggestedTiles.filter((tile) => viewerTileIds.has(tile.id))
  const suggestedTypes = new Set(visibleSuggestedTiles.map((tile) => tile.type))
  return (
    <section className="table-shell" aria-label={t('table.round')} data-testid="mahjong-table">
      <div className="mahjong-table">
        <div className="table-center" aria-live="polite">
          <span className="round-mark">東</span>
          <strong>{t('table.round')}</strong>
          <span>{t('table.wall', { count: view.drawPileCount })}</span>
          <span>{t('table.turn', { turn: view.turn + 1 })} · {t(`phase.${view.phase}`)}</span>
          <small>{t('table.token', { token: view.viewToken.slice(2, 10) })}</small>
          {visibleSuggestedTiles.length > 0 && (
            <span className="table-suggestion">
              <span className="table-suggestion-tiles">{visibleSuggestedTiles.map((tile) => <Tile key={tile.id} tile={tile} compact suggested />)}</span>
              <b>{visibleSuggestedTiles.length > 1
                ? t('candidate.tied', { count: visibleSuggestedTiles.length })
                : t('candidate.lead.calculated')}</b>
            </span>
          )}
          {automating && <span className="thinking"><Radio size={13} /> {t('table.botThinking', { seat: t(`seat.${view.activeSeat}`) })}</span>}
        </div>

        {view.players.map((player) => {
          const hidden = isHidden(player.hand)
          const hiddenHand = hidden ? player.hand as HiddenHand : null
          const revealedHand = hidden ? null : player.hand as TileInstance[]
          return (
            <article
              key={player.seat}
              className={`table-seat ${placement[player.seat]} ${player.isActive ? 'active' : ''} ${player.seat === viewerSeat ? 'viewer' : ''}`}
              data-seat={player.seat}
              data-private={player.seat === viewerSeat}
            >
              <header>
                <span className="seat-wind">{t(`seat.${player.seat}`).slice(0, 1)}</span>
                <div><strong>{t(`seat.${player.seat}`)}</strong><small>{player.isActive ? t('table.active') : t('table.waiting')}</small></div>
                {hiddenHand && <EyeOff size={13} aria-label={t('table.hidden', { count: hiddenHand.count })} />}
              </header>
              <div className="seat-hand" aria-label={hiddenHand ? t('table.hidden', { count: hiddenHand.count }) : t('hand.heading')}>
                {hiddenHand
                  ? <><span className="hidden-hand-stack" aria-hidden="true"><Tile hidden compact /><Tile hidden compact /><Tile hidden compact /></span><b className="hidden-hand-count">×{hiddenHand.count}</b></>
                  : revealedHand?.map((tile) => <Tile key={tile.id} tile={tile} compact suggested={suggestedTypes.has(tile.type)} />)}
              </div>
              {player.melds.length > 0 && (
                <div className="seat-melds" aria-label={t('table.melds')}>
                  <Layers3 size={12} />
                  {player.melds.map((meld, index) => (
                    <span className="meld" key={`${meld.calledTileId}-${index}`} data-meld={meld.kind}>
                      {meld.tiles.map((tile) => <Tile key={tile.id} tile={tile} compact />)}
                    </span>
                  ))}
                </div>
              )}
              <div className="seat-river" aria-label={t('table.river')}>
                {player.river.length === 0
                  ? <small>{t('table.emptyRiver')}</small>
                  : player.river.map((discard) => <Tile key={`${discard.turn}-${discard.tile.id}`} tile={discard.tile} compact claimed={discard.claimed} />)}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
