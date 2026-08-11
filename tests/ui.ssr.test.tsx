import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { App, readLocale } from '../src/App'
import { TeachingPanel } from '../src/components/TeachingPanel'
import { actorId, initialState, legalActions, previewAction } from '../src/domain/engine'
import { CATALOGS, normalizeLocale, supportedLocales, translate } from '../src/i18n/catalogs'
import { applyDocumentLocale, localizedDocumentMetadata } from '../src/i18n/document'

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]!).sort()
}

describe('localized product shell', () => {
  it('renders all three selectable profiles and the visible scoring boundary', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Japanese Riichi')
    expect(html).toContain('Chinese Official · MCR')
    expect(html).toContain('Hong Kong')
    expect(html).toContain('data-testid="scoring-boundary"')
    expect(html).toContain('Not authoritative yet')
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

  it('localizes stable profile and phase identifiers before facet display', () => {
    const state = initialState({ profile: 'riichi', seed: 'localized-facets' })
    const candidate = legalActions(state, actorId('east'))[0]!
    const preview = previewAction(state, candidate)
    const t = (key: string, params: Record<string, string | number> = {}) =>
      translate('zh-Hans', key, params)
    const html = renderToStaticMarkup(
      <TeachingPanel
        candidates={[candidate]}
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
