import type { ServiceDefinition } from './types.js'

/**
 * Built-in service catalog. Reference entries from your config via
 * `{ service: '<id>' }` — patterns, descriptions and cookie lists come
 * for free and can be overridden per project.
 */
export const serviceCatalog: Record<string, ServiceDefinition> = {
  'google-maps': {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'functional',
    provider: 'Google Ireland Limited',
    privacyPolicyUrl: 'https://policies.google.com/privacy',
    patterns: ['google.com/maps', 'maps.googleapis.com', 'maps.gstatic.com'],
    description: {
      de: 'Interaktiver Kartendienst zur Darstellung von Standorten und Routen.',
      en: 'Interactive map service for displaying locations and directions.',
    },
    cookies: [
      { name: 'NID', duration: { de: '6 Monate', en: '6 months' } },
      { name: 'CONSENT', duration: { de: '2 Jahre', en: '2 years' } },
    ],
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    category: 'marketing',
    provider: 'Google Ireland Limited',
    privacyPolicyUrl: 'https://policies.google.com/privacy',
    patterns: ['youtube.com/embed', 'youtube-nocookie.com', 'youtu.be'],
    description: {
      de: 'Einbettung von YouTube-Videos. Beim Abspielen können Cookies gesetzt und Nutzungsdaten übertragen werden.',
      en: 'Embedded YouTube videos. Playing a video may set cookies and transfer usage data.',
    },
    cookies: [
      { name: 'VISITOR_INFO1_LIVE', duration: { de: '6 Monate', en: '6 months' } },
      { name: 'YSC', duration: { de: 'Sitzung', en: 'Session' } },
    ],
  },
  vimeo: {
    id: 'vimeo',
    name: 'Vimeo',
    category: 'functional',
    provider: 'Vimeo Inc.',
    privacyPolicyUrl: 'https://vimeo.com/privacy',
    patterns: ['player.vimeo.com'],
    description: {
      de: 'Einbettung von Vimeo-Videos.',
      en: 'Embedded Vimeo videos.',
    },
    cookies: [{ name: 'vuid', duration: { de: '2 Jahre', en: '2 years' } }],
  },
  'google-analytics': {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'statistics',
    provider: 'Google Ireland Limited',
    privacyPolicyUrl: 'https://policies.google.com/privacy',
    patterns: ['google-analytics.com', 'googletagmanager.com/gtag/js'],
    description: {
      de: 'Webanalyse-Dienst zur Messung und Auswertung der Website-Nutzung.',
      en: 'Web analytics service measuring how visitors use the website.',
    },
    cookies: [
      { name: '_ga', duration: { de: '2 Jahre', en: '2 years' } },
      { name: '_ga_*', duration: { de: '2 Jahre', en: '2 years' } },
    ],
  },
  'google-tag-manager': {
    id: 'google-tag-manager',
    name: 'Google Tag Manager',
    category: 'statistics',
    provider: 'Google Ireland Limited',
    privacyPolicyUrl: 'https://policies.google.com/privacy',
    patterns: ['googletagmanager.com/gtm.js'],
    description: {
      de: 'Tag-Verwaltung, über die weitere Dienste auf der Website eingebunden werden.',
      en: 'Tag management system used to load further services on the website.',
    },
    cookies: [],
  },
  'meta-pixel': {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    category: 'marketing',
    provider: 'Meta Platforms Ireland Limited',
    privacyPolicyUrl: 'https://www.facebook.com/privacy/policy',
    patterns: ['connect.facebook.net'],
    description: {
      de: 'Mess- und Werbedienst von Meta (Facebook/Instagram) zur Erfolgsmessung von Kampagnen.',
      en: 'Measurement and advertising service by Meta (Facebook/Instagram) for campaign tracking.',
    },
    cookies: [{ name: '_fbp', duration: { de: '3 Monate', en: '3 months' } }],
  },
  recaptcha: {
    id: 'recaptcha',
    name: 'Google reCAPTCHA',
    category: 'functional',
    provider: 'Google Ireland Limited',
    privacyPolicyUrl: 'https://policies.google.com/privacy',
    patterns: ['google.com/recaptcha', 'gstatic.com/recaptcha'],
    description: {
      de: 'Spam-Schutz für Formulare.',
      en: 'Spam protection for forms.',
    },
    cookies: [{ name: '_GRECAPTCHA', duration: { de: '6 Monate', en: '6 months' } }],
  },
  hotjar: {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'statistics',
    provider: 'Hotjar Ltd.',
    privacyPolicyUrl: 'https://www.hotjar.com/legal/policies/privacy/',
    patterns: ['hotjar.com'],
    description: {
      de: 'Analyse des Nutzerverhaltens über Heatmaps und Aufzeichnungen.',
      en: 'Behaviour analytics via heatmaps and recordings.',
    },
    cookies: [{ name: '_hj*', duration: { de: 'bis 1 Jahr', en: 'up to 1 year' } }],
  },
  matomo: {
    id: 'matomo',
    name: 'Matomo',
    category: 'statistics',
    provider: 'Matomo (selbst gehostet oder Cloud)',
    privacyPolicyUrl: 'https://matomo.org/privacy-policy/',
    patterns: ['matomo.js', 'matomo.php', 'matomo.cloud'],
    description: {
      de: 'Datenschutzfreundliche Webanalyse.',
      en: 'Privacy-friendly web analytics.',
    },
    cookies: [{ name: '_pk_id*', duration: { de: '13 Monate', en: '13 months' } }],
  },
  'linkedin-insight': {
    id: 'linkedin-insight',
    name: 'LinkedIn Insight Tag',
    category: 'marketing',
    provider: 'LinkedIn Ireland Unlimited Company',
    privacyPolicyUrl: 'https://www.linkedin.com/legal/privacy-policy',
    patterns: ['snap.licdn.com', 'px.ads.linkedin.com'],
    description: {
      de: 'Conversion-Messung und Retargeting für LinkedIn-Kampagnen.',
      en: 'Conversion tracking and retargeting for LinkedIn campaigns.',
    },
    cookies: [{ name: 'li_*', duration: { de: 'bis 2 Jahre', en: 'up to 2 years' } }],
  },
  'tiktok-pixel': {
    id: 'tiktok-pixel',
    name: 'TikTok Pixel',
    category: 'marketing',
    provider: 'TikTok Technology Limited',
    privacyPolicyUrl: 'https://www.tiktok.com/legal/privacy-policy',
    patterns: ['analytics.tiktok.com'],
    description: {
      de: 'Mess- und Werbedienst von TikTok.',
      en: 'Measurement and advertising service by TikTok.',
    },
    cookies: [{ name: '_ttp', duration: { de: '13 Monate', en: '13 months' } }],
  },
  calendly: {
    id: 'calendly',
    name: 'Calendly',
    category: 'functional',
    provider: 'Calendly LLC',
    privacyPolicyUrl: 'https://calendly.com/privacy',
    patterns: ['calendly.com'],
    description: {
      de: 'Online-Terminbuchung.',
      en: 'Online appointment scheduling.',
    },
    cookies: [],
  },
  openstreetmap: {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    category: 'functional',
    provider: 'OpenStreetMap Foundation',
    privacyPolicyUrl: 'https://wiki.osmfoundation.org/wiki/Privacy_Policy',
    patterns: ['openstreetmap.org'],
    description: {
      de: 'Einbettung von OpenStreetMap-Karten.',
      en: 'Embedded OpenStreetMap maps.',
    },
    cookies: [],
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    category: 'functional',
    provider: 'Spotify AB',
    privacyPolicyUrl: 'https://www.spotify.com/legal/privacy-policy/',
    patterns: ['open.spotify.com/embed'],
    description: {
      de: 'Einbettung von Spotify-Playern.',
      en: 'Embedded Spotify players.',
    },
    cookies: [],
  },
  soundcloud: {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'functional',
    provider: 'SoundCloud Global Limited & Co. KG',
    privacyPolicyUrl: 'https://soundcloud.com/pages/privacy',
    patterns: ['w.soundcloud.com'],
    description: {
      de: 'Einbettung von SoundCloud-Playern.',
      en: 'Embedded SoundCloud players.',
    },
    cookies: [],
  },
}
