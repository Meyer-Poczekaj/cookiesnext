import { ConsentStatus } from '@/components/ConsentStatus'

export default function Home() {
  return (
    <>
      <main>
        <h1>cookiesnext Demo</h1>
        <p className="lead">
          Diese Seite bindet YouTube, Google Maps und ein Tracking-Script ganz normal ein —
          ohne Wrapper. Der Auto-Blocker fängt alles ab, bis du einwilligst. Öffne die
          DevTools (Netzwerk-Tab): Vor der Einwilligung geht keine Anfrage an Google &amp; Co.
          raus.
        </p>

        <ConsentStatus />

        <section className="card">
          <h2>YouTube</h2>
          <p>
            Normale <code>&lt;iframe&gt;</code>-Einbettung. Ohne Einwilligung erscheint der
            Platzhalter.
          </p>
          <iframe
            src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"
            title="YouTube Video"
            height={400}
            suppressHydrationWarning
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>

        <section className="card">
          <h2>Google Maps</h2>
          <p>
            Ebenfalls eine normale <code>&lt;iframe&gt;</code>-Einbettung.
          </p>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2662.328!2d13.404954!3d52.520008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDMxJzEyLjAiTiAxM8KwMjQnMTcuOCJF!5e0!3m2!1sde!2sde!4v1600000000000"
            title="Google Maps"
            height={360}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            suppressHydrationWarning
          />
        </section>

        <section className="card">
          <h2>Tracking-Script</h2>
          <p>
            Unten im HTML steckt <code>&lt;script src=&quot;/demo-analytics.js&quot;&gt;</code>.
            Es wird erst ausgeführt, wenn du „Demo Analytics" (Kategorie Statistik)
            zustimmst — der Status oben zeigt es live an.
          </p>
        </section>
      </main>

      <footer>
        <a href="#" data-cookiesnext-open>
          Cookie-Einstellungen
        </a>{' '}
        · Link mit <code>data-cookiesnext-open</code> — öffnet das Modal von überall.
      </footer>

      {/* Ganz normale Einbindung — der Auto-Blocker neutralisiert das Script,
          bis der Dienst "demo-analytics" akzeptiert wurde. */}
      <script src="/demo-analytics.js" suppressHydrationWarning />
    </>
  )
}
