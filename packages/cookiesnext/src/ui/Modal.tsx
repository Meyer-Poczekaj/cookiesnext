'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useCookiesNextContext } from '../context.js'
import { formatText, resolveText } from '../i18n.js'
import { CATEGORY_IDS, type CategoryId, type ResolvedService } from '../types.js'
import { ChevronIcon, CloseIcon } from './icons.js'

function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  label: string
}) {
  return (
    <label className={`cn-switch${disabled ? ' cn-switch-disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        aria-label={label}
      />
      <span className="cn-switch-track" aria-hidden="true">
        <span className="cn-switch-thumb" />
      </span>
    </label>
  )
}

function ServiceRow({
  service,
  checked,
  onChange,
}: {
  service: ResolvedService
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const { config, texts, lang } = useCookiesNextContext()
  const essential = service.category === 'essential'
  const name = resolveText(service.name, lang, config.defaultLanguage)
  const description = resolveText(service.description, lang, config.defaultLanguage)
  const provider = resolveText(service.provider, lang, config.defaultLanguage)

  return (
    <div className="cn-service">
      <div className="cn-service-head">
        <span className="cn-service-name">{name}</span>
        <Switch
          checked={essential || checked}
          disabled={essential}
          onChange={onChange}
          label={name}
        />
      </div>
      {description && <p className="cn-service-desc">{description}</p>}
      <dl className="cn-service-meta">
        {provider && (
          <>
            <dt>{texts.modal.provider}</dt>
            <dd>{provider}</dd>
          </>
        )}
        {service.cookies.length > 0 && (
          <>
            <dt>{texts.modal.cookies}</dt>
            <dd>
              {service.cookies
                .map((cookie) => {
                  const duration = resolveText(cookie.duration, lang, config.defaultLanguage)
                  return duration ? `${cookie.name} (${duration})` : cookie.name
                })
                .join(', ')}
            </dd>
          </>
        )}
        {service.privacyPolicyUrl && (
          <>
            <dt>{texts.modal.privacyPolicy}</dt>
            <dd>
              <a href={service.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
                {service.privacyPolicyUrl.replace(/^https?:\/\//, '').split('/')[0]}
              </a>
            </dd>
          </>
        )}
      </dl>
    </div>
  )
}

function CategoryBlock({
  category,
  services,
  draft,
  setDraft,
}: {
  category: CategoryId
  services: ResolvedService[]
  draft: Record<string, boolean>
  setDraft: (updater: (draft: Record<string, boolean>) => Record<string, boolean>) => void
}) {
  const { texts } = useCookiesNextContext()
  const [expanded, setExpanded] = useState(false)
  const essential = category === 'essential'
  const allOn = services.every((s) => draft[s.id] === true)

  const toggleCategory = (checked: boolean) => {
    setDraft((current) => {
      const next = { ...current }
      for (const service of services) next[service.id] = checked
      return next
    })
  }

  return (
    <section className="cn-category">
      <div className="cn-category-head">
        <div className="cn-category-info">
          <p className="cn-category-name">{texts.categories[category].name}</p>
          <p className="cn-category-desc">{texts.categories[category].description}</p>
        </div>
        {essential ? (
          <span className="cn-always-active">{texts.modal.alwaysActive}</span>
        ) : (
          <Switch
            checked={services.length > 0 && allOn}
            disabled={services.length === 0}
            onChange={toggleCategory}
            label={texts.categories[category].name}
          />
        )}
      </div>
      {services.length > 0 && (
        <>
          <button
            type="button"
            className="cn-details-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronIcon open={expanded} />
            {expanded ? texts.modal.hideDetails : texts.modal.showDetails}
            <span className="cn-count">
              {formatText(texts.modal.serviceCount, { count: services.length })}
            </span>
          </button>
          {expanded && (
            <div className="cn-services">
              {services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  checked={draft[service.id] === true}
                  onChange={(checked) =>
                    setDraft((current) => ({ ...current, [service.id]: checked }))
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function Modal() {
  const {
    isSettingsOpen,
    closeSettings,
    config,
    texts,
    consent,
    hasDecided,
    acceptAll,
    rejectAll,
    updateServices,
  } = useCookiesNextContext()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<Record<string, boolean>>({})

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, ResolvedService[]>()
    for (const id of CATEGORY_IDS) map.set(id, [])
    for (const service of config.services) map.get(service.category)?.push(service)
    return map
  }, [config.services])

  // Initialise the draft from the stored consent each time the modal opens.
  useEffect(() => {
    if (!isSettingsOpen) return
    const initial: Record<string, boolean> = {}
    for (const service of config.services) {
      initial[service.id] =
        service.category === 'essential' ||
        (hasDecided && consent?.services[service.id] === true)
    }
    setDraft(initial)
  }, [isSettingsOpen, config.services, consent, hasDecided])

  // Escape closes, focus moves into the dialog, Tab stays inside.
  useEffect(() => {
    if (!isSettingsOpen) return
    const dialog = dialogRef.current
    dialog?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSettings()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isSettingsOpen, closeSettings])

  if (!isSettingsOpen) return null

  return (
    <div
      className="cn-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeSettings()
      }}
    >
      <div
        className="cn-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cn-modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="cn-modal-head">
          <p className="cn-title" id="cn-modal-title">
            {texts.modal.title}
          </p>
          <button
            type="button"
            className="cn-icon-btn"
            onClick={closeSettings}
            aria-label={texts.modal.close}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="cn-modal-body">
          <p className="cn-text">{texts.modal.description}</p>
          {CATEGORY_IDS.map((category) => {
            const services = grouped.get(category) ?? []
            if (services.length === 0 && category !== 'essential') return null
            return (
              <CategoryBlock
                key={category}
                category={category}
                services={services}
                draft={draft}
                setDraft={setDraft}
              />
            )
          })}
          {(config.privacyPolicyUrl || config.imprintUrl) && (
            <p className="cn-links">
              {config.privacyPolicyUrl && (
                <a href={config.privacyPolicyUrl}>{texts.modal.privacyPolicy}</a>
              )}
              {config.imprintUrl && <a href={config.imprintUrl}>{texts.modal.imprint}</a>}
            </p>
          )}
        </div>
        <div className="cn-modal-foot">
          <button type="button" className="cn-btn cn-btn-secondary" onClick={rejectAll}>
            {texts.modal.rejectAll}
          </button>
          <button
            type="button"
            className="cn-btn cn-btn-secondary"
            onClick={() => updateServices(draft)}
          >
            {texts.modal.save}
          </button>
          <button type="button" className="cn-btn cn-btn-primary" onClick={acceptAll}>
            {texts.modal.acceptAll}
          </button>
        </div>
      </div>
    </div>
  )
}
