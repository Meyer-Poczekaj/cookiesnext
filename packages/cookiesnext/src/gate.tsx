'use client'

import { useEffect, type ReactNode } from 'react'
import { useConsent } from './context.js'
import { PlaceholderCard } from './ui/PlaceholderCard.js'

export interface ConsentGateProps {
  /** Service id from your config, e.g. 'youtube'. */
  service: string
  children: ReactNode
  /** Rendered while consent is missing. Defaults to the standard placeholder. */
  fallback?: ReactNode
}

/**
 * Optional explicit wrapper: renders its children only once the visitor
 * consented to the given service. Useful for React components that load
 * third-party SDKs themselves, or as a zero-request alternative to the
 * automatic blocker.
 */
export function ConsentGate({ service, children, fallback }: ConsentGateProps) {
  const { ready, hasConsent } = useConsent()
  if (!ready) return null
  if (!hasConsent(service)) {
    return fallback !== undefined ? <>{fallback}</> : <PlaceholderCard serviceId={service} />
  }
  return <>{children}</>
}

const injected = new Set<string>()

export interface ConsentScriptProps {
  /** Service id from your config. */
  service: string
  /** External script URL. Omit for inline scripts. */
  src?: string
  /** Inline script body (used when `src` is omitted). */
  children?: string
  async?: boolean
  defer?: boolean
}

/**
 * Loads a script only after the visitor consented to the given service —
 * the consent-aware replacement for analytics/marketing snippets.
 * The script stays loaded until the next page load once injected.
 */
export function ConsentScript({ service, src, children, async: isAsync, defer }: ConsentScriptProps) {
  const { hasConsent } = useConsent()
  const granted = hasConsent(service)

  useEffect(() => {
    if (!granted) return
    const marker = `${service}::${src ?? children ?? ''}`
    if (injected.has(marker)) return
    injected.add(marker)
    const script = document.createElement('script')
    script.setAttribute('data-cn-injected', service)
    if (isAsync) script.async = true
    if (defer) script.defer = true
    if (src) script.src = src
    else if (children) script.textContent = children
    document.head.appendChild(script)
  }, [granted, service, src, children, isAsync, defer])

  return null
}
