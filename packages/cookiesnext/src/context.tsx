'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildBlockerScript } from './blocker.js'
import { buildConsentMap, isConsentValid, resolveConfig } from './config.js'
import {
  clearConsentCookie,
  readConsentCookie,
  writeConsentCookie,
} from './consent-cookie.js'
import { resolveTexts, type ResolvedTexts } from './i18n.js'
import type {
  ConsentState,
  CookiesNextConfig,
  ResolvedConfig,
  ResolvedService,
} from './types.js'
import { Banner } from './ui/Banner.js'
import { Modal } from './ui/Modal.js'
import { Placeholders } from './ui/Placeholders.js'
import { Widget } from './ui/Widget.js'

export interface ConsentApi {
  /** False during SSR and until the consent cookie has been read. */
  ready: boolean
  /** True once the visitor made a (still valid) choice. */
  hasDecided: boolean
  consent: ConsentState | null
  services: ResolvedService[]
  hasConsent: (serviceId: string) => boolean
  acceptAll: () => void
  rejectAll: () => void
  acceptService: (serviceId: string) => void
  /** Persist an explicit choice per optional service id. */
  updateServices: (choices: Record<string, boolean>) => void
  /** Clears the stored consent. Reloads the page by default so already loaded services stop. */
  resetConsent: (options?: { reload?: boolean }) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

export interface CookiesNextContextValue extends ConsentApi {
  config: ResolvedConfig
  texts: ResolvedTexts
  lang: string
  showBanner: boolean
}

const CookiesNextContext = createContext<CookiesNextContextValue | null>(null)

export function useCookiesNextContext(): CookiesNextContextValue {
  const ctx = useContext(CookiesNextContext)
  if (!ctx) {
    throw new Error(
      '[cookiesnext] useConsent()/consent components must be used inside <CookiesNext config={…}> — wrap your app in it (usually in app/layout.tsx).',
    )
  }
  return ctx
}

/** Access the consent state and actions anywhere below <CookiesNext>. */
export function useConsent(): ConsentApi {
  return useCookiesNextContext()
}

export interface CookiesNextProps {
  config: CookiesNextConfig
  /**
   * UI language (e.g. 'de', 'en'). Defaults to `config.defaultLanguage`.
   * Pass your route locale here for multilingual sites.
   */
  locale?: string
  children?: ReactNode
}

/**
 * The all-in-one consent component: renders the blocking runtime, the
 * consent banner, the settings modal, the floating widget and the
 * placeholders for blocked embeds. Place it as the first element inside
 * <body> and wrap your app with it.
 */
export function CookiesNext({ config, locale, children }: CookiesNextProps) {
  const resolved = useMemo(() => resolveConfig(config), [config])
  const lang = locale ?? resolved.defaultLanguage
  const texts = useMemo(
    () => resolveTexts(lang, resolved.defaultLanguage, resolved.texts),
    [lang, resolved],
  )
  const blockerScript = useMemo(() => buildBlockerScript(resolved), [resolved])

  const [ready, setReady] = useState(false)
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    setConsent(readConsentCookie(resolved.cookieName))
    setReady(true)
  }, [resolved.cookieName])

  const persist = useCallback(
    (services: Record<string, boolean>) => {
      const state: ConsentState = {
        version: resolved.version,
        timestamp: new Date().toISOString(),
        services,
      }
      writeConsentCookie(resolved.cookieName, state, resolved.cookieMaxAgeDays)
      setConsent(state)
      window.dispatchEvent(
        new CustomEvent('cookiesnext:consent', {
          detail: { version: state.version, services: state.services },
        }),
      )
      return state
    },
    [resolved],
  )

  const hasDecided = isConsentValid(consent, resolved.version)

  const hasConsent = useCallback(
    (serviceId: string) => {
      const service = resolved.services.find((s) => s.id === serviceId)
      if (service?.category === 'essential') return true
      if (!isConsentValid(consent, resolved.version)) return false
      return consent.services[serviceId] === true
    },
    [consent, resolved],
  )

  const acceptAll = useCallback(() => {
    persist(buildConsentMap(resolved.services, () => true))
    setSettingsOpen(false)
  }, [persist, resolved])

  const rejectAll = useCallback(() => {
    persist(buildConsentMap(resolved.services, () => false))
    setSettingsOpen(false)
  }, [persist, resolved])

  const updateServices = useCallback(
    (choices: Record<string, boolean>) => {
      persist(buildConsentMap(resolved.services, (s) => choices[s.id] === true))
      setSettingsOpen(false)
    },
    [persist, resolved],
  )

  const acceptService = useCallback(
    (serviceId: string) => {
      const current = isConsentValid(consent, resolved.version) ? consent.services : {}
      persist(
        buildConsentMap(
          resolved.services,
          (s) => s.id === serviceId || current[s.id] === true,
        ),
      )
    },
    [persist, consent, resolved],
  )

  const resetConsent = useCallback(
    (options?: { reload?: boolean }) => {
      clearConsentCookie(resolved.cookieName)
      if (options?.reload === false) {
        setConsent(null)
      } else {
        window.location.reload()
      }
    },
    [resolved.cookieName],
  )

  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  // Allow opening the settings from anywhere: elements marked with
  // data-cookiesnext-open (e.g. a footer link) and a window event.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest?.('[data-cookiesnext-open]')) {
        event.preventDefault()
        setSettingsOpen(true)
      }
    }
    const onOpen = () => setSettingsOpen(true)
    document.addEventListener('click', onClick)
    window.addEventListener('cookiesnext:open-settings', onOpen)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('cookiesnext:open-settings', onOpen)
    }
  }, [])

  const showBanner = ready && !hasDecided && !isSettingsOpen

  const value: CookiesNextContextValue = {
    ready,
    hasDecided,
    consent,
    services: resolved.services,
    hasConsent,
    acceptAll,
    rejectAll,
    acceptService,
    updateServices,
    resetConsent,
    isSettingsOpen,
    openSettings,
    closeSettings,
    config: resolved,
    texts,
    lang,
    showBanner,
  }

  return (
    <CookiesNextContext.Provider value={value}>
      <script
        data-cookiesnext-blocker=""
        dangerouslySetInnerHTML={{ __html: blockerScript }}
      />
      {children}
      <Placeholders />
      <Banner />
      <Modal />
      <Widget />
    </CookiesNextContext.Provider>
  )
}
