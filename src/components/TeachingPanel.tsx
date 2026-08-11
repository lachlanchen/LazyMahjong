import { ArrowRight, Check, Eye, Layers3, RotateCcw, ShieldCheck, Sparkles, TimerReset } from 'lucide-react'
import type { ActionCandidate, CandidatePreview, HandAnalysis, TileInstance, TileType } from '../domain/types'
import { tileGlyph } from '../domain/tiles'
import { Tile } from './Tile'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface TeachingPanelProps {
  candidates: ActionCandidate[]
  hand: TileInstance[]
  preview: CandidatePreview | null
  selectedId: string | null
  inspectedId: string | null
  t: Translate
  onInspect: (candidate: ActionCandidate | null) => void
  onSelect: (candidate: ActionCandidate) => void
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
}

function candidateTile(candidate: ActionCandidate, hand: readonly TileInstance[]): TileInstance | null {
  const action = candidate.action
  return action.kind === 'discard' ? hand.find((tile) => tile.id === action.tileId) ?? null : null
}

function actionLabel(candidate: ActionCandidate, hand: readonly TileInstance[], t: Translate): string {
  const tile = candidateTile(candidate, hand)
  if (tile) return `${t(candidate.labelKey)} ${tileGlyph(tile.type)}`
  return t(candidate.labelKey)
}

function AnalysisStrip({ analysis, label, t }: { analysis: HandAnalysis | null; label: string; t: Translate }) {
  if (!analysis) return null
  return (
    <div className="analysis-strip">
      <small>{label}</small>
      <strong>{analysis.complete ? t('analysis.complete') : analysis.tenpai ? t('analysis.tenpai') : t('analysis.notTenpai')}</strong>
      <span>{t('analysis.ukeire', { count: analysis.ukeire })}</span>
      <span className="wait-list">
        {analysis.waits.length > 0 ? (
          <>{t('analysis.waits', { tiles: '' })}{analysis.waits.map((type) => <Tile key={type} type={type} compact />)}</>
        ) : t('analysis.noWaits')}
      </span>
    </div>
  )
}

const facetIcons = {
  shape: Layers3,
  ukeire: Sparkles,
  safety: ShieldCheck,
  value: Eye,
  tempo: TimerReset,
}

export function TeachingPanel({ candidates, hand, preview, selectedId, inspectedId, t, onInspect, onSelect, onConfirm, onCancel, busy }: TeachingPanelProps) {
  const activeId = inspectedId ?? selectedId
  return (
    <aside className="teaching-panel" aria-label={t('candidate.heading')}>
      <div className="candidate-header">
        <div><small>{t('candidate.lab')}</small><h2>{t('candidate.heading')}</h2></div>
        <span className="provenance exact"><Check size={12} /> {t('evidence.exact')}</span>
      </div>
      <p className="candidate-instruction">{candidates.length ? t('candidate.inspect') : t('candidate.empty')}</p>
      <div className="candidate-list">
        {candidates.map((candidate) => {
          const tile = candidateTile(candidate, hand)
          const active = activeId === candidate.id
          const selected = selectedId === candidate.id
          return (
            <button
              key={candidate.id}
              type="button"
              className={`candidate-choice ${active ? 'active' : ''} ${selected ? 'selected' : ''}`}
              onPointerEnter={(event) => { if (event.pointerType !== 'touch') onInspect(candidate) }}
              onPointerLeave={(event) => { if (event.pointerType !== 'touch') onInspect(null) }}
              onFocus={() => onInspect(candidate)}
              onBlur={() => onInspect(null)}
              onClick={() => onSelect(candidate)}
              disabled={busy}
              aria-pressed={selected}
              data-candidate-id={candidate.id}
              data-action={candidate.action.kind}
            >
              {tile ? <Tile tile={tile} compact /> : <span className="action-orb">{candidate.action.kind === 'draw' ? '摸' : candidate.action.kind === 'pass' ? '過' : candidate.action.kind === 'ron' ? '和' : candidate.action.kind === 'tsumo' ? '自' : '鳴'}</span>}
              <span><strong>{actionLabel(candidate, hand, t)}</strong><small>{candidate.id.slice(2, 10)}</small></span>
              <ArrowRight size={15} />
            </button>
          )
        })}
      </div>

      {preview ? (
        <section className="preview-lesson" data-testid="non-mutating-preview" data-candidate-id={preview.candidate.id} aria-live="polite">
          <header>
            <div><small>{t('candidate.selected')}</small><h3>{t(preview.titleKey, preview.params)}</h3></div>
            <span className="preview-lock">{t('candidate.previewBadge')}</span>
          </header>
          <div className="reasoning-ladder">
            {[
              ['preview.order.play', preview.titleKey],
              ['preview.order.because', preview.whyKey],
              ['preview.order.changes', preview.changesKey],
              ['preview.order.reply', preview.replyKey],
              ['preview.order.next', preview.nextKey],
              ['preview.order.principle', preview.principleKey],
            ].map(([labelKey, bodyKey], index) => (
              <div className="reason-step" key={labelKey}>
                <i>{index + 1}</i><span><b>{t(labelKey!)}</b>{t(bodyKey!, preview.params)}</span>
              </div>
            ))}
          </div>

          <div className="analysis-compare">
            <AnalysisStrip analysis={preview.analysisBefore} label={t('analysis.before')} t={t} />
            <ArrowRight size={19} />
            <AnalysisStrip analysis={preview.analysisAfter} label={t('analysis.after')} t={t} />
          </div>

          {preview.handAfter && (
            <div className="hypothetical-hand" aria-label={t('analysis.after')}>
              {preview.handAfter.map((tile) => <Tile key={tile.id} tile={tile} compact />)}
            </div>
          )}

          <div className="facet-grid">
            {preview.facets.map((facet) => {
              const Icon = facetIcons[facet.id]
              return (
                <article key={facet.id} className={`teaching-facet facet-${facet.id}`}>
                  <header><Icon size={15} /><strong>{t(facet.titleKey)}</strong></header>
                  <p>{t(facet.bodyKey, facet.params)}</p>
                  <span className={`provenance ${facet.evidence}`}>{t(`evidence.${facet.evidence}`)}</span>
                </article>
              )
            })}
          </div>
          <footer className="preview-actions">
            <small>{t('candidate.id', { id: preview.candidate.id.slice(2, 12) })}</small>
            {selectedId === preview.candidate.id ? (
              <>
                <button type="button" className="ghost-button" onClick={onCancel} disabled={busy}><RotateCcw size={15} /> {t('candidate.cancel')}</button>
                <button type="button" className="confirm-button" onClick={onConfirm} disabled={busy} data-testid="confirm-action">
                  <Check size={16} /> {t('candidate.confirm', { action: actionLabel(preview.candidate, hand, t) })}
                </button>
              </>
            ) : <span className="hover-note">{t('candidate.inspect')}</span>}
          </footer>
        </section>
      ) : null}
    </aside>
  )
}
