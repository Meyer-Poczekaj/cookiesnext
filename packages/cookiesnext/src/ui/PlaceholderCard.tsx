'use client'

import { useCookiesNextContext } from '../context.js'
import { formatText, resolveText } from '../i18n.js'
import { ShieldIcon } from './icons.js'

/**
 * The card shown instead of a blocked embed — used by the automatic
 * iframe placeholders and as default fallback of <ConsentGate>.
 */
export function PlaceholderCard({ serviceId }: { serviceId: string }) {
  const { config, texts, lang, acceptService, openSettings } = useCookiesNextContext()
  const service = config.services.find((s) => s.id === serviceId)
  const serviceName = service
    ? resolveText(service.name, lang, config.defaultLanguage)
    : serviceId

  return (
    <div className="cn-placeholder" role="region" aria-label={texts.placeholder.title}>
      <div className="cn-ph-icon">
        <ShieldIcon />
      </div>
      <p className="cn-ph-title">{texts.placeholder.title}</p>
      <p className="cn-ph-text">
        {formatText(texts.placeholder.description, { service: serviceName })}
      </p>
      <div className="cn-ph-actions">
        <button
          type="button"
          className="cn-btn cn-btn-primary"
          onClick={() => acceptService(serviceId)}
        >
          {texts.placeholder.load}
        </button>
        <button type="button" className="cn-btn cn-btn-ghost" onClick={openSettings}>
          {texts.placeholder.settings}
        </button>
      </div>
    </div>
  )
}
