import { ArrowRight, Check, DoorOpen, Eye, Layers3, RotateCcw, ShieldCheck, Sparkles, TimerReset } from 'lucide-react'
import type { RankedCandidate } from '../domain/engine'
import type { ActionCandidate, CandidatePreview, HandAnalysis, TileInstance } from '../domain/types'
import { tileGlyph } from '../domain/tiles'
import { HandDevelopment } from './HandDevelopment'
import { Tile } from './Tile'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface TeachingPanelProps {
  rankedCandidates: RankedCandidate[]
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

function shantenText(analysis: HandAnalysis, t: Translate): string {
  if (analysis.complete) return t('analysis.complete')
  if (analysis.tenpai) return t('analysis.tenpai')
  if (analysis.shanten == null) return t('analysis.unsupported')
  return t('analysis.shanten', { count: analysis.shanten })
}

function AnalysisStrip({ analysis, label, t }: { analysis: HandAnalysis | null; label: string; t: Translate }) {
  if (!analysis) return null
  return (
    <div className="analysis-strip" data-mode={analysis.mode}>
      <small>{label}</small>
      <strong>{shantenText(analysis, t)}</strong>
      <span>{analysis.bestRoute ? t(`analysis.route.${analysis.bestRoute}`) : t('analysis.unsupported')}</span>
      {analysis.mode === 'draw' ? (
        <span>{t('analysis.improvementSummary', { count: analysis.ukeire, kinds: analysis.improvements.length })}</span>
      ) : <span>{t('analysis.decisionNeeded')}</span>}
      <span className="wait-list">
        {analysis.waits.length > 0 ? (
          <><span className="provenance exact">{t('evidence.exact')}</span>{t('analysis.waits', { tiles: '' })}{analysis.waits.map((type) => <Tile key={type} type={type} compact />)}</>
        ) : analysis.tenpai ? t('analysis.noWaits') : null}
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
  openness: DoorOpen,
}

const profileNameKeys: Record<string, string> = {
  riichi: 'profile.riichi.name',
  mcr: 'profile.mcr.name',
  'hong-kong': 'profile.hk.name',
}

const phaseKeys: Record<string, string> = {
  draw: 'phase.draw',
  discard: 'phase.discard',
  claim: 'phase.claim',
  finished: 'phase.finished',
}

function localizedShanten(value: string | number, mode: string | number | undefined, t: Translate): string | number {
  if (typeof value !== 'number') return value
  if (value < 0) return t('analysis.complete')
  if (value === 0 && mode === 'draw') return t('analysis.tenpai')
  return t('analysis.shanten', { count: value })
}

function localizedFacetParams(
  facet: CandidatePreview['facets'][number],
  t: Translate,
): Record<string, string | number> {
  const params = { ...facet.params }
  if (facet.id === 'value' && typeof params.profile === 'string') {
    const key = profileNameKeys[params.profile]
    if (key) params.profile = t(key)
  }
  if (facet.id === 'tempo' && typeof params.phase === 'string') {
    const key = phaseKeys[params.phase]
    if (key) params.phase = t(key)
  }
  if (facet.id === 'shape') {
    params.before = localizedShanten(params.before ?? 0, params.beforeMode, t)
    params.after = localizedShanten(params.after ?? 0, params.afterMode, t)
    if (typeof params.route === 'string') params.route = t(`analysis.route.${params.route}`)
  }
  if (facet.id === 'openness' && typeof params.action === 'string') {
    params.action = t(`action.${params.action}`)
  }
  return params
}

interface CandidateGroup {
  lead: RankedCandidate
  ids: string[]
  copies: number
  displayRank: number
  displayTotal: number
  tiedAtRank: number
}

function groupRankedCandidates(ranked: readonly RankedCandidate[], hand: readonly TileInstance[]): CandidateGroup[] {
  const groups: CandidateGroup[] = []
  for (const item of ranked) {
    const tile = candidateTile(item.candidate, hand)
    const existing = tile && item.candidate.action.kind === 'discard'
      ? groups.find((group) => candidateTile(group.lead.candidate, hand)?.type === tile.type)
      : undefined
    if (existing) {
      existing.ids.push(item.candidate.id)
      existing.copies += 1
    } else {
      groups.push({ lead: item, ids: [item.candidate.id], copies: 1, displayRank: 1, displayTotal: 1, tiedAtRank: 1 })
    }
  }
  let displayRank = 1
  return groups.map((group, index) => {
    if (index > 0 && group.lead.recommendation.rank !== groups[index - 1]!.lead.recommendation.rank) {
      displayRank = index + 1
    }
    return {
      ...group,
      displayRank,
      displayTotal: groups.length,
      tiedAtRank: groups.filter((other) => other.lead.recommendation.rank === group.lead.recommendation.rank).length,
    }
  })
}

function supportingTiles(candidate: ActionCandidate, hand: readonly TileInstance[]): TileInstance[] {
  const action = candidate.action
  if (action.kind !== 'chi' && action.kind !== 'pon' && action.kind !== 'kan') return []
  const ids = new Set(action.tileIds)
  return hand.filter((tile) => ids.has(tile.id))
}

export function TeachingPanel({ rankedCandidates, hand, preview, selectedId, inspectedId, t, onInspect, onSelect, onConfirm, onCancel, busy }: TeachingPanelProps) {
  const activeId = inspectedId ?? selectedId
  const groups = groupRankedCandidates(rankedCandidates, hand)
  const previewGroup = preview ? groups.find((group) => group.ids.includes(preview.candidate.id)) : undefined
  const callWindow = rankedCandidates.some((item) => item.candidate.action.kind === 'pass')
  return (
    <aside className="teaching-panel" aria-label={t('candidate.heading')}>
      <div className="candidate-header">
        <div><small>{t('candidate.lab')}</small><h2>{t('candidate.heading')}</h2></div>
        <div className="evidence-pair">
          <span className="provenance exact"><Check size={12} /> {t('evidence.exact')}</span>
          <span className="provenance calculated">{t('evidence.calculated')}</span>
          <span className="provenance authored">{t('evidence.authored')}</span>
        </div>
      </div>
      <p className="candidate-instruction">{groups.length ? t('candidate.inspect') : t('candidate.empty')}</p>
      {callWindow && <p className="claim-priority"><span className="provenance exact">{t('evidence.exact')}</span>{t('candidate.claimPriority')}</p>}
      <div className="candidate-list">
        {groups.map((group) => {
          const { candidate, analysisAfter, recommendation } = group.lead
          const tile = candidateTile(candidate, hand)
          const support = supportingTiles(candidate, hand)
          const active = group.ids.includes(activeId ?? '')
          const selected = group.ids.includes(selectedId ?? '')
          return (
            <button
              key={candidate.id}
              type="button"
              className={`candidate-choice ${active ? 'active' : ''} ${selected ? 'selected' : ''} ${recommendation.suggested ? 'suggested' : ''}`}
              onPointerEnter={(event) => { if (event.pointerType !== 'touch') onInspect(candidate) }}
              onPointerLeave={(event) => { if (event.pointerType !== 'touch') onInspect(null) }}
              onFocus={() => onInspect(candidate)}
              onBlur={() => onInspect(null)}
              onClick={() => onSelect(candidate)}
              disabled={busy}
              aria-pressed={selected}
              data-candidate-id={candidate.id}
              data-action={candidate.action.kind}
              data-suggested={recommendation.suggested || undefined}
            >
              {tile ? <Tile tile={tile} compact /> : <span className="action-orb">{candidate.action.kind === 'draw' ? '摸' : candidate.action.kind === 'pass' ? '過' : candidate.action.kind === 'ron' || candidate.action.kind === 'tsumo' ? '形' : '鳴'}</span>}
              <span className="candidate-copy">
                <strong>{actionLabel(candidate, hand, t)}{group.copies > 1 ? ` ×${group.copies}` : ''}</strong>
                {support.length > 0 && <span className="supporting-tiles">{support.map((item) => <Tile key={item.id} tile={item} compact />)}</span>}
                {analysisAfter && <small>{shantenText(analysisAfter, t)} · {t('analysis.ukeire', { count: analysisAfter.ukeire })}</small>}
              </span>
              <span className="choice-rank">
                {recommendation.suggested && <b>{t(recommendation.labelKey)}</b>}
                <span className={`provenance ${recommendation.evidence}`}>{t(`evidence.${recommendation.evidence}`)}</span>
                <small>{t('candidate.rank', { rank: group.displayRank, total: group.displayTotal })}</small>
                {group.tiedAtRank > 1 && <small>{t('candidate.tied', { count: group.tiedAtRank })}</small>}
                <ArrowRight size={15} />
              </span>
            </button>
          )
        })}
      </div>

      {preview ? (
        <section className="preview-lesson" data-testid="non-mutating-preview" data-candidate-id={preview.candidate.id} data-analysis-token={preview.analysisToken} aria-live="polite">
          <header>
            <div>
              <small>{selectedId === preview.candidate.id ? t('candidate.selected') : preview.recommendation.suggested ? t(preview.recommendation.labelKey) : t('candidate.previewBadge')}</small>
              <h3>{t(preview.titleKey, preview.params)}</h3>
            </div>
            <span className="preview-lock">{t('candidate.previewBadge')}</span>
          </header>

          <div className="suggestion-note" data-evidence={preview.recommendation.evidence}>
            <span className={`provenance ${preview.recommendation.evidence}`}>{t(`evidence.${preview.recommendation.evidence}`)}</span>
            <strong>{t(preview.recommendation.helpKey, preview.recommendation.params)}</strong>
            <small>{t('candidate.rank', {
              rank: previewGroup?.displayRank ?? preview.recommendation.rank,
              total: previewGroup?.displayTotal ?? preview.recommendation.total,
            })}{previewGroup && previewGroup.tiedAtRank > 1 ? ` · ${t('candidate.tied', { count: previewGroup.tiedAtRank })}` : ''}</small>
          </div>

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
            {preview.analysisAfter
              ? <AnalysisStrip analysis={preview.analysisAfter} label={t('analysis.after')} t={t} />
              : preview.analysisAfterUnavailableKey && (
                <div className="analysis-strip analysis-unavailable" data-evidence="exact">
                  <small>{t('analysis.after')}</small>
                  <strong>{t(preview.analysisAfterUnavailableKey)}</strong>
                  <span className="provenance exact">{t('evidence.exact')}</span>
                </div>
              )}
          </div>

          {preview.handAfter && (
            <div className="hypothetical-hand" aria-label={t('analysis.after')}>
              {preview.handAfter.map((tile) => <Tile key={tile.id} tile={tile} compact />)}
            </div>
          )}

          {preview.analysisAfter && (
            <HandDevelopment analysis={preview.analysisAfter} label={t('analysis.after')} t={t} compact />
          )}

          <div className="facet-grid">
            {preview.facets.map((facet) => {
              const Icon = facetIcons[facet.id]
              return (
                <article key={facet.id} className={`teaching-facet facet-${facet.id}`}>
                  <header><Icon size={15} /><strong>{t(facet.titleKey)}</strong></header>
                  <p>{t(facet.bodyKey, localizedFacetParams(facet, t))}</p>
                  <span className={`provenance ${facet.evidence}`}>{t(`evidence.${facet.evidence}`)}</span>
                </article>
              )
            })}
          </div>
          <footer className="preview-actions">
            <small>{t('candidate.id', { id: `${preview.candidate.id.slice(2, 10)} · ${preview.analysisToken.slice(2, 10)}` })}</small>
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
