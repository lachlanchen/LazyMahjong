import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { App, readLocale } from '../src/App'
import { TeachingPanel } from '../src/components/TeachingPanel'
import { MahjongTable } from '../src/components/MahjongTable'
import { HandDevelopment } from '../src/components/HandDevelopment'
import { actorId, applyAction, initialState, legalActions, previewAction, publicView, rankLegalCandidates } from '../src/domain/engine'
import { analyzeHand } from '../src/domain/hand'
import { composeWall } from '../src/domain/tiles'
import type { MahjongState, TileType } from '../src/domain/types'
import { CATALOGS, normalizeLocale, supportedLocales, translate } from '../src/i18n/catalogs'
import { applyDocumentLocale, localizedDocumentMetadata } from '../src/i18n/document'

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]!).sort()
}

function passClaims(state: MahjongState): MahjongState {
  let current = state
  while (current.phase === 'claim') {
    const pass = legalActions(current, actorId(current.activeSeat)).find((candidate) => candidate.action.kind === 'pass')!
    current = applyAction(current, pass)
  }
  return current
}

describe('localized product shell', () => {
  it('renders all three selectable profiles and the visible scoring boundary', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Japanese Riichi')
    expect(html).toContain('Chinese Official · MCR')
    expect(html).toContain('Hong Kong')
    expect(html).toContain('data-testid="scoring-boundary"')
    expect(html).toContain('teaching-subset boundary')
    expect(html).toContain('dead-wall and dora mechanics are not modeled')
    expect(html.match(/<option/g)).toHaveLength(11)
    expect(html).toContain('dir="ltr"')
  })

  it('ships the same stable key and placeholder set in all 11 catalogs', () => {
    const keys = Object.keys(CATALOGS.en).sort()
    expect(supportedLocales).toHaveLength(11)
    for (const locale of supportedLocales) {
      expect(Object.keys(CATALOGS[locale]).sort()).toEqual(keys)
      for (const key of keys) {
        const message = CATALOGS[locale][key as keyof typeof CATALOGS.en]
        expect(message).toBeTruthy()
        expect(message).not.toContain('\n')
        expect(placeholders(message)).toEqual(placeholders(CATALOGS.en[key as keyof typeof CATALOGS.en]))
        expect(message).not.toMatch(/ZXQ(?:PH|SEP)/)
      }
    }
    expect(translate('zh-Hans', 'profile.heading')).toBe('选择规则体系')
    expect(translate('ja', 'profile.heading')).toBe('ルール体系を選ぶ')
    expect(CATALOGS.en['candidate.failed']).not.toContain('{reason}')
  })

  it('keeps action provenance and profile-shape semantics distinct in every locale', () => {
    const semanticKeys = [
      'profile.riichi.boundary',
      'profile.mcr.boundary',
      'profile.hk.boundary',
      'candidate.leadHelp.draw',
      'candidate.leadHelp.complete',
      'candidate.leadHelp.pass',
      'candidate.leadHelp.call',
      'candidate.leadHelp.discard',
      'candidate.lead.shapeExact',
      'analysis.afterHiddenDrawUnavailable',
      'analysis.role.double-pair',
      'analysis.tileWinning',
    ] as const
    for (const locale of supportedLocales) {
      const catalog = CATALOGS[locale]
      expect(new Set([
        catalog['candidate.lead.calculated'],
        catalog['candidate.lead.exact'],
        catalog['candidate.lead.authored'],
      ]).size).toBe(3)
      expect(new Set([
        catalog['profile.riichi.boundary'],
        catalog['profile.mcr.boundary'],
        catalog['profile.hk.boundary'],
      ]).size).toBe(3)
      expect(catalog['candidate.leadHelp.pass']).not.toBe(catalog['candidate.leadHelp.discard'])
      expect(catalog['analysis.tileWinning']).not.toBe(catalog['analysis.tileUseful'])
      if (locale !== 'en') {
        for (const key of semanticKeys) expect(catalog[key]).not.toBe(CATALOGS.en[key])
      }
    }
  })

  it('never presents supported-shape completion as a scoring-authoritative winner', () => {
    const completionKeys = [
      'profile.mcr.short',
      'profile.hk.short',
      'candidate.lead.shapeExact',
      'candidate.leadHelp.complete',
      'action.tsumo',
      'action.ron',
      'preview.discard.reply',
      'preview.tsumo.title',
      'preview.tsumo.why',
      'preview.tsumo.changes',
      'preview.tsumo.reply',
      'preview.tsumo.next',
      'preview.tsumo.principle',
      'preview.ron.title',
      'preview.ron.why',
      'preview.ron.changes',
      'preview.ron.reply',
      'preview.ron.next',
      'preview.ron.principle',
      'event.tsumo',
      'event.ron',
      'result.riichi.scoring-unsupported',
      'result.mcr.scoring-unsupported',
      'result.hong-kong.scoring-unsupported',
    ] as const
    const winnerClaims: Record<(typeof supportedLocales)[number], RegExp> = {
      en: /\b(?:win|wins|won|winner|victory|victorious)\b/i,
      ar: /فاز|يفوز|فوز|فائز|انتصار/,
      es: /\b(?:ganar|gana|ganó|ganaron|ganador|ganadora|victoria)\b/i,
      fr: /\b(?:gagne|gagné|gagner|gagnant|gagnante|victoire|vainqueur)\b/iu,
      ja: /勝者|勝利|勝ち|和了/,
      ko: /승리|승자|이겼|이긴|화료/,
      vi: /\bthắng\b|chiến thắng/iu,
      'zh-Hans': /获胜|獲勝|胜利|勝利|赢家|贏家|和牌|胡牌/,
      'zh-Hant': /獲勝|获胜|勝利|胜利|贏家|赢家|和牌|胡牌/,
      de: /\b(?:Gewinn|gewinnt|gewinnen|gewann|gewonnen|Sieg|Sieger)\b/iu,
      ru: /выигр|побед|победител/iu,
    }
    for (const locale of supportedLocales) {
      const text = completionKeys.map((key) => CATALOGS[locale][key]).join(' ')
      expect(text).not.toMatch(winnerClaims[locale])
    }

    for (const key of ['profile.riichi.boundary', 'profile.mcr.boundary', 'profile.hk.boundary'] as const) {
      expect(CATALOGS.en[key]).toMatch(/teaching[- ]subset/i)
      expect(CATALOGS.en[key]).toMatch(/shape.*scor|scor.*shape/i)
    }
    expect(CATALOGS.en['profile.riichi.boundary']).toMatch(/dead-wall.*dora.*not modeled/i)
  })

  it('labels the modeled pile generically and describes every zero-pile branch truthfully', () => {
    const countKeys = ['table.wall', 'preview.draw.changes', 'facet.tempo.body', 'event.exhaustive', 'result.exhaustive'] as const
    const liveWallLabels: Partial<Record<(typeof supportedLocales)[number], RegExp>> = {
      en: /live[- ]wall/i,
      ar: /الجدار الحي/,
      es: /muro vivo/i,
      fr: /mur vivant/iu,
      vi: /tường bài sống/iu,
      de: /lebend(?:e|en|er|es) Mauer/iu,
      ru: /жив(?:ая|ой|ую) стен/iu,
    }
    for (const locale of supportedLocales) {
      const pattern = liveWallLabels[locale]
      if (!pattern) continue
      const text = countKeys.map((key) => CATALOGS[locale][key]).join(' ')
      expect(text).not.toMatch(pattern)
    }

    expect(CATALOGS.en['preview.discard.reply']).toMatch(/exhaust/i)
    expect(CATALOGS.en['preview.pass.reply']).toMatch(/exhaust/i)
    expect(CATALOGS.en['preview.chi.reply']).toMatch(/empty.*exhaust|exhaust.*empty/i)
    expect(CATALOGS.en['preview.pon.reply']).toMatch(/empty.*exhaust|exhaust.*empty/i)
    expect(CATALOGS.en['preview.kan.changes']).toMatch(/only.*(?:exists|remain)/i)
  })

  it('localizes stable profile and phase identifiers before facet display', () => {
    const state = initialState({ profile: 'riichi', seed: 'localized-facets' })
    const candidate = legalActions(state, actorId('east'))[0]!
    const preview = previewAction(state, candidate)
    const t = (key: string, params: Record<string, string | number> = {}) =>
      translate('zh-Hans', key, params)
    const html = renderToStaticMarkup(
      <TeachingPanel
        rankedCandidates={rankLegalCandidates(state, [candidate])}
        hand={state.hands.east}
        preview={preview}
        selectedId={candidate.id}
        inspectedId={null}
        t={t}
        onInspect={() => undefined}
        onSelect={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        busy={false}
      />,
    )
    expect(html).toContain('日本立直麻将')
    expect(html).toContain('舍牌阶段')
    expect(html).not.toContain('riichi 的')
    expect(html).not.toContain('阶段 discard')
    expect(html).not.toContain('牌类为 simple')
  })

  it('renders an unselected opening lead, state-bound preview, and the Mahjong-native 34-tile map', () => {
    const state = initialState({ profile: 'riichi', seed: 'opening-map' })
    const ranked = rankLegalCandidates(state)
    const suggested = ranked.find((item) => item.recommendation.suggested)!
    const preview = previewAction(state, suggested.candidate)
    const t = (key: string, params: Record<string, string | number> = {}) => translate('en', key, params)
    const html = renderToStaticMarkup(
      <TeachingPanel
        rankedCandidates={ranked}
        hand={state.hands.east}
        preview={preview}
        selectedId={null}
        inspectedId={null}
        t={t}
        onInspect={() => undefined}
        onSelect={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        busy={false}
      />,
    )
    expect(html).toContain('data-suggested="true"')
    expect(html).toContain(`data-analysis-token="${preview.analysisToken}"`)
    expect(html).toContain('34-tile improvement map')
    expect((html.match(/improvement-cell/g) ?? [])).toHaveLength(34)
    const visibleTypes = new Set(ranked.flatMap(({ candidate }) => {
      const action = candidate.action
      if (action.kind !== 'discard') return []
      return state.hands.east.find((tile) => tile.id === action.tileId)?.type ?? []
    }))
    const suggestedTypes = new Set(ranked.flatMap(({ candidate, recommendation }) => {
      const action = candidate.action
      if (!recommendation.suggested || action.kind !== 'discard') return []
      return state.hands.east.find((tile) => tile.id === action.tileId)?.type ?? []
    }))
    expect(suggestedTypes.size).toBeGreaterThan(1)
    expect((html.match(/data-suggested="true"/g) ?? [])).toHaveLength(suggestedTypes.size)
    expect(html).toContain(`Rank 1/${visibleTypes.size}`)
    expect(html).toContain(`${suggestedTypes.size}-way tie`)
    expect(html).not.toContain('data-testid="confirm-action"')
    expect(html).not.toMatch(/>\s*(analysis|candidate|facet)\.[a-z]/)
  })

  it('shows confirmation only after the learner explicitly selects the state-bound suggestion', () => {
    const state = initialState({ profile: 'hong-kong', seed: 'explicit-confirm' })
    const ranked = rankLegalCandidates(state)
    const suggested = ranked[0]!
    const preview = previewAction(state, suggested.candidate)
    const html = renderToStaticMarkup(
      <TeachingPanel
        rankedCandidates={ranked}
        hand={state.hands.east}
        preview={preview}
        selectedId={suggested.candidate.id}
        inspectedId={null}
        t={(key, params = {}) => translate('en', key, params)}
        onInspect={() => undefined}
        onSelect={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        busy={false}
      />,
    )
    expect(html).toContain('data-testid="confirm-action"')
    expect(html).toContain('Preview only · state has not changed')
  })

  it('shows the opening tile cue only inside the authorized viewer hand', () => {
    const state = initialState({ profile: 'riichi', seed: 'table-cue-redaction' })
    const suggested = rankLegalCandidates(state)[0]!.candidate
    expect(suggested.action.kind).toBe('discard')
    const tile = state.hands.east.find((item) => suggested.action.kind === 'discard' && item.id === suggested.action.tileId)!
    const t = (key: string, params: Record<string, string | number> = {}) => translate('en', key, params)
    const authorized = renderToStaticMarkup(
      <MahjongTable view={publicView(state, actorId('east'))} viewerSeat="east" t={t} automating={false} suggestedTiles={[tile]} />,
    )
    const spectator = renderToStaticMarkup(
      <MahjongTable view={publicView(state, 'spectator')} viewerSeat="east" t={t} automating={false} suggestedTiles={[tile]} />,
    )
    expect(authorized).toContain('table-suggestion')
    expect(authorized).toMatch(/83 undealt tiles in (?:the )?draw pile/)
    expect(authorized).not.toContain('live wall')
    expect(spectator).not.toContain('table-suggestion')
  })

  it('renders forced draw provenance instead of a calculated-discard explanation', () => {
    const initial = initialState({ profile: 'riichi', seed: 'forced-draw-provenance' })
    const discard = legalActions(initial, actorId('east')).find((candidate) => candidate.action.kind === 'discard')!
    const drawState = passClaims(applyAction(initial, discard))
    const draw = legalActions(drawState, actorId(drawState.activeSeat))[0]!
    const ranked = rankLegalCandidates(drawState)
    const preview = previewAction(drawState, draw)
    const html = renderToStaticMarkup(
      <TeachingPanel
        rankedCandidates={ranked}
        hand={drawState.hands[drawState.activeSeat]}
        preview={preview}
        selectedId={null}
        inspectedId={null}
        t={(key, params = {}) => translate('en', key, params)}
        onInspect={() => undefined}
        onSelect={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        busy={false}
      />,
    )
    expect(html).toContain('data-evidence="exact"')
    expect(html).toContain('Forced exact action')
    expect(html).toContain('Draw is the only legal transition')
    expect(html).toContain(translate('en', 'analysis.afterHiddenDrawUnavailable'))
    expect(translate('en', 'analysis.afterHiddenDrawUnavailable')).toMatch(/unavailable.*hidden/i)
    expect(html).not.toContain('Ranked by supported-shape shanten')
    expect(html).not.toContain('0 improving kinds')
    expect(preview.facets.some((facet) => facet.evidence === 'calculated')).toBe(false)
  })

  it('exposes visible shape-role and supported-completion legends to assistive technology', () => {
    const types = [
      'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'p1', 'p2', 'p3', 's7', 's8', 's9', 'east',
    ] satisfies TileType[]
    const wall = composeWall('riichi')
    const hand = types.map((type) => wall.find((tile) => tile.type === type)!)
    const analysis = analyzeHand(hand)
    const html = renderToStaticMarkup(
      <HandDevelopment analysis={analysis} label="Current hand" t={(key, params = {}) => translate('en', key, params)} />,
    )
    expect(html).toContain('shape-role-legend')
    expect(html).toContain('Connected suit shape')
    expect(html).toContain('gold completes a supported shape')
    expect(html).toContain('Completes a supported shape; 3 copies are unseen by public information')
  })

  it('allows only supported stored locales and falls back safely to English', () => {
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('zh-Hans')).toBe('zh-Hans')
    expect(normalizeLocale('ja')).toBe('ja')
    expect(normalizeLocale('fr')).toBe('fr')
    expect(normalizeLocale('ar')).toBe('ar')
    expect(normalizeLocale({ toString: () => 'ja' })).toBe('en')
    expect(normalizeLocale(null)).toBe('en')
    expect(localizedDocumentMetadata('ar').title).not.toContain('Mahjong decision teacher')
    expect(localizedDocumentMetadata('ar').description).toBe(translate('ar', 'profile.subheading'))
  })

  it('reads only allowlisted persisted locale values', () => {
    const getItem = vi.fn(() => 'ru')
    vi.stubGlobal('window', { localStorage: { getItem } })
    expect(readLocale()).toBe('ru')
    getItem.mockReturnValue('__proto__')
    expect(readLocale()).toBe('en')
    vi.unstubAllGlobals()
  })

  it('applies localized document metadata and RTL direction', () => {
    const description = { content: '', name: '' }
    const target = {
      documentElement: { lang: '', dir: '' },
      title: '',
      head: { append: () => undefined },
      querySelector: () => description,
      createElement: () => description,
    } as unknown as Document
    applyDocumentLocale('ar', target)
    expect(target.documentElement.lang).toBe('ar')
    expect(target.documentElement.dir).toBe('rtl')
    expect(target.title).toBe(localizedDocumentMetadata('ar').title)
    expect(description.content).toBe(localizedDocumentMetadata('ar').description)
  })
})
