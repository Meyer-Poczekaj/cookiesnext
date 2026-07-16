'use client'

import { useCookiesNextContext } from '../context.js'
import { CookieIcon } from './icons.js'

export function Widget() {
  const { ready, hasDecided, isSettingsOpen, showBanner, config, texts, openSettings } =
    useCookiesNextContext()

  if (!ready || !config.widget.show || !hasDecided || isSettingsOpen || showBanner) {
    return null
  }

  return (
    <button
      type="button"
      className={`cn-widget cn-widget-${config.widget.position}`}
      onClick={openSettings}
      aria-label={texts.widget.label}
      title={texts.widget.label}
    >
      <CookieIcon />
    </button>
  )
}
