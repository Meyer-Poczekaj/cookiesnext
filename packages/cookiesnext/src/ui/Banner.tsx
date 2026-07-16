'use client'

import { useCookiesNextContext } from '../context.js'
import { CookieIcon } from './icons.js'

export function Banner() {
  const { showBanner, config, texts, acceptAll, rejectAll, openSettings } =
    useCookiesNextContext()

  if (!showBanner) return null

  const banner = (
    <div
      className={`cn-banner cn-banner-${config.banner.position}`}
      role="dialog"
      aria-modal={config.banner.position === 'center'}
      aria-labelledby="cn-banner-title"
      aria-describedby="cn-banner-desc"
    >
      <div className="cn-banner-head">
        <span className="cn-icon-tile" aria-hidden="true">
          <CookieIcon size={16} />
        </span>
        <p className="cn-title" id="cn-banner-title">
          {texts.banner.title}
        </p>
      </div>
      <p className="cn-text" id="cn-banner-desc">
        {texts.banner.description}
      </p>
      {(config.privacyPolicyUrl || config.imprintUrl) && (
        <p className="cn-links">
          {config.privacyPolicyUrl && (
            <a href={config.privacyPolicyUrl}>{texts.modal.privacyPolicy}</a>
          )}
          {config.imprintUrl && <a href={config.imprintUrl}>{texts.modal.imprint}</a>}
        </p>
      )}
      <div className="cn-banner-actions">
        <button type="button" className="cn-btn cn-btn-ghost" onClick={openSettings}>
          {texts.banner.settings}
        </button>
        <button type="button" className="cn-btn cn-btn-secondary" onClick={rejectAll}>
          {texts.banner.rejectAll}
        </button>
        <button type="button" className="cn-btn cn-btn-primary" onClick={acceptAll}>
          {texts.banner.acceptAll}
        </button>
      </div>
    </div>
  )

  if (config.banner.position === 'center') {
    return <div className="cn-overlay">{banner}</div>
  }
  return banner
}
