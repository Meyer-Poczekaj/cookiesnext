import { serviceCatalog } from './catalog.js'
import type {
  CatalogServiceRef,
  ConsentState,
  CookiesNextConfig,
  ResolvedConfig,
  ResolvedService,
  ServiceEntry,
} from './types.js'

/**
 * Identity helper that gives you type checking and autocompletion in
 * `cookies.config.ts`. Keep the config JSON-serializable — it is passed
 * from a Server Component to the client.
 */
export function defineConsentConfig(config: CookiesNextConfig): CookiesNextConfig {
  return config
}

function isCatalogRef(entry: ServiceEntry): entry is CatalogServiceRef {
  return typeof (entry as CatalogServiceRef).service === 'string'
}

export function resolveService(entry: ServiceEntry): ResolvedService {
  if (isCatalogRef(entry)) {
    const base = serviceCatalog[entry.service]
    if (!base) {
      throw new Error(
        `[cookiesnext] Unknown catalog service "${entry.service}". ` +
          `Available: ${Object.keys(serviceCatalog).join(', ')}. ` +
          'For a custom service, define it with { id, name, category, patterns }.',
      )
    }
    return {
      id: base.id,
      name: base.name,
      category: entry.category ?? base.category,
      description: entry.description ?? base.description,
      provider: base.provider,
      privacyPolicyUrl: entry.privacyPolicyUrl ?? base.privacyPolicyUrl,
      patterns: [...(base.patterns ?? []), ...(entry.patterns ?? [])],
      cookies: base.cookies ?? [],
    }
  }
  if (!entry.id || !entry.name || !entry.category) {
    throw new Error(
      '[cookiesnext] Custom services need at least { id, name, category }. Got: ' +
        JSON.stringify(entry),
    )
  }
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    description: entry.description,
    provider: entry.provider,
    privacyPolicyUrl: entry.privacyPolicyUrl,
    patterns: entry.patterns ?? [],
    cookies: entry.cookies ?? [],
  }
}

export function resolveConfig(config: CookiesNextConfig): ResolvedConfig {
  const services = config.services.map(resolveService)
  const seen = new Set<string>()
  for (const service of services) {
    if (seen.has(service.id)) {
      throw new Error(`[cookiesnext] Duplicate service id "${service.id}" in config.`)
    }
    seen.add(service.id)
  }
  return {
    version: config.version ?? 1,
    cookieName: config.cookieName ?? 'cn-consent',
    cookieMaxAgeDays: config.cookieMaxAgeDays ?? 180,
    defaultLanguage: config.defaultLanguage ?? 'de',
    services,
    privacyPolicyUrl: config.privacyPolicyUrl,
    imprintUrl: config.imprintUrl,
    autoBlock: config.autoBlock ?? true,
    banner: { position: config.banner?.position ?? 'bottom' },
    widget: {
      position: config.widget?.position ?? 'bottom-left',
      show: config.widget?.show ?? true,
    },
    texts: config.texts,
  }
}

/** Attribute a URL to a configured service via substring patterns. */
export function matchServiceByUrl(url: string, services: ResolvedService[]): string | null {
  if (!url) return null
  for (const service of services) {
    for (const pattern of service.patterns) {
      if (pattern && url.includes(pattern)) return service.id
    }
  }
  return null
}

/** Build a full consent map (essential services are always true). */
export function buildConsentMap(
  services: ResolvedService[],
  granted: (service: ResolvedService) => boolean,
): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const service of services) {
    map[service.id] = service.category === 'essential' ? true : granted(service)
  }
  return map
}

/** Is the stored consent still valid for the current config version? */
export function isConsentValid(state: ConsentState | null, version: number): state is ConsentState {
  return state !== null && state.version === version
}
