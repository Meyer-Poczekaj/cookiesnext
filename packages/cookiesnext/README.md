# cookiesnext

GDPR-friendly cookie consent for **Next.js (App Router)** — with an automatic blocker that intercepts third-party scripts and iframes *before* they load, until the visitor consents.

- 🚦 **Auto-blocking** — embed Google Maps, YouTube & Co. as plain `<iframe>`/`<script>` tags; cookiesnext blocks them globally until consent is given and shows a styled placeholder with a "load content" button
- 📚 **Built-in service catalog** — Google Maps, YouTube, Google Analytics, GTM, Meta Pixel, Vimeo, reCAPTCHA, Hotjar, Matomo, Calendly and more, with URL patterns, descriptions and cookie lists included
- 🎨 **Themeable UI** — polished banner, settings modal, floating widget and placeholders out of the box; restyle everything via CSS variables or bring your own UI with `useConsent()`
- 🌍 **i18n** — German and English built in, every text overridable per language
- 🔁 **Versioned consent** — bump `version` in your config and visitors are asked again
- 🪶 **Zero dependencies** — only React as a peer dependency; consent lives in a first-party cookie

## Installation

```bash
npm install @meyerpoczekaj/cookiesnext
```

Requires Next.js 13+ (App Router) and React 18.2+.

## Quickstart

**1. Create `cookies.config.ts` in your project root:**

```ts
import { defineConsentConfig } from '@meyerpoczekaj/cookiesnext'

export default defineConsentConfig({
  version: 1, // bump to re-ask all visitors
  defaultLanguage: 'de',
  privacyPolicyUrl: '/datenschutz',
  imprintUrl: '/impressum',
  services: [
    // from the built-in catalog:
    { service: 'google-maps' },
    { service: 'youtube' },
    { service: 'google-analytics' },

    // custom service:
    {
      id: 'my-chat',
      name: 'Chat Widget',
      category: 'functional', // 'essential' | 'functional' | 'statistics' | 'marketing'
      provider: 'Chat Corp.',
      description: { de: 'Live-Chat für Support.', en: 'Live chat for support.' },
      patterns: ['chat.example.com'], // URL substrings for the auto-blocker
      cookies: [{ name: 'chat_session', duration: { de: 'Sitzung', en: 'Session' } }],
    },
  ],
})
```

**2. Wrap your app in `app/layout.tsx`:**

```tsx
import { CookiesNext } from '@meyerpoczekaj/cookiesnext'
import '@meyerpoczekaj/cookiesnext/styles.css'
import consentConfig from '@/cookies.config'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <CookiesNext config={consentConfig} locale="de">
          {children}
        </CookiesNext>
      </body>
    </html>
  )
}
```

`<CookiesNext>` must be the **first element inside `<body>`** — it injects the blocking runtime before any embed below it is parsed.

**3. Done.** Embed services like you always do:

```tsx
<iframe src="https://www.google.com/maps/embed?..." suppressHydrationWarning />
```

Until the visitor consents to Google Maps, the iframe never loads and a placeholder with a consent button is shown instead. (`suppressHydrationWarning` silences the — harmless — React dev warning caused by the blocker rewriting the `src` attribute before hydration.)

## How the auto-blocker works

An inline script (rendered by `<CookiesNext>` at the top of `<body>`) runs before the rest of the page is parsed. It:

1. **patches `document.createElement`** — dynamically created scripts/iframes (GTM-style injection) get a guarded `src` setter, so a blocked URL is never assigned and **no request is made**;
2. **watches the DOM via `MutationObserver`** — server-rendered scripts/iframes are neutralised as the parser inserts them (`src` → `about:blank`, scripts → `type="text/plain"`);
3. **matches URLs against your services' `patterns`** to decide what belongs to which service.

When consent is granted, blocked elements are restored in place — no page reload needed.

### Guarantees & limits

| Case | Behaviour |
| --- | --- |
| `<iframe>` in server-rendered HTML | Blocked before the request is sent — **zero requests** to the provider |
| Script injected at runtime (`createElement` + `src`) | Blocked before the request is sent — **zero requests** |
| `<script src>` in server-rendered HTML | **Execution** is always blocked (no tracking code runs, no cookies set), but the browser's preload scanner may still *fetch* the file, which transmits the visitor's IP to the third-party server |
| Scripts in `<head>` above `<CookiesNext>` | Not interceptable — use `<ConsentScript>` (below) for analytics snippets |

For strict **zero-request** script handling, use one of these instead of a plain `<script src>`:

```tsx
// Option A: React component (recommended for analytics/pixels)
import { ConsentScript } from '@meyerpoczekaj/cookiesnext'

<ConsentScript service="google-analytics" src="https://www.googletagmanager.com/gtag/js?id=G-XXXX" async />
<ConsentScript service="google-analytics">{`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXX');
`}</ConsentScript>
```

```html
<!-- Option B: manual markup (works anywhere, even in <head>) -->
<script type="text/plain" data-cookiesnext="google-analytics" data-cn-src="https://..."></script>
<iframe data-cookiesnext="youtube" data-cn-src="https://www.youtube.com/embed/..."></iframe>
```

Both are executed/loaded by cookiesnext once the service is consented.

## The consent UI

