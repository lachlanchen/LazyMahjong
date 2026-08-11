import { GitBranch, Grid3X3, Layers3 } from 'lucide-react'
import { TILE_TYPES, type HandAnalysis, type ShapeRole, type TileFamily } from '../domain/types'
import { tileGlyph } from '../domain/tiles'
import { Tile } from './Tile'

type Translate = (key: string, params?: Record<string, string | number>) => string

const familyMarks: Record<TileFamily, string> = {
  characters: '萬',
  circles: '筒',
  bamboo: '索',
  honors: '字',
}

const roleOrder: readonly ShapeRole[] = ['set', 'pair', 'double-pair', 'connected', 'isolated']

function statusText(analysis: HandAnalysis, t: Translate): string {
  if (analysis.complete) return t('analysis.complete')
  if (analysis.tenpai) return t('analysis.tenpai')
  if (analysis.shanten == null) return t('analysis.unsupported')
  return t('analysis.shanten', { count: analysis.shanten })
}

export function HandDevelopment({
  analysis,
  label,
  t,
  compact = false,
}: {
  analysis: HandAnalysis
  label: string
  t: Translate
  compact?: boolean
}) {
  const improvementByType = new Map(analysis.improvements.map((item) => [item.type, item]))
  const route = analysis.bestRoute ? t(`analysis.route.${analysis.bestRoute}`) : t('analysis.unsupported')
  const visibleRoles = roleOrder.filter((role) => analysis.families.some((family) => family.tiles.some((tile) => tile.role === role)))
  return (
    <section className={`hand-development ${compact ? 'compact-development' : ''}`} data-mode={analysis.mode}>
      <header>
        <div><small>{label}</small><strong>{statusText(analysis, t)}</strong></div>
        <div className="evidence-pair">
          <span className="provenance calculated">{t('evidence.calculated')}</span>
          {(analysis.tenpai || analysis.complete) && <span className="provenance exact">{t('evidence.exact')}</span>}
        </div>
      </header>

      <div className="development-metrics">
        <span><GitBranch size={13} /><b>{route}</b></span>
        <span><Layers3 size={13} />{t('analysis.shapeSignals', { pairs: analysis.pairs, connected: analysis.connected, isolated: analysis.isolated })}</span>
        {analysis.mode === 'draw'
          ? <span><Grid3X3 size={13} />{t('analysis.improvementSummary', { kinds: analysis.improvements.length, count: analysis.ukeire })}</span>
          : <span><Grid3X3 size={13} />{t('analysis.decisionNeeded')}</span>}
      </div>

      <div className="shape-family-map" aria-label={t('analysis.familyMap')}>
        {analysis.families.map((family) => (
          <article key={family.family} data-family={family.family}>
            <span className="family-mark" title={t(`analysis.family.${family.family}`)}>{familyMarks[family.family]}</span>
            <div>
              {family.tiles.length > 0 ? family.tiles.map((item) => (
                <span
                  className={`shape-tile role-${item.role}`}
                  key={item.type}
                  title={t(`analysis.role.${item.role}`)}
                  aria-label={`${tileGlyph(item.type)} · ${t(`analysis.role.${item.role}`)} · ×${item.copies}`}
                >
                  <Tile type={item.type} compact />
                  {item.copies > 1 && <b>×{item.copies}</b>}
                </span>
              )) : <i>—</i>}
            </div>
          </article>
        ))}
      </div>

      <div className="shape-role-legend" aria-label={t('analysis.familyMap')}>
        {visibleRoles.map((role) => (
          <span key={role}><i className={`role-swatch role-${role}`} aria-hidden="true" />{t(`analysis.role.${role}`)}</span>
        ))}
      </div>

      {analysis.mode === 'draw' && (
        <div className="improvement-map">
          <div className="improvement-heading">
            <strong>{t('analysis.improvementMap')}</strong>
            <span>{t('analysis.improvementLegend')}</span>
          </div>
          <div className="tile-type-grid" role="list" aria-label={t('analysis.improvementMap')}>
            {TILE_TYPES.map((type) => {
              const improvement = improvementByType.get(type)
              return (
                <span
                  role="listitem"
                  key={type}
                  className={`improvement-cell ${improvement ? 'useful' : ''} ${improvement?.completesShape ? 'winning' : ''}`}
                  aria-label={`${tileGlyph(type)} · ${t(improvement?.completesShape ? 'analysis.tileWinning' : improvement ? 'analysis.tileUseful' : 'analysis.tileNotUseful', {
                    count: analysis.visibleRemaining[type],
                  })}`}
                >
                  <Tile type={type} compact />
                  <b>{analysis.visibleRemaining[type]}</b>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
