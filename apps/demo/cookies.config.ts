import { defineConsentConfig } from '@meyerpoczekaj/cookiesnext'

export default defineConsentConfig({
  // Bei Änderungen an den Diensten hochzählen -> Besucher werden erneut gefragt.
  version: 1,
  defaultLanguage: 'de',
  privacyPolicyUrl: '/datenschutz',
  imprintUrl: '/impressum',
  services: [
    // Aus dem eingebauten Katalog:
    { service: 'youtube' },
    { service: 'google-maps' },

    // Eigener Dienst mit eigenen URL-Mustern:
    {
      id: 'demo-analytics',
      name: 'Demo Analytics',
      category: 'statistics',
      provider: 'Beispiel GmbH',
      description: {
        de: 'Beispiel-Tracking-Script, das erst nach Einwilligung ausgeführt wird.',
        en: 'Example tracking script that only runs after consent.',
      },
      patterns: ['demo-analytics.js'],
      cookies: [{ name: '_demo', duration: { de: '1 Jahr', en: '1 year' } }],
    },
  ],
})
