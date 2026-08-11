import { EyeOff, Layers3, Radio } from 'lucide-react'
import type { HiddenHand, PublicGameView, Seat, TileInstance } from '../domain/types'
import { Tile } from './Tile'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface MahjongTableProps {
  view: PublicGameView
  viewerSeat: Seat
  t: Translate
  automating: boolean
}

function isHidden(hand: TileInstance[] | HiddenHand): hand is HiddenHand {
  return !Array.isArray(hand)
}

const placement: Record<Seat, string> = {
  east: 'seat-bottom', south: 'seat-right', west: 'seat-top', north: 'seat-left',
}

export function MahjongTable({ view, viewerSeat, t, automating }: MahjongTableProps) {
  return (
    <section className="table-shell" aria-label={t('table.round')} data-testid="mahjong-table">
      <div className="mahjong-table">
        <div className="table-center" aria-live="polite">
          <span className="round-mark">東</span>
          <strong>{t('table.round')}</strong>
          <span>{t('table.wall', { count: view.wallCount })}</span>
          <span>{t('table.turn', { turn: view.turn + 1 })} · {t(`phase.${view.phase}`)}</span>
          <small>{t('table.token', { token: view.viewToken.slice(2, 10) })}</small>
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
                  ? Array.from({ length: hiddenHand.count }, (_, index) => <Tile key={index} hidden compact label={t('table.hidden', { count: hiddenHand.count })} />)
                  : revealedHand?.map((tile) => <Tile key={tile.id} tile={tile} compact />)}
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
