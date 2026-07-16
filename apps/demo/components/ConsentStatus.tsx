'use client'

import { useEffect, useState } from 'react'
import { useConsent } from '@meyerpoczekaj/cookiesnext'

declare global {
  interface Window {
    __demoAnalyticsLoaded?: boolean
  }
}

export function ConsentStatus() {
  const { ready, hasDecided, consent, services, hasConsent, openSettings, resetConsent } =
    useConsent()
  const [analyticsRan, setAnalyticsRan] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnalyticsRan(window.__demoAnalyticsLoaded === true)
    }, 500)
    return () => clearInterval(timer)
  }, [])

  if (!ready) return null

  return (
    <section className="card">
      <h2>Consent-Status (live)</h2>
      <p>
        {hasDecided && consent
          ? `Entschieden am ${new Date(consent.timestamp).toLocaleString('de-DE')}`
          : 'Noch keine Entscheidung getroffen.'}
      </p>
      <ul className="status-list">
        {services.map((service) => {
          const granted = hasConsent(service.id)
          const name = typeof service.name === 'string' ? service.name : service.id
          return (
            <li key={service.id}>
              <span className={`dot ${granted ? 'on' : 'off'}`} />
              {name} — {granted ? 'erlaubt' : 'blockiert'}
            </li>
          )
        })}
        <li>
          <span className={`dot ${analyticsRan ? 'on' : 'off'}`} />
          demo-analytics.js — {analyticsRan ? 'wurde ausgeführt' : 'nicht ausgeführt'}
        </li>
      </ul>
      <div className="actions">
        <button type="button" onClick={openSettings}>
          Einstellungen öffnen
        </button>
        <button type="button" onClick={() => resetConsent()}>
          Consent zurücksetzen
        </button>
      </div>
    </section>
  )
}
