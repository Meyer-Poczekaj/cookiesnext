'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCookiesNextContext } from '../context.js'
import { PlaceholderCard } from './PlaceholderCard.js'

interface PlaceholderEntry {
  key: number
  serviceId: string
  iframe: HTMLIFrameElement
  host: HTMLElement
}

let nextKey = 1

/**
 * Watches for iframes the blocker runtime neutralised
 * (`iframe[data-cn-blocked]`), hides them and renders a consent
 * placeholder right next to them via portals.
 */
export function Placeholders() {
  const { consent } = useCookiesNextContext()
  const trackedRef = useRef(new Map<HTMLIFrameElement, PlaceholderEntry>())
  const [entries, setEntries] = useState<PlaceholderEntry[]>([])

  const sync = useCallback(() => {
    const tracked = trackedRef.current
    let changed = false

    // Remove placeholders whose iframe was unblocked or left the DOM.
    for (const [iframe, entry] of tracked) {
      const gone = !iframe.isConnected
      const unblocked = !iframe.hasAttribute('data-cn-blocked')
      if (gone || unblocked) {
        if (unblocked && !gone) iframe.style.removeProperty('display')
        entry.host.remove()
        tracked.delete(iframe)
        changed = true
      }
    }

    // Register newly blocked iframes.
    const found = document.querySelectorAll<HTMLIFrameElement>('iframe[data-cn-blocked]')
    for (const iframe of found) {
      if (tracked.has(iframe) || !iframe.isConnected) continue
      const serviceId = iframe.getAttribute('data-cn-blocked')
      if (!serviceId) continue

      const rect = iframe.getBoundingClientRect()
      const host = document.createElement('div')
      host.className = 'cn-ph-host'
      const heightAttr = Number(iframe.getAttribute('height'))
      const widthAttr = Number(iframe.getAttribute('width'))
      if (heightAttr > 0) host.style.height = `${heightAttr}px`
      else if (rect.height > 40) host.style.height = `${rect.height}px`
      else host.style.aspectRatio = '16 / 9'
      if (widthAttr > 0) host.style.maxWidth = `${widthAttr}px`

      iframe.insertAdjacentElement('afterend', host)
      iframe.style.setProperty('display', 'none', 'important')

      tracked.set(iframe, { key: nextKey++, serviceId, iframe, host })
      changed = true
    }

    if (changed) setEntries([...tracked.values()])
  }, [])

  useEffect(() => {
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(sync)
    }
    sync()
    window.addEventListener('cookiesnext:blocked', schedule)
    window.addEventListener('cookiesnext:unblocked', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('cookiesnext:blocked', schedule)
      window.removeEventListener('cookiesnext:unblocked', schedule)
    }
  }, [sync])

  // Re-sync after consent changes (unblocking happens synchronously in the
  // blocker runtime, this removes the matching placeholders).
  useEffect(() => {
    sync()
  }, [consent, sync])

  return (
    <>
      {entries.map((entry) =>
        createPortal(<PlaceholderCard serviceId={entry.serviceId} />, entry.host, String(entry.key)),
      )}
    </>
  )
}