- **Banner** — shown on the first visit (and again when `version` changes). Position: `banner.position: 'bottom' | 'center'`.
- **Settings modal** — categories with switches, expandable service details (provider, cookies, privacy link), accept-all / essential-only / save-selection.
- **Floating widget** — small round button to reopen the settings any time. `widget.position: 'bottom-left' | 'bottom-right'`, `widget.show: false` to disable.
- **Placeholders** — automatically rendered over blocked iframes, with "load content" (consents to that one service) and "cookie settings" buttons.
- **Reopen from anywhere** — add `data-cookiesnext-open` to any element (e.g. a footer link), call `useConsent().openSettings()`, or dispatch `window.dispatchEvent(new Event('cookiesnext:open-settings'))`.

## Theming

The default theme is driven by CSS variables — override them globally:

```css
:root {
  --cn-primary: #0e7490;      /* buttons, switches */
  --cn-primary-fg: #ffffff;
  --cn-bg: #ffffff;           /* surfaces */
  --cn-fg: #111827;           /* text */
  --cn-muted: #6b7280;        /* secondary text */
  --cn-muted-bg: #f8fafc;     /* service rows, placeholders */
  --cn-border: #e5e7eb;
  --cn-radius: 14px;
  --cn-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
  --cn-font: inherit;
  --cn-overlay: rgba(15, 23, 42, 0.45);
  --cn-z: 2147483000;

  /* Floating widget (defaults: --cn-bg / --cn-fg / --cn-border) */
  --cn-widget-bg: #ffffff;
  --cn-widget-fg: #111827;
  --cn-widget-border: #e5e7eb;
  --cn-widget-shadow: 0 4px 16px rgba(15, 23, 42, 0.16);
}
```

All elements carry stable `cn-*` classes (`.cn-banner`, `.cn-modal`, `.cn-widget`, `.cn-placeholder`, …) for deeper CSS customisation. For a fully custom UI, skip the CSS import and build your own components on top of `useConsent()`.

## Hooks & components

```tsx
'use client'
import { useConsent, ConsentGate } from '@meyerpoczekaj/cookiesnext'

function MyComponent() {
  const {
    ready,          // consent cookie has been read (client-side)
    hasDecided,     // visitor made a valid choice
    consent,        // { version, timestamp, services: { id: boolean } } | null
    services,       // resolved service list
    hasConsent,     // (id) => boolean
    acceptAll, rejectAll, acceptService, updateServices,
    resetConsent,   // clears the cookie; reloads by default
    openSettings, closeSettings, isSettingsOpen,
  } = useConsent()

  return (
    // explicit alternative/addition to auto-blocking:
    <ConsentGate service="youtube" fallback={<p>YouTube ist deaktiviert.</p>}>
      <YouTubePlayer />
    </ConsentGate>
  )
}
```

## Texts & i18n

German (`de`) and English (`en`) are built in. Pass `locale` per request (e.g. from your route params) and override any text per language:

```ts
defineConsentConfig({
  defaultLanguage: 'de',
  texts: {
    de: {
      banner: { title: 'Cookies & Dienste', acceptAll: 'Einverstanden' },
      categories: { statistics: { description: 'Eigene Beschreibung …' } },
    },
    en: {
      banner: { title: 'Cookies & services' },
    },
  },
  // ...
})
```

Custom service names/descriptions accept plain strings or `{ de: '…', en: '…' }` objects.

## Consent storage

The decision is stored in a first-party cookie (default `cn-consent`, 180 days, `SameSite=Lax`) as JSON:

```json
{ "version": 1, "timestamp": "2026-07-16T09:00:00.000Z", "services": { "youtube": true, "google-maps": false } }
```

- `cookieName` / `cookieMaxAgeDays` are configurable.
- Bumping `version` invalidates stored consent → banner is shown again.
- Being a cookie (not localStorage), it can also be read server-side if you ever need it.

## Built-in catalog

`google-maps`, `youtube`, `vimeo`, `google-analytics`, `google-tag-manager`, `meta-pixel`, `recaptcha`, `hotjar`, `matomo`, `linkedin-insight`, `tiktok-pixel`, `calendly`, `openstreetmap`, `spotify`, `soundcloud`

Each entry ships with URL patterns, provider, DE/EN descriptions and typical cookies. Override `category`, `description` or extend `patterns` per project:

```ts
{ service: 'youtube', category: 'functional', patterns: ['my-proxy.example.com/yt'] }
```

## Events (for advanced integrations)

| Event on `window` | Direction | Purpose |
| --- | --- | --- |
| `cookiesnext:consent` | you may dispatch/listen | consent changed (`detail: { version, services }`) |
| `cookiesnext:blocked` | emitted | an element was blocked |
| `cookiesnext:unblocked` | emitted | elements were restored after consent |
| `cookiesnext:open-settings` | you dispatch | opens the settings modal |

## Notes & good practice

- **Legal**: cookiesnext gives you the technical enforcement (nothing loads before consent, equal-weight accept/decline buttons, revocable any time). The texts, your privacy policy and the service list remain your responsibility.
- Blocked SSR embeds cause a **dev-only** React hydration notice — add `suppressHydrationWarning` to embeds you expect to be blocked, or author them with `data-cn-src` (no `src`).
- `resetConsent()` reloads the page by default, because already-executed scripts cannot be "unloaded".

## Roadmap

- Google Consent Mode v2 signals
- Server-side consent logging adapter (Art. 7 GDPR proof)
- Pages Router support

## License

MIT
