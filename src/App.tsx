import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronRight, CircleAlert, Database, Languages, LockKeyhole, Play, RefreshCw, Shield, Wind } from 'lucide-react'
import { MahjongTable } from './components/MahjongTable'
import { TeachingPanel } from './components/TeachingPanel'
import { Tile } from './components/Tile'
import { actorId, legalActions, previewAction, publicView } from './domain/engine'
import { PROFILES } from './domain/profiles'
import type { ActionCandidate, Locale, ProfileId, Seat, SessionRecord, SessionSummary, TileInstance } from './domain/types'
import { PROFILE_IDS } from './domain/types'
import { tileGlyph } from './domain/tiles'
import { normalizeLocale, translate } from './i18n/catalogs'
import {
  SessionConflictError,
  listSessions,
  loadSession,
  persistAutomatedSeats,
  persistCandidate,
  startOrResumeSession,
  withPersistenceMutationLock,
} from './persistence/sessionStore'

const VIEWER_SEAT: Seat = 'east'
const LOCALE_KEY = 'four-winds:locale:v1'

export function readLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_KEY))
  } catch {
    return 'en'
  }
}

function makeSeed(): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  return `four-winds-${stamp}`
}

function visibleHand(record: SessionRecord | null): TileInstance[] {
  if (!record) return []
  const view = publicView(record.state, actorId(record.viewerSeat))
  const player = view.players.find((item) => item.seat === record.viewerSeat)
  return player && Array.isArray(player.hand) ? player.hand : []
}

