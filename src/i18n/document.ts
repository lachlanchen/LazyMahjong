import type { Locale } from '../domain/types'
import { translate } from './catalogs'

export function localizedDocumentMetadata(locale: Locale): { title: string; description: string } {
  return {
    title: `${translate(locale, 'app.brand')} · ${translate(locale, 'app.product')}`,
    description: translate(locale, 'profile.subheading'),
  }
}

export function applyDocumentLocale(locale: Locale, target: Document = document): void {
  const metadata = localizedDocumentMetadata(locale)
  target.documentElement.lang = locale
  target.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  target.title = metadata.title
  let description = target.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!description) {
    description = target.createElement('meta')
    description.name = 'description'
    target.head.append(description)
  }
  description.content = metadata.description
}
