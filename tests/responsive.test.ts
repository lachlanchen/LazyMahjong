import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('clean responsive decision layout', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

  it('keeps the 34-tile map compact and preserves touch-sized primary controls', () => {
    expect(css).toContain('grid-template-columns: repeat(9, minmax(24px, 1fr))')
    expect(css).toMatch(/\.start-button[^}]*min-height: 44px/)
    expect(css).toContain('@media (max-width: 760px)')
  })

  it('collapses decisions and evidence cards to one column while retaining two shape-family lanes', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 760px)'))
    expect(mobile).toContain('.candidate-list, .reasoning-ladder, .facet-grid, .chronicle-panel ol, .session-list { grid-template-columns: 1fr; }')
    expect(mobile).toContain('.shape-family-map, .compact-development .shape-family-map { grid-template-columns: repeat(2, minmax(0, 1fr)); }')
    expect(css).toMatch(/\.analysis-strip[^}]*min-width: 0[^}]*overflow-wrap: anywhere/)
  })

  it('fits the table to the mobile viewport without a fixed-width horizontal-scroll canvas', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 760px)'))
    expect(mobile).toContain('.mahjong-table { width: 100%; min-width: 0; min-height: 0;')
    expect(mobile).toContain('.seat-bottom { grid-column: 1 / -1; }')
    expect(mobile).not.toContain('width: 700px')
    expect(mobile).not.toContain('overflow-x: auto')
    expect(css).not.toContain('min-height: 680px')
  })

  it('provides visible role swatches and a wide-screen space-sharing layout', () => {
    expect(css).toContain('.shape-role-legend')
    expect(css).toContain('.role-swatch.role-double-pair')
    expect(css).toContain('@media (min-width: 1280px)')
    expect(css).toContain('.play-layout { grid-template-columns: minmax(650px, 1.12fr) minmax(480px, .88fr); }')
  })

  it('does not expose authority revision counts that can fingerprint hidden passes', () => {
    expect(app).not.toContain('data-revision')
    expect(app).not.toContain('r{record.revision}')
    expect(app).not.toContain('r{item.revision}')
    expect(app).toContain('settleLoadedRecord(resumed).then(setRecord)')
    expect(app).toContain('persistAutomatedSeats(window.localStorage, mutation.record)')
  })

  it('keeps all 11 README variants explicit about profile-aware seven pairs and screenshot freshness', () => {
    const markers = new Map([
      ['../README.md', ['profile-aware seven pairs', 'Reference screenshot']],
      ['../i18n/README.ar.md', ['الرباعية المخفية', 'لقطة مرجعية']],
      ['../i18n/README.de.md', ['profilabhängige sieben Paare', 'Referenzbild']],
      ['../i18n/README.es.md', ['siete pares según el perfil', 'Captura de referencia']],
      ['../i18n/README.fr.md', ['sept paires selon le profil', 'Capture de référence']],
      ['../i18n/README.ja.md', ['ルール別の七対形', '参照スクリーンショット']],
      ['../i18n/README.ko.md', ['프로필별 칠대형', '참고 스크린샷']],
      ['../i18n/README.ru.md', ['профильные семь пар', 'Справочный снимок']],
      ['../i18n/README.vi.md', ['bảy đôi theo hồ sơ', 'Ảnh tham chiếu']],
      ['../i18n/README.zh-Hans.md', ['按规则体系定义的七对', '参考截图']],
      ['../i18n/README.zh-Hant.md', ['按規則體系定義的七對', '參考截圖']],
    ])
    expect(markers.size).toBe(11)
    for (const [path, expected] of markers) {
      const readme = readFileSync(new URL(path, import.meta.url), 'utf8')
      for (const marker of expected) expect(readme).toContain(marker)
    }
  })
})
