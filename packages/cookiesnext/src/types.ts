/**
 * A string that is either used verbatim for every language or an object
 * keyed by language code, e.g. `{ de: 'Karten', en: 'Maps' }`.
 */
export type LocalizedString = string | Record<string, string>

export type CategoryId = 'essential' | 'functional' | 'statistics' | 'marketing'

export const CATEGORY_IDS: CategoryId[] = ['essential', 'functional', 'statistics', 'marketing']

export interface CookieInfo {
  name: string
  duration?: LocalizedString
  description?: LocalizedString
}

/** A fully self-defined service. */
export interface ServiceDefinition {
  id: string
  name: LocalizedString
  category: CategoryId
  description?: LocalizedString
  provider?: LocalizedString
  privacyPolicyUrl?: string
  /**
   * URL substrings used by the auto-blocker to attribute scripts/iframes to
   * this service, e.g. `['youtube.com/embed', 'youtube-nocookie.com']`.
   */
  patterns?: string[]
  cookies?: CookieInfo[]
}

/** Reference to a service from the built-in catalog, with optional overrides. */
export interface CatalogServiceRef {
  /** Catalog id, e.g. `'google-maps'`, `'youtube'`, `'google-analytics'`. */
  service: string
  category?: CategoryId
  /** Additional URL patterns merged with the catalog patterns. */
  patterns?: string[]
  description?: LocalizedString
  privacyPolicyUrl?: string
}

export type ServiceEntry = CatalogServiceRef | ServiceDefinition

export interface CategoryTexts {
  name?: LocalizedString
  description?: LocalizedString
}

export interface BannerTexts {
  title?: string
  description?: string
  acceptAll?: string
  rejectAll?: string
  settings?: string
}

export interface ModalTexts {
  title?: string
  description?: string
  acceptAll?: string
  rejectAll?: string
  save?: string
  alwaysActive?: string
  showDetails?: string
  hideDetails?: string
  provider?: string
  cookies?: string
  duration?: string
  privacyPolicy?: string
  imprint?: string
  serviceCount?: string
  close?: string
}

export interface PlaceholderTexts {
  title?: string
  /** Supports the `{service}` token. */
  description?: string
  load?: string
  settings?: string
}

export interface WidgetTexts {
  label?: string
}

export interface TextOverrides {
  banner?: BannerTexts
  modal?: ModalTexts
  placeholder?: PlaceholderTexts
  widget?: WidgetTexts
  categories?: Partial<Record<CategoryId, CategoryTexts>>
}

export interface CookiesNextConfig {
  /**
   * Bump this number whenever you add/remove services or change their
   * meaning — visitors will be asked for consent again.
   * @default 1
   */
  version?: number
  /** @default 'cn-consent' */
  cookieName?: string
  /** @default 180 */
  cookieMaxAgeDays?: number
  /** Fallback language when no matching translation exists. @default 'de' */
  defaultLanguage?: string
  services: ServiceEntry[]
  privacyPolicyUrl?: string
  imprintUrl?: string
  /**
   * Intercept third-party scripts/iframes globally before they load.
   * @default true
   */
  autoBlock?: boolean
  banner?: {
    /** @default 'bottom' */
    position?: 'bottom' | 'center'
  }
  widget?: {
    /** @default 'bottom-left' */
    position?: 'bottom-left' | 'bottom-right'
    /** @default true */
    show?: boolean
  }
  /** Text overrides per language, e.g. `{ de: { banner: { title: '…' } } }`. */
  texts?: Record<string, TextOverrides>
}

/** A service after catalog resolution — everything the UI needs. */
export interface ResolvedService {
  id: string
  name: LocalizedString
  category: CategoryId
  description?: LocalizedString
  provider?: LocalizedString
  privacyPolicyUrl?: string
  patterns: string[]
  cookies: CookieInfo[]
}

export interface ResolvedConfig {
  version: number
  cookieName: string
  cookieMaxAgeDays: number
  defaultLanguage: string
  services: ResolvedService[]
  privacyPolicyUrl?: string
  imprintUrl?: string
  autoBlock: boolean
  banner: { position: 'bottom' | 'center' }
  widget: { position: 'bottom-left' | 'bottom-right'; show: boolean }
  texts?: Record<string, TextOverrides>
}

/** The persisted consent decision. */
export interface ConsentState {
  version: number
  /** ISO timestamp of the decision. */
  timestamp: string
  /** Consent per service id. Essential services are always `true`. */
  services: Record<string, boolean>
}