export function App() {
  const [locale, setLocale] = useState<Locale>(readLocale)
  const [profile, setProfile] = useState<ProfileId>('riichi')
  const [seed, setSeed] = useState('four-winds-first-table')
  const [record, setRecord] = useState<SessionRecord | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'good' | 'warn'; text: string } | null>(null)
  const [automating, setAutomating] = useState(false)
  const [mutating, setMutating] = useState(false)
  const t = useCallback((key: string, params: Record<string, string | number> = {}) => translate(locale, key, params), [locale])

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_KEY, locale)
    } catch {
      // A denied browser store must not prevent the local teaching UI loading.
    }
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const available = listSessions(window.localStorage)
    setSessions(available)
    if (available[0]) {
      const resumed = loadSession(window.localStorage, available[0].id)
      if (resumed) {
        setRecord(resumed)
        setProfile(resumed.state.profile)
        setSeed(resumed.state.seed)
      }
    }
  }, [])

  const view = useMemo(() => record ? publicView(record.state, actorId(record.viewerSeat)) : null, [record])
  const hand = useMemo(() => visibleHand(record), [record])
  const candidates = useMemo(() => {
    if (!record || record.state.phase === 'finished' || record.state.activeSeat !== record.viewerSeat) return []
    return legalActions(record.state, actorId(record.viewerSeat))
  }, [record])
  const activeCandidate = useMemo(() =>
    candidates.find((candidate) => candidate.id === inspectedId) ?? candidates.find((candidate) => candidate.id === selectedId) ?? null,
  [candidates, inspectedId, selectedId])
  const preview = useMemo(() => {
    if (!record || !activeCandidate) return null
    try { return previewAction(record.state, activeCandidate) } catch { return null }
  }, [activeCandidate, record])

  const refreshSessions = useCallback(() => setSessions(listSessions(window.localStorage)), [])

  const begin = useCallback(() => {
    if (mutating) return
    const config = { profile, seed: seed.trim() || 'four-winds-first-table' }
    setMutating(true)
    void withPersistenceMutationLock(() => (
      startOrResumeSession(window.localStorage, config, VIEWER_SEAT)
    )).then((result) => {
      setRecord(result.record)
      setSelectedId(null)
      setInspectedId(null)
      setNotice({ tone: 'good', text: t(result.resumed ? 'setup.resumed' : 'setup.created') })
      refreshSessions()
    }).catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : 'storage'
      setNotice({ tone: 'warn', text: t('candidate.failed', { reason }) })
    }).finally(() => setMutating(false))
  }, [mutating, profile, refreshSessions, seed, t])

  const resume = useCallback((id: string) => {
    const loaded = loadSession(window.localStorage, id)
    if (!loaded) return
    setRecord(loaded)
    setProfile(loaded.state.profile)
    setSeed(loaded.state.seed)
    setSelectedId(null)
    setInspectedId(null)
    setNotice({ tone: 'good', text: t('setup.resumed') })
  }, [t])

  const selectCandidate = useCallback((candidate: ActionCandidate) => {
    setSelectedId(candidate.id)
    setInspectedId(null)
    setNotice(null)
  }, [])

  const confirm = useCallback(() => {
    if (!record || !selectedId || mutating) return
    const candidate = legalActions(record.state, actorId(record.viewerSeat)).find((item) => item.id === selectedId)
    if (!candidate) {
      setSelectedId(null)
      setNotice({ tone: 'warn', text: t('candidate.stale') })
      return
    }
    const snapshot = record
    const requestId = `ui:${snapshot.id}:${snapshot.revision}:${candidate.id}`
    setMutating(true)
    void withPersistenceMutationLock(() => (
      persistCandidate(window.localStorage, snapshot, candidate, requestId)
    )).then((mutation) => {
      setRecord((current) => current?.id === mutation.record.id ? mutation.record : current)
      setSelectedId(null)
      setInspectedId(null)
      setNotice({ tone: 'good', text: t('candidate.applied') })
      refreshSessions()
    }).catch((error: unknown) => {
      if (error instanceof SessionConflictError) {
        const latest = loadSession(window.localStorage, snapshot.id)
        if (latest) setRecord((current) => current?.id === latest.id ? latest : current)
        setSelectedId(null)
        setInspectedId(null)
        setNotice({ tone: 'warn', text: t('candidate.stale') })
        return
      }
      const reason = error instanceof Error ? error.message : 'unknown'
      setNotice({ tone: 'warn', text: reason.includes('STALE') ? t('candidate.stale') : t('candidate.failed', { reason }) })
    }).finally(() => setMutating(false))
  }, [mutating, record, refreshSessions, selectedId, t])

  useEffect(() => {
    if (!record || record.state.phase === 'finished' || record.state.activeSeat === record.viewerSeat) return
    setAutomating(true)
    let cancelled = false
    const snapshot = record
    const timer = window.setTimeout(() => {
      void withPersistenceMutationLock(() => (
        persistAutomatedSeats(window.localStorage, snapshot)
      )).then((advanced) => {
        if (cancelled) return
        setRecord((current) => current?.id === advanced.id ? advanced : current)
        refreshSessions()
      }).catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof SessionConflictError) {
          const latest = loadSession(window.localStorage, snapshot.id)
          if (latest) setRecord((current) => current?.id === latest.id ? latest : current)
        }
        setNotice({ tone: 'warn', text: t('candidate.failed', { reason: error instanceof Error ? error.message : 'automation' }) })
      }).finally(() => { if (!cancelled) setAutomating(false) })
    }, 520)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [record, refreshSessions, t])

  const profileRules = PROFILES[profile]
  const activeProfileRules = record ? PROFILES[record.state.profile] : profileRules
  const discardCandidateByTile = new Map(
    candidates.flatMap((candidate) => candidate.action.kind === 'discard' ? [[candidate.action.tileId, candidate] as const] : []),
  )

  return (
    <div className="app-shell" data-locale={locale} data-profile={record?.state.profile ?? profile}>
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-seal">東</span><div><strong>{t('app.brand')}</strong><small>{t('app.product')}</small></div></div>
        <p className="tagline">{t('app.tagline')}</p>
        <div className="locale-switch" role="group" aria-label={t('locale.label')}>
          <Languages size={15} />
          {(['en', 'zh-Hans', 'ja'] as Locale[]).map((item) => (
            <button key={item} type="button" className={locale === item ? 'active' : ''} onClick={() => setLocale(item)} aria-pressed={locale === item}>{t(`locale.${item}`)}</button>
          ))}
        </div>
      </header>

      <main>
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow"><Wind size={14} /> {t('app.localOnly')}</span>
            <h1>{t('profile.heading')}</h1>
            <p>{t('profile.subheading')}</p>
          </div>
          <div className="profile-grid" role="radiogroup" aria-label={t('profile.heading')}>
            {PROFILE_IDS.map((id) => {
              const item = PROFILES[id]
              return (
                <button type="button" role="radio" aria-checked={profile === id} className={`profile-card ${profile === id ? 'selected' : ''}`} key={id} onClick={() => setProfile(id)}>
                  <span className="profile-wind">{id === 'riichi' ? '立' : id === 'mcr' ? '国' : '港'}</span>
                  <span><strong>{t(item.nameKey)}</strong><small>{t(item.shortKey)}</small></span>
                  <ChevronRight size={17} />
                </button>
              )
            })}
          </div>
          <div className="scoring-boundary" role="note" data-testid="scoring-boundary">
            <CircleAlert size={18} /><div><strong>{t(profileRules.nameKey)} · {t('profile.boundaryLabel')}</strong><p>{t(profileRules.scoringBoundaryKey)}</p></div>
          </div>
          <div className="start-row">
            <label><span>{t('setup.seed')}</span><input value={seed} onChange={(event) => setSeed(event.target.value)} maxLength={64} /><small>{t('setup.seedHelp')}</small></label>
            <button type="button" className="seed-button" onClick={() => setSeed(makeSeed())}><RefreshCw size={15} /> {t('setup.newSeed')}</button>
            <button type="button" className="start-button" onClick={begin} disabled={mutating || automating}><Play size={17} /> {t('setup.start')}</button>
          </div>
        </section>

        {notice && <div className={`notice ${notice.tone}`} role="status">{notice.tone === 'good' ? <Shield size={16} /> : <CircleAlert size={16} />}{notice.text}</div>}

        {record && view ? (
          <div className="game-workspace" data-session-id={record.id} data-revision={record.revision}>
            <section className="authority-strip">
              <LockKeyhole size={16} />
              <div><strong>{t('session.authority')}</strong><span>{t('session.authorityDetail')}</span></div>
              <code>r{record.revision} · {view.viewToken.slice(0, 12)}</code>
            </section>

            <div className="rules-now"><strong>{t(activeProfileRules.nameKey)}</strong><span>{t(activeProfileRules.scoringBoundaryKey)}</span></div>

            {view.result && (
              <section className="result-banner" role="status">
                <span>和</span><div><small>{t('result.heading')}</small><strong>{t(view.result.scoringStatusKey)}</strong></div>
              </section>
            )}

            <MahjongTable view={view} viewerSeat={record.viewerSeat} t={t} automating={automating} />

            <div className="decision-layout">
              <section className="hand-panel">
                <header><div><small>{t('table.viewer')}</small><h2>{t('hand.heading')}</h2></div><span>{t(`phase.${view.phase}`)}</span></header>
                <p>{t(view.activeSeat !== record.viewerSeat ? 'hand.help.wait' : view.phase === 'draw' ? 'hand.help.draw' : view.phase === 'claim' ? 'hand.help.claim' : 'hand.help.discard')}</p>
                <div className="learner-hand" data-testid="viewer-hand">
                  {hand.map((tile) => {
                    const candidate = discardCandidateByTile.get(tile.id)
                    const interaction = candidate ? { onClick: () => selectCandidate(candidate) } : {}
                    return (
                      <Tile
                        key={tile.id}
                        tile={tile}
                        selected={Boolean(candidate && selectedId === candidate.id)}
                        disabled={!candidate || automating || mutating}
                        {...interaction}
                        label={candidate ? `${t('action.discard')} ${tileGlyph(tile.type)}` : tileGlyph(tile.type)}
                      />
                    )
                  })}
                </div>
                <div className="hand-legend"><span className="provenance exact">{t('evidence.exact')}</span><span className="provenance calculated">{t('evidence.calculated')}</span><span className="provenance authored">{t('evidence.authored')}</span></div>
              </section>

              <TeachingPanel
                candidates={candidates}
                hand={hand}
                preview={preview}
                selectedId={selectedId}
                inspectedId={inspectedId}
                t={t}
                onInspect={(candidate) => setInspectedId(candidate?.id ?? null)}
                onSelect={selectCandidate}
                onConfirm={confirm}
                onCancel={() => { setSelectedId(null); setInspectedId(null) }}
                busy={automating || mutating}
              />
            </div>

            <section className="chronicle-panel">
              <header><BookOpen size={16} /><h2>{t('chronicle.heading')}</h2><span>{view.events.length}</span></header>
              <ol>
                {view.events.slice(-18).reverse().map((item) => (
                  <li key={item.number}><i>{item.number}</i><span>{t(item.messageKey, { seat: t(`seat.${item.seat}`), tile: item.tile ? tileGlyph(item.tile.type) : '' })}</span>{item.tile && item.kind !== 'draw' ? <Tile tile={item.tile} compact /> : null}</li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}

        <section className="session-panel">
          <header><Database size={17} /><div><h2>{t('setup.sessions')}</h2><small>{t('session.storageNote', { count: sessions.length })}</small></div></header>
          {sessions.length === 0 ? <p>{t('setup.noSessions')}</p> : (
            <div className="session-list">
              {sessions.map((item) => (
                <button key={item.id} type="button" onClick={() => resume(item.id)} className={record?.id === item.id ? 'current' : ''}>
                  <span className="session-profile">{item.profile === 'riichi' ? '立' : item.profile === 'mcr' ? '国' : '港'}</span>
                  <span><strong>{t(PROFILES[item.profile].nameKey)}</strong><small>{item.seedLabel} · r{item.revision} · {t(`phase.${item.phase}`)}</small></span>
                  <span>{t('setup.resume')} <ChevronRight size={14} /></span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer><span>{t('footer.contract')}</span><span>{t('footer.engine')}</span></footer>
    </div>
  )
}
