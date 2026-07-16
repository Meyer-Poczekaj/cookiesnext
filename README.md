# cookiesnext

**Deutsch** · [English](#english)

> 📦 Auf npm veröffentlicht als **[`@meyerpoczekaj/cookiesnext`](https://www.npmjs.com/package/@meyerpoczekaj/cookiesnext)** · Published on npm as **`@meyerpoczekaj/cookiesnext`**

DSGVO-freundliches Cookie-Consent für **Next.js (App Router)** — mit automatischem Blocker, der Third-Party-Scripts und iFrames abfängt, *bevor* sie laden. Erst wenn der Besucher einwilligt, wird der Inhalt nachgeladen — ganz ohne Wrapper-Komponenten um jede Einbettung.

- 🚦 **Auto-Blocking** — Google Maps, YouTube & Co. ganz normal als `<iframe>`/`<script>` einbinden; cookiesnext blockiert sie global bis zur Einwilligung und zeigt einen Platzhalter mit „Inhalt laden"-Button
- 📚 **Eingebauter Dienste-Katalog** — Google Maps, YouTube, Google Analytics, GTM, Meta Pixel u. v. m. mit fertigen URL-Mustern, Beschreibungen und Cookie-Listen
- 🎨 **Anpassbares UI** — Banner, Einstellungs-Modal, schwebendes Widget und Platzhalter out of the box; komplett per CSS-Variablen gestaltbar
- 🌍 **i18n** — Deutsch und Englisch eingebaut, jeder Text pro Sprache überschreibbar
- 🔁 **Versionierter Consent** — `version` in der Config hochzählen → Besucher werden erneut gefragt
- 🪶 **Keine Dependencies** — nur React als Peer-Dependency; Consent liegt in einem First-Party-Cookie

---

## Inhalt

1. [Installation](#installation)
2. [Schnellstart](#schnellstart)
3. [Wie das Auto-Blocking funktioniert](#wie-das-auto-blocking-funktioniert)
4. [Alle Config-Optionen](#alle-config-optionen)
5. [Dienste definieren](#dienste-definieren)
6. [Der eingebaute Katalog](#der-eingebaute-katalog)
7. [Design anpassen (Theming)](#design-anpassen-theming)
8. [Texte & Sprachen](#texte--sprachen)
9. [Hooks & Komponenten](#hooks--komponenten)
10. [Events](#events)
11. [Grenzen & Empfehlungen](#grenzen--empfehlungen)

## Installation

```bash
npm install @meyerpoczekaj/cookiesnext
```

Voraussetzungen: Next.js 13+ mit App Router, React 18.2+.

## Schnellstart

**1. `cookies.config.ts` im Projekt-Root anlegen:**

```ts
import { defineConsentConfig } from '@meyerpoczekaj/cookiesnext'

export default defineConsentConfig({
  version: 1,
  defaultLanguage: 'de',
  privacyPolicyUrl: '/datenschutz',
  imprintUrl: '/impressum',
  services: [
    { service: 'google-maps' },
    { service: 'youtube' },
    { service: 'google-analytics' },
  ],
})
```

**2. App in `app/layout.tsx` wrappen:**

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

> ⚠️ `<CookiesNext>` muss das **erste Element in `<body>`** sein — es injiziert das Blocker-Script, bevor darunterliegende Embeds geparst werden.

**3. Fertig.** Dienste wie gewohnt einbinden:

```tsx
<iframe src="https://www.google.com/maps/embed?..." suppressHydrationWarning />
```

Ohne Einwilligung lädt das iFrame nicht — stattdessen erscheint ein Platzhalter mit Hinweis und Consent-Button. (`suppressHydrationWarning` unterdrückt die harmlose React-Dev-Warnung, die entsteht, weil der Blocker das `src`-Attribut vor der Hydration umschreibt.)

## Wie das Auto-Blocking funktioniert

Ein Inline-Script (von `<CookiesNext>` am Anfang des `<body>` gerendert) läuft, bevor der Rest der Seite geparst wird:

1. **`document.createElement` wird gepatcht** — dynamisch erzeugte Scripts/iFrames (z. B. GTM-Injektionen) bekommen einen bewachten `src`-Setter: Eine blockierte URL wird nie gesetzt, **es entsteht kein Request**.
2. **MutationObserver** — server-gerenderte Scripts/iFrames werden neutralisiert, während der Parser sie einfügt (`src` → `about:blank`, Scripts → `type="text/plain"`).
3. **URL-Matching** — jede URL wird gegen die `patterns` deiner Dienste geprüft, um sie einem Dienst zuzuordnen.

Nach der Einwilligung werden blockierte Elemente an Ort und Stelle wiederhergestellt — ohne Seiten-Reload.

| Fall | Verhalten |
| --- | --- |
| `<iframe>` im Server-HTML | Blockiert bevor der Request rausgeht — **null Requests** an den Anbieter |
| Script zur Laufzeit injiziert (`createElement` + `src`) | Blockiert bevor der Request rausgeht — **null Requests** |
| `<script src>` im Server-HTML | **Ausführung** wird immer verhindert (kein Tracking, keine Cookies), aber der Preload-Scanner des Browsers kann die Datei trotzdem *fetchen* (IP-Übertragung an den Drittserver) |
| Scripts im `<head>` oberhalb von `<CookiesNext>` | Nicht abfangbar — dafür `<ConsentScript>` verwenden (siehe unten) |

Für **garantiert null Requests** bei Scripts:

```tsx
// Variante A: React-Komponente (empfohlen für Analytics/Pixel)
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
<!-- Variante B: manuelles Markup (funktioniert überall, auch im <head>) -->
<script type="text/plain" data-cookiesnext="google-analytics" data-cn-src="https://..."></script>
<iframe data-cookiesnext="youtube" data-cn-src="https://www.youtube.com/embed/..."></iframe>
```

Beides wird von cookiesnext geladen/ausgeführt, sobald der Dienst akzeptiert wurde.

## Alle Config-Optionen

```ts
defineConsentConfig({
  // Consent-Version. Hochzählen bei Änderungen an den Diensten
  // → gespeicherte Einwilligungen werden ungültig, Banner erscheint erneut.
  version: 1,                          // default: 1

  // Name des First-Party-Cookies, in dem die Entscheidung liegt.
  cookieName: 'cn-consent',            // default: 'cn-consent'

  // Gültigkeit des Consent-Cookies in Tagen.
  cookieMaxAgeDays: 180,               // default: 180

  // Fallback-Sprache, wenn für die aktive Sprache kein Text existiert.
  defaultLanguage: 'de',               // default: 'de'

  // Die konfigurierten Dienste (siehe nächster Abschnitt). Pflichtfeld.
  services: [ /* ... */ ],

  // Links, die in Banner und Modal angezeigt werden (optional).
  privacyPolicyUrl: '/datenschutz',
  imprintUrl: '/impressum',

  // Automatisches Blocking per URL-Matching an/aus.
  // Bei false greifen nur manuelles Markup, <ConsentGate> und <ConsentScript>.
  autoBlock: true,                     // default: true

  banner: {
    // 'bottom' = Karte unten mittig, 'center' = zentriertes Modal mit Overlay.
    position: 'bottom',                // default: 'bottom'
  },

  widget: {
    // Position des schwebenden Buttons zum Wiederöffnen der Einstellungen.
    position: 'bottom-left',           // default: 'bottom-left' | 'bottom-right'
    // Widget komplett ausblenden (z. B. wenn du nur einen Footer-Link willst).
    show: true,                        // default: true
  },

  // Text-Overrides pro Sprache (siehe „Texte & Sprachen").
  texts: { /* ... */ },
})
```

Props von `<CookiesNext>`:

| Prop | Typ | Beschreibung |
| --- | --- | --- |
| `config` | `CookiesNextConfig` | Die Config (muss JSON-serialisierbar sein — sie wird vom Server- an den Client-Baum übergeben) |
| `locale` | `string` | UI-Sprache, z. B. `'de'`/`'en'`. Default: `config.defaultLanguage`. Bei mehrsprachigen Sites das Routen-Locale durchreichen |
| `children` | `ReactNode` | Deine App |

## Dienste definieren

Zwei Varianten, beliebig mischbar:

**A) Katalog-Referenz** — Muster, Beschreibung, Cookies kommen aus dem eingebauten Katalog:

```ts
{ service: 'youtube' }

// mit Overrides:
{
  service: 'youtube',
  category: 'functional',                    // Kategorie überschreiben
  patterns: ['mein-proxy.de/yt'],            // zusätzliche URL-Muster (werden ergänzt)
  description: { de: 'Eigene Beschreibung' },// Beschreibung überschreiben
  privacyPolicyUrl: 'https://…',             // Link überschreiben
}
```

**B) Eigener Dienst** — alles selbst definiert:

```ts
{
  id: 'my-chat',                       // eindeutige ID (Pflicht)
  name: 'Chat Widget',                 // string oder { de: '…', en: '…' } (Pflicht)
  category: 'functional',              // 'essential' | 'functional' | 'statistics' | 'marketing' (Pflicht)
  description: { de: 'Live-Chat für Support.', en: 'Live chat for support.' },
  provider: 'Chat Corp.',              // Anbieter, wird im Modal angezeigt
  privacyPolicyUrl: 'https://chat.example.com/privacy',
  patterns: ['chat.example.com'],      // URL-Teilstrings für den Auto-Blocker
  cookies: [                           // Cookie-Liste fürs Modal
    { name: 'chat_session', duration: { de: 'Sitzung', en: 'Session' }, description: { de: '…' } },
  ],
}
```

Hinweise:

- Dienste mit `category: 'essential'` sind immer aktiv und nicht abwählbar.
- `patterns` sind einfache **Teilstring-Vergleiche** gegen die URL (`url.includes(pattern)`).
- Ohne `patterns` wird ein Dienst nicht automatisch geblockt — er ist dann nur über `<ConsentGate>`, `<ConsentScript>` oder manuelles Markup (`data-cookiesnext="id"`) steuerbar.

## Der eingebaute Katalog

`google-maps` · `youtube` · `vimeo` · `google-analytics` · `google-tag-manager` · `meta-pixel` · `recaptcha` · `hotjar` · `matomo` · `linkedin-insight` · `tiktok-pixel` · `calendly` · `openstreetmap` · `spotify` · `soundcloud`

Jeder Eintrag bringt URL-Muster, Anbieter, DE/EN-Beschreibung und typische Cookies mit. Der Katalog ist als `serviceCatalog` exportiert, falls du ihn inspizieren willst.

## Design anpassen (Theming)

Das Default-Theme hängt komplett an CSS-Variablen — global überschreiben:

```css
:root {
  --cn-primary: #0e7490;      /* Buttons, Schalter */
  --cn-primary-fg: #ffffff;   /* Text auf Primärfarbe */
  --cn-bg: #ffffff;           /* Flächen (Banner, Modal, Widget) */
  --cn-fg: #111827;           /* Text */
  --cn-muted: #6b7280;        /* Sekundärtext */
  --cn-muted-bg: #f8fafc;     /* Dienst-Zeilen, Platzhalter-Hintergrund */
  --cn-border: #e5e7eb;       /* Rahmen */
  --cn-radius: 14px;          /* Eckenradius */
  --cn-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
  --cn-font: inherit;         /* Schrift (default: System-Stack) */
  --cn-overlay: rgba(15, 23, 42, 0.45);  /* Modal-Overlay */
  --cn-z: 2147483000;         /* z-index */
  --cn-switch-off: #d1d5db;   /* Schalter aus */
  --cn-ph-bg: #f8fafc;        /* Platzhalter-Hintergrund */

  /* Schwebendes Widget (Defaults: --cn-bg / --cn-fg / --cn-border) */
  --cn-widget-bg: #ffffff;    /* Widget-Hintergrund */
  --cn-widget-fg: #111827;    /* Icon-Farbe */
  --cn-widget-border: #e5e7eb;
  --cn-widget-shadow: 0 4px 16px rgba(15, 23, 42, 0.16);
}
```

Alle Elemente tragen stabile `cn-*`-Klassen (`.cn-banner`, `.cn-modal`, `.cn-widget`, `.cn-placeholder`, `.cn-btn-primary`, …) für tiefere CSS-Anpassungen. Für ein komplett eigenes UI: CSS-Import weglassen und mit `useConsent()` eigene Komponenten bauen.

## Texte & Sprachen

Deutsch (`de`) und Englisch (`en`) sind eingebaut. Jeden Text pro Sprache überschreiben:

```ts
defineConsentConfig({
  texts: {
    de: {
      banner: {
        title: 'Cookies & Dienste',
        description: 'Eigener Einleitungstext …',
        acceptAll: 'Einverstanden',
        rejectAll: 'Nur Notwendige',
        settings: 'Anpassen',
      },
      modal: {
        title: 'Privatsphäre',
        // description, acceptAll, rejectAll, save, alwaysActive, showDetails,
        // hideDetails, provider, cookies, duration, privacyPolicy, imprint,
        // serviceCount ('{count} Dienste'), close
      },
      placeholder: {
        title: 'Externer Inhalt',
        description: 'Dieser Inhalt kommt von {service} …', // {service}-Token
        load: 'Inhalt laden',
        settings: 'Cookie-Einstellungen',
      },
      widget: { label: 'Cookie-Einstellungen öffnen' },
      categories: {
        statistics: { name: 'Analyse', description: 'Eigene Beschreibung …' },
        // essential, functional, marketing analog
      },
    },
    en: { /* gleiche Struktur */ },
  },
})
```

Namen/Beschreibungen eigener Dienste akzeptieren Strings oder `{ de: '…', en: '…' }`-Objekte.

## Hooks & Komponenten

```tsx
'use client'
import { useConsent, ConsentGate } from '@meyerpoczekaj/cookiesnext'

function MyComponent() {
  const {
    ready,          // Cookie wurde gelesen (client-seitig) — vorher false
    hasDecided,     // Besucher hat eine (noch gültige) Wahl getroffen
    consent,        // { version, timestamp, services: { id: boolean } } | null
    services,       // aufgelöste Dienst-Liste
    hasConsent,     // (id) => boolean — essenzielle Dienste immer true
    acceptAll,      // alles akzeptieren
    rejectAll,      // nur essenzielle
    acceptService,  // (id) => einen Dienst zusätzlich freigeben
    updateServices, // ({ id: boolean }) => Auswahl speichern
    resetConsent,   // Cookie löschen; lädt die Seite standardmäßig neu
                    // resetConsent({ reload: false }) für ohne Reload
    openSettings, closeSettings, isSettingsOpen,
  } = useConsent()

  return (
    <ConsentGate service="youtube" fallback={<p>YouTube ist deaktiviert.</p>}>
      <YouTubePlayer />
    </ConsentGate>
  )
}
```

- **`<ConsentGate service fallback>`** — rendert Kinder erst nach Einwilligung; ohne `fallback` erscheint der Standard-Platzhalter. Ideal für React-Komponenten, die selbst SDKs nachladen.
- **`<ConsentScript service src>`** / mit Inline-Body — lädt ein Script erst nach Einwilligung (null Requests vorher).
- **Einstellungen von überall öffnen** — `data-cookiesnext-open` auf ein beliebiges Element setzen (z. B. Footer-Link), `useConsent().openSettings()` aufrufen oder das Event `cookiesnext:open-settings` dispatchen.

## Events

| Event auf `window` | Richtung | Zweck |
| --- | --- | --- |
| `cookiesnext:consent` | wird emittiert (& kann gehört werden) | Consent geändert — `detail: { version, services }` |
| `cookiesnext:blocked` | wird emittiert | Ein Element wurde blockiert |
| `cookiesnext:unblocked` | wird emittiert | Elemente wurden nach Einwilligung wiederhergestellt |
| `cookiesnext:open-settings` | selbst dispatchen | Öffnet das Einstellungs-Modal |

## Grenzen & Empfehlungen

- **Rechtliches**: cookiesnext liefert die technische Durchsetzung (nichts lädt vor der Einwilligung, gleichwertige Akzeptieren/Ablehnen-Buttons, jederzeit widerrufbar). Texte, Datenschutzerklärung und die Vollständigkeit der Dienst-Liste bleiben deine Verantwortung.
- Blockierte SSR-Embeds erzeugen eine **Dev-only** React-Hydration-Notiz — `suppressHydrationWarning` auf das Embed setzen oder mit `data-cn-src` (ohne `src`) auslegen.
- `resetConsent()` lädt die Seite standardmäßig neu, weil bereits ausgeführte Scripts nicht „entladen" werden können.
- Consent-Cookie: `cn-consent`, 180 Tage, `SameSite=Lax`, JSON — kann bei Bedarf auch serverseitig gelesen werden.

---

# English

GDPR-friendly cookie consent for **Next.js (App Router)** — with an automatic blocker that intercepts third-party scripts and iframes *before* they load. Content is only loaded once the visitor consents — no wrapper components around every embed.

- 🚦 **Auto-blocking** — embed Google Maps, YouTube & Co. as plain `<iframe>`/`<script>` tags; cookiesnext blocks them globally until consent is given and shows a placeholder with a "load content" button
- 📚 **Built-in service catalog** — Google Maps, YouTube, Google Analytics, GTM, Meta Pixel and more, with URL patterns, descriptions and cookie lists included
- 🎨 **Themeable UI** — banner, settings modal, floating widget and placeholders out of the box; fully restylable via CSS variables
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
  version: 1,
  defaultLanguage: 'en',
  privacyPolicyUrl: '/privacy',
  imprintUrl: '/imprint',
  services: [
    { service: 'google-maps' },
    { service: 'youtube' },
    { service: 'google-analytics' },
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
    <html lang="en">
      <body>
        <CookiesNext config={consentConfig} locale="en">
          {children}
        </CookiesNext>
      </body>
    </html>
  )
}
```

> ⚠️ `<CookiesNext>` must be the **first element inside `<body>`** — it injects the blocking runtime before any embed below it is parsed.

**3. Done.** Embed services like you always do:

```tsx
<iframe src="https://www.google.com/maps/embed?..." suppressHydrationWarning />
```

Until the visitor consents, the iframe never loads — a placeholder with a consent button is shown instead. (`suppressHydrationWarning` silences the harmless React dev warning caused by the blocker rewriting `src` before hydration.)

## How the auto-blocker works

An inline script (rendered by `<CookiesNext>` at the top of `<body>`) runs before the rest of the page is parsed:

1. **patches `document.createElement`** — dynamically created scripts/iframes (GTM-style injection) get a guarded `src` setter: a blocked URL is never assigned, **no request is made**;
2. **MutationObserver** — server-rendered scripts/iframes are neutralised as the parser inserts them (`src` → `about:blank`, scripts → `type="text/plain"`);
3. **URL matching** — every URL is checked against your services' `patterns`.

After consent, blocked elements are restored in place — no page reload.

| Case | Behaviour |
| --- | --- |
| `<iframe>` in server-rendered HTML | Blocked before the request is sent — **zero requests** |
| Script injected at runtime (`createElement` + `src`) | Blocked before the request is sent — **zero requests** |
| `<script src>` in server-rendered HTML | **Execution** is always blocked (no tracking, no cookies), but the browser's preload scanner may still *fetch* the file (IP transmitted to the third party) |
| Scripts in `<head>` above `<CookiesNext>` | Not interceptable — use `<ConsentScript>` instead |

For guaranteed **zero-request** script handling:

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

Both are loaded/executed by cookiesnext once the service is consented.

## Full config reference

```ts
defineConsentConfig({
  // Consent version. Bump when services change
  // → stored consent becomes invalid, the banner shows again.
  version: 1,                          // default: 1

  // Name of the first-party cookie storing the decision.
  cookieName: 'cn-consent',            // default: 'cn-consent'

  // Cookie lifetime in days.
  cookieMaxAgeDays: 180,               // default: 180

  // Fallback language when no translation exists for the active language.
  defaultLanguage: 'de',               // default: 'de'

  // Configured services (see below). Required.
  services: [ /* ... */ ],

  // Links shown in banner and modal (optional).
  privacyPolicyUrl: '/privacy',
  imprintUrl: '/imprint',

  // Toggle URL-based auto-blocking.
  // With false, only manual markup, <ConsentGate> and <ConsentScript> apply.
  autoBlock: true,                     // default: true

  banner: {
    // 'bottom' = card at bottom center, 'center' = centered modal with overlay.
    position: 'bottom',                // default: 'bottom'
  },

  widget: {
    // Position of the floating reopen button.
    position: 'bottom-left',           // 'bottom-left' | 'bottom-right'
    // Hide the widget entirely (e.g. if you only want a footer link).
    show: true,                        // default: true
  },

  // Text overrides per language (see "Texts & i18n").
  texts: { /* ... */ },
})
```

`<CookiesNext>` props:

| Prop | Type | Description |
| --- | --- | --- |
| `config` | `CookiesNextConfig` | The config (must be JSON-serializable — it crosses the server/client boundary) |
| `locale` | `string` | UI language, e.g. `'de'`/`'en'`. Defaults to `config.defaultLanguage`. Pass your route locale on multilingual sites |
| `children` | `ReactNode` | Your app |

## Defining services

Two variants, freely mixable:

**A) Catalog reference** — patterns, description and cookies come from the built-in catalog:

```ts
{ service: 'youtube' }

// with overrides:
{
  service: 'youtube',
  category: 'functional',                 // override the category
  patterns: ['my-proxy.com/yt'],          // extra URL patterns (merged)
  description: { en: 'Custom text' },     // override the description
  privacyPolicyUrl: 'https://…',
}
```

**B) Custom service** — fully self-defined:

```ts
{
  id: 'my-chat',                       // unique id (required)
  name: 'Chat Widget',                 // string or { de: '…', en: '…' } (required)
  category: 'functional',              // 'essential' | 'functional' | 'statistics' | 'marketing' (required)
  description: { de: 'Live-Chat für Support.', en: 'Live chat for support.' },
  provider: 'Chat Corp.',
  privacyPolicyUrl: 'https://chat.example.com/privacy',
  patterns: ['chat.example.com'],      // URL substrings for the auto-blocker
  cookies: [
    { name: 'chat_session', duration: { de: 'Sitzung', en: 'Session' } },
  ],
}
```

Notes:

- Services with `category: 'essential'` are always active and cannot be opted out of.
- `patterns` are plain **substring checks** against the URL (`url.includes(pattern)`).
- Without `patterns` a service is never auto-blocked — control it via `<ConsentGate>`, `<ConsentScript>` or manual markup (`data-cookiesnext="id"`).

## Built-in catalog

`google-maps` · `youtube` · `vimeo` · `google-analytics` · `google-tag-manager` · `meta-pixel` · `recaptcha` · `hotjar` · `matomo` · `linkedin-insight` · `tiktok-pixel` · `calendly` · `openstreetmap` · `spotify` · `soundcloud`

Each entry ships URL patterns, provider, DE/EN descriptions and typical cookies. The catalog is exported as `serviceCatalog`.

## Theming

The default theme is driven entirely by CSS variables — override globally:

```css
:root {
  --cn-primary: #0e7490;      /* buttons, switches */
  --cn-primary-fg: #ffffff;
  --cn-bg: #ffffff;           /* surfaces (banner, modal, widget) */
  --cn-fg: #111827;           /* text */
  --cn-muted: #6b7280;        /* secondary text */
  --cn-muted-bg: #f8fafc;     /* service rows, placeholder background */
  --cn-border: #e5e7eb;
  --cn-radius: 14px;
  --cn-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
  --cn-font: inherit;         /* font (default: system stack) */
  --cn-overlay: rgba(15, 23, 42, 0.45);
  --cn-z: 2147483000;
  --cn-switch-off: #d1d5db;
  --cn-ph-bg: #f8fafc;        /* placeholder background */

  /* Floating widget (defaults: --cn-bg / --cn-fg / --cn-border) */
  --cn-widget-bg: #ffffff;    /* widget background */
  --cn-widget-fg: #111827;    /* icon color */
  --cn-widget-border: #e5e7eb;
  --cn-widget-shadow: 0 4px 16px rgba(15, 23, 42, 0.16);
}
```

All elements carry stable `cn-*` classes (`.cn-banner`, `.cn-modal`, `.cn-widget`, `.cn-placeholder`, `.cn-btn-primary`, …). For a fully custom UI, skip the CSS import and build your own components on top of `useConsent()`.

## Texts & i18n

German (`de`) and English (`en`) are built in. Override any text per language:

```ts
defineConsentConfig({
  texts: {
    en: {
      banner: {
        title: 'Cookies & services',
        description: 'Custom intro text …',
        acceptAll: 'Accept',
        rejectAll: 'Essential only',
        settings: 'Customise',
      },
      modal: {
        title: 'Privacy',
        // description, acceptAll, rejectAll, save, alwaysActive, showDetails,
        // hideDetails, provider, cookies, duration, privacyPolicy, imprint,
        // serviceCount ('{count} services'), close
      },
      placeholder: {
        title: 'External content',
        description: 'This content is provided by {service} …', // {service} token
        load: 'Load content',
        settings: 'Cookie settings',
      },
      widget: { label: 'Open cookie settings' },
      categories: {
        statistics: { name: 'Analytics', description: 'Custom description …' },
        // essential, functional, marketing likewise
      },
    },
    de: { /* same structure */ },
  },
})
```

Custom service names/descriptions accept plain strings or `{ de: '…', en: '…' }` objects.

## Hooks & components

```tsx
'use client'
import { useConsent, ConsentGate } from '@meyerpoczekaj/cookiesnext'

function MyComponent() {
  const {
    ready,          // consent cookie has been read (client-side) — false before
    hasDecided,     // visitor made a (still valid) choice
    consent,        // { version, timestamp, services: { id: boolean } } | null
    services,       // resolved service list
    hasConsent,     // (id) => boolean — essential services are always true
    acceptAll,      // accept everything
    rejectAll,      // essential only
    acceptService,  // (id) => additionally allow one service
    updateServices, // ({ id: boolean }) => save an explicit selection
    resetConsent,   // clears the cookie; reloads the page by default
                    // resetConsent({ reload: false }) to skip the reload
    openSettings, closeSettings, isSettingsOpen,
  } = useConsent()

  return (
    <ConsentGate service="youtube" fallback={<p>YouTube is disabled.</p>}>
      <YouTubePlayer />
    </ConsentGate>
  )
}
```

- **`<ConsentGate service fallback>`** — renders children only after consent; without `fallback` the standard placeholder is shown. Ideal for React components that load SDKs themselves.
- **`<ConsentScript service src>`** / with inline body — loads a script only after consent (zero requests before).
- **Reopen settings from anywhere** — add `data-cookiesnext-open` to any element (e.g. a footer link), call `useConsent().openSettings()`, or dispatch the `cookiesnext:open-settings` event.

## Events

| Event on `window` | Direction | Purpose |
| --- | --- | --- |
| `cookiesnext:consent` | emitted (and listenable) | consent changed — `detail: { version, services }` |
| `cookiesnext:blocked` | emitted | an element was blocked |
| `cookiesnext:unblocked` | emitted | elements were restored after consent |
| `cookiesnext:open-settings` | you dispatch | opens the settings modal |

## Limits & good practice

- **Legal**: cookiesnext provides the technical enforcement (nothing loads before consent, equal-weight accept/decline buttons, revocable any time). The texts, your privacy policy and the completeness of the service list remain your responsibility.
- Blocked SSR embeds cause a **dev-only** React hydration notice — add `suppressHydrationWarning` to embeds you expect to be blocked, or author them with `data-cn-src` (no `src`).
- `resetConsent()` reloads the page by default, because already-executed scripts cannot be "unloaded".
- Consent cookie: `cn-consent`, 180 days, `SameSite=Lax`, JSON — can also be read server-side if needed.

---

## Monorepo / Development

```
packages/cookiesnext   the npm package
apps/demo              Next.js playground (YouTube, Google Maps, tracking-script demo)
```

```bash
npm install
npm run dev      # build package + demo on http://localhost:3000
npm test         # vitest unit tests
npm run build    # build the package only
```

## License

MIT
