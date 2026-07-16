export { CookiesNext, useConsent } from './context.js'
export type { ConsentApi, CookiesNextProps } from './context.js'
export { ConsentGate, ConsentScript } from './gate.js'
export type { ConsentGateProps, ConsentScriptProps } from './gate.js'
export { PlaceholderCard } from './ui/PlaceholderCard.js'

export { defineConsentConfig, resolveConfig, matchServiceByUrl } from './config.js'
export { serviceCatalog } from './catalog.js'
export { buildBlockerScript } from './blocker.js'
export { builtinTexts, resolveText, formatText } from './i18n.js'
export type { ResolvedTexts } from './i18n.js'

export type {
  CategoryId,
  CatalogServiceRef,
  ConsentState,
  CookieInfo,
  CookiesNextConfig,
  LocalizedString,
  ResolvedConfig,
  ResolvedService,
  ServiceDefinition,
  ServiceEntry,
  TextOverrides,
} from './types.js'
