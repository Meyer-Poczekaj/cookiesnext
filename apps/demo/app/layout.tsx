import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CookiesNext } from 'cookiesnext'
import 'cookiesnext/styles.css'
import './globals.css'
import consentConfig from '@/cookies.config'

export const metadata: Metadata = {
  title: 'cookiesnext Demo',
  description: 'Playground für das cookiesnext Consent-Package',
}

export default function RootLayout({ children }: { children: ReactNode }) {
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
