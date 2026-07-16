import type { CategoryId, LocalizedString, TextOverrides } from './types.js'

export interface ResolvedTexts {
  banner: {
    title: string
    description: string
    acceptAll: string
    rejectAll: string
    settings: string
  }
  modal: {
    title: string
    description: string
    acceptAll: string
    rejectAll: string
    save: string
    alwaysActive: string
    showDetails: string
    hideDetails: string
    provider: string
    cookies: string
    duration: string
    privacyPolicy: string
    imprint: string
    serviceCount: string
    close: string
  }
  placeholder: {
    title: string
    description: string
    load: string
    settings: string
  }
  widget: {
    label: string
  }
  categories: Record<CategoryId, { name: string; description: string }>
}

const de: ResolvedTexts = {
  banner: {
    title: 'Wir verwenden Cookies',
    description:
      'Wir nutzen Cookies und externe Dienste. Einige sind essenziell für den Betrieb der Website, andere helfen uns, Inhalte und dein Erlebnis zu verbessern. Du kannst deine Auswahl jederzeit anpassen.',
    acceptAll: 'Alle akzeptieren',
    rejectAll: 'Nur essenzielle',
    settings: 'Einstellungen',
  },
  modal: {
    title: 'Datenschutz-Einstellungen',
    description:
      'Hier kannst du festlegen, welche Cookies und externen Dienste wir verwenden dürfen. Essenzielle Dienste sind für den Betrieb der Website erforderlich und immer aktiv.',
    acceptAll: 'Alle akzeptieren',
    rejectAll: 'Nur essenzielle',
    save: 'Auswahl speichern',
    alwaysActive: 'Immer aktiv',
    showDetails: 'Details anzeigen',
    hideDetails: 'Details ausblenden',
    provider: 'Anbieter',
    cookies: 'Cookies',
    duration: 'Laufzeit',
    privacyPolicy: 'Datenschutzerklärung',
    imprint: 'Impressum',
    serviceCount: '{count} Dienste',
    close: 'Schließen',
  },
  placeholder: {
    title: 'Externer Inhalt',
    description:
      'Dieser Inhalt wird von {service} bereitgestellt. Beim Laden können personenbezogene Daten an den Anbieter übertragen und Cookies gesetzt werden.',
    load: 'Inhalt laden',
    settings: 'Cookie-Einstellungen',
  },
  widget: {
    label: 'Cookie-Einstellungen öffnen',
  },
  categories: {
    essential: {
      name: 'Essenziell',
      description:
        'Erforderlich für die Grundfunktionen der Website, z. B. Seitennavigation und Speicherung deiner Cookie-Auswahl. Kann nicht deaktiviert werden.',
    },
    functional: {
      name: 'Funktional',
      description: 'Ermöglichen erweiterte Funktionen wie Karten, Videos oder Terminbuchung.',
    },
    statistics: {
      name: 'Statistik',
      description: 'Helfen uns zu verstehen, wie Besucher die Website nutzen.',
    },
    marketing: {
      name: 'Marketing',
      description: 'Werden verwendet, um Werbung relevanter zu machen und Kampagnen zu messen.',
    },
  },
}

const en: ResolvedTexts = {
  banner: {
    title: 'We use cookies',
    description:
      'We use cookies and external services. Some are essential to run this website, others help us improve content and your experience. You can change your choice at any time.',
    acceptAll: 'Accept all',
    rejectAll: 'Essential only',
    settings: 'Settings',
  },
  modal: {
    title: 'Privacy settings',
    description:
      'Choose which cookies and external services we may use. Essential services are required to run the website and always active.',
    acceptAll: 'Accept all',
    rejectAll: 'Essential only',
    save: 'Save selection',
    alwaysActive: 'Always active',
    showDetails: 'Show details',
    hideDetails: 'Hide details',
    provider: 'Provider',
    cookies: 'Cookies',
    duration: 'Duration',
    privacyPolicy: 'Privacy policy',
    imprint: 'Imprint',
    serviceCount: '{count} services',
    close: 'Close',
  },
  placeholder: {
    title: 'External content',
    description:
      'This content is provided by {service}. Loading it may transfer personal data to the provider and set cookies.',
    load: 'Load content',
    settings: 'Cookie settings',
  },
  widget: {
    label: 'Open cookie settings',
  },
  categories: {
    essential: {
      name: 'Essential',
      description:
        'Required for basic site functionality such as navigation and storing your cookie choice. Cannot be disabled.',
    },
    functional: {
      name: 'Functional',
      description: 'Enable enhanced functionality such as maps, videos or scheduling.',
    },
    statistics: {
      name: 'Statistics',
      description: 'Help us understand how visitors use the website.',
    },
    marketing: {
      name: 'Marketing',
      description: 'Used to make advertising more relevant and measure campaigns.',
    },
  },
}

export const builtinTexts: Record<string, ResolvedTexts> = { de, en }

/** Resolve a LocalizedString for a language with sensible fallbacks. */
export function resolveText(
  value: LocalizedString | undefined,
  lang: string,
  fallbackLang: string,
): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  const direct = value[lang] ?? value[fallbackLang]
  if (direct !== undefined) return direct
  const first = Object.values(value)[0]
  return first ?? ''
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : override) as T
  }
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    result[key] = deepMerge(result[key], value)
  }
  return result as T
}

/**
 * Build the final text set for a language: built-in translations
 * (falling back to the default language, then German) merged with
 * user overrides from the config.
 */
export function resolveTexts(
  lang: string,
  defaultLanguage: string,
  overrides: Record<string, TextOverrides> | undefined,
): ResolvedTexts {
  const base = builtinTexts[lang] ?? builtinTexts[defaultLanguage] ?? de
  const merged = deepMerge(base, overrides?.[lang] ?? overrides?.[defaultLanguage])
  return merged
}

/** Replace `{token}` placeholders in a text template. */
export function formatText(template: string, tokens: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in tokens ? String(tokens[key]) : match,
  )
}
