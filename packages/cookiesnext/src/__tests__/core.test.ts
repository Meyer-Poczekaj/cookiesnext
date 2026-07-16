import { describe, expect, it } from 'vitest'
import { buildBlockerScript } from '../blocker.js'
import {
  buildConsentMap,
  isConsentValid,
  matchServiceByUrl,
  resolveConfig,
} from '../config.js'
import { parseConsentValue, serializeConsentValue } from '../consent-cookie.js'
import { formatText, resolveText, resolveTexts } from '../i18n.js'

const config = resolveConfig({
  services: [
    { service: 'google-maps' },
    { service: 'youtube', category: 'functional' },
    {
      id: 'my-chat',
      name: { de: 'Chat', en: 'Chat' },
      category: 'functional',
      patterns: ['chat.example.com'],
    },
  ],
})

describe('resolveConfig', () => {
  it('applies defaults', () => {
    expect(config.version).toBe(1)
    expect(config.cookieName).toBe('cn-consent')
    expect(config.autoBlock).toBe(true)
    expect(config.banner.position).toBe('bottom')
  })

  it('resolves catalog services with overrides', () => {
    const youtube = config.services.find((s) => s.id === 'youtube')
    expect(youtube?.category).toBe('functional')
    expect(youtube?.patterns).toContain('youtube.com/embed')
    expect(youtube?.provider).toBeTruthy()
  })

  it('keeps custom services as-is', () => {
    const chat = config.services.find((s) => s.id === 'my-chat')
    expect(chat?.patterns).toEqual(['chat.example.com'])
  })

  it('throws on unknown catalog ids', () => {
    expect(() => resolveConfig({ services: [{ service: 'nope' }] })).toThrow(/Unknown catalog/)
  })

  it('throws on duplicate service ids', () => {
    expect(() =>
      resolveConfig({ services: [{ service: 'youtube' }, { service: 'youtube' }] }),
    ).toThrow(/Duplicate/)
  })
})

describe('matchServiceByUrl', () => {
  it('attributes urls to services', () => {
    expect(
      matchServiceByUrl('https://www.youtube.com/embed/abc123', config.services),
    ).toBe('youtube')
    expect(
      matchServiceByUrl('https://www.google.com/maps/embed?pb=xyz', config.services),
    ).toBe('google-maps')
    expect(matchServiceByUrl('https://chat.example.com/widget.js', config.services)).toBe(
      'my-chat',
    )
    expect(matchServiceByUrl('https://example.com/self-hosted.js', config.services)).toBeNull()
  })
})

describe('consent state', () => {
  it('builds a consent map with essentials always on', () => {
    const withEssential = resolveConfig({
      services: [
        { id: 'session', name: 'Session', category: 'essential' },
        { service: 'youtube' },
      ],
    })
    const map = buildConsentMap(withEssential.services, () => false)
    expect(map).toEqual({ session: true, youtube: false })
  })

  it('round-trips through the cookie value', () => {
    const state = {
      version: 2,
      timestamp: '2026-01-01T00:00:00.000Z',
      services: { youtube: true, 'google-maps': false },
    }
    expect(parseConsentValue(serializeConsentValue(state))).toEqual(state)
  })

  it('rejects malformed cookie values', () => {
    expect(parseConsentValue('not-json')).toBeNull()
    expect(parseConsentValue(encodeURIComponent('{"foo":1}'))).toBeNull()
    expect(parseConsentValue(null)).toBeNull()
  })

  it('invalidates consent from older config versions', () => {
    const state = { version: 1, timestamp: '', services: {} }
    expect(isConsentValid(state, 1)).toBe(true)
    expect(isConsentValid(state, 2)).toBe(false)
    expect(isConsentValid(null, 1)).toBe(false)
  })
})

describe('i18n', () => {
  it('resolves localized strings with fallbacks', () => {
    expect(resolveText('Karte', 'en', 'de')).toBe('Karte')
    expect(resolveText({ de: 'Karte', en: 'Map' }, 'en', 'de')).toBe('Map')
    expect(resolveText({ de: 'Karte' }, 'en', 'de')).toBe('Karte')
    expect(resolveText(undefined, 'en', 'de')).toBe('')
  })

  it('merges overrides over builtin texts', () => {
    const texts = resolveTexts('de', 'de', {
      de: { banner: { title: 'Hallo!' } },
    })
    expect(texts.banner.title).toBe('Hallo!')
    expect(texts.banner.acceptAll).toBe('Alle akzeptieren')
  })

  it('falls back to the default language for unknown locales', () => {
    const texts = resolveTexts('fr', 'en', undefined)
    expect(texts.banner.acceptAll).toBe('Accept all')
  })

  it('formats tokens', () => {
    expect(formatText('{count} Dienste', { count: 3 })).toBe('3 Dienste')
    expect(formatText('von {service}', { service: 'YouTube' })).toBe('von YouTube')
  })
})

describe('blocker script', () => {
  it('produces syntactically valid javascript', () => {
    const source = buildBlockerScript(config)
    expect(() => new Function(source)).not.toThrow()
  })

  it('embeds the service patterns and cookie name', () => {
    const source = buildBlockerScript(config)
    expect(source).toContain('youtube.com/embed')
    expect(source).toContain('cn-consent')
  })

  it('escapes closing script tags in the payload', () => {
    const evil = resolveConfig({
      services: [
        { id: 'x', name: 'X', category: 'functional', patterns: ['</script><script>'] },
      ],
    })
    expect(buildBlockerScript(evil)).not.toContain('</script>')
  })
})
