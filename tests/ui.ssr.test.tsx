import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { CATALOGS, normalizeLocale, translate } from '../src/i18n/catalogs'

describe('localized product shell', () => {
  it('renders all three selectable profiles and the visible scoring boundary', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Japanese Riichi')
    expect(html).toContain('Chinese Official · MCR')
    expect(html).toContain('Hong Kong')
    expect(html).toContain('data-testid="scoring-boundary"')
    expect(html).toContain('Not authoritative yet')
  })

  it('ships the same stable message-key set for English, Simplified Chinese, and Japanese', () => {
    const keys = Object.keys(CATALOGS.en).sort()
    expect(Object.keys(CATALOGS['zh-Hans']).sort()).toEqual(keys)
    expect(Object.keys(CATALOGS.ja).sort()).toEqual(keys)
    expect(translate('zh-Hans', 'profile.heading')).toBe('选择规则体系')
    expect(translate('ja', 'profile.heading')).toBe('ルール体系を選ぶ')
  })

  it('allows only supported stored locales and falls back safely to English', () => {
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('zh-Hans')).toBe('zh-Hans')
    expect(normalizeLocale('ja')).toBe('ja')
    expect(normalizeLocale('fr')).toBe('en')
    expect(normalizeLocale({ toString: () => 'ja' })).toBe('en')
    expect(normalizeLocale(null)).toBe('en')
  })
})
