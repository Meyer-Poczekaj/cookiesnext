import type { ConsentState } from './types.js'

/** Parse a raw cookie value into a ConsentState, or null if invalid. */
export function parseConsentValue(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as ConsentState).version === 'number' &&
      typeof (parsed as ConsentState).services === 'object' &&
      (parsed as ConsentState).services !== null
    ) {
      return parsed as ConsentState
    }
  } catch {
    // ignore malformed cookies
  }
  return null
}

export function serializeConsentValue(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state))
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const prefix = name + '='
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length)
  }
  return null
}

export function readConsentCookie(name: string): ConsentState | null {
  return parseConsentValue(getCookie(name))
}

export function writeConsentCookie(name: string, state: ConsentState, maxAgeDays: number): void {
  if (typeof document === 'undefined') return
  const maxAge = Math.round(maxAgeDays * 24 * 60 * 60)
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${serializeConsentValue(state)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

export function clearConsentCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}
