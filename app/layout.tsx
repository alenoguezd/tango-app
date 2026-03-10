import type { Metadata } from 'next'
import { Roboto, Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import '../styles/globals.css'

const roboto = Roboto({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '700', '900'] })
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-japanese', weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'Tango — Japanese-Spanish Flashcards',
  description: 'Study Japanese vocabulary with Spanish translations using interactive flashcards.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tango',
  },
  formatDetection: { telephone: false },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F7F6F3',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${roboto.variable} ${notoSansJP.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(reg => {
                  console.log('Service Worker registered', reg);
                }).catch(err => {
                  console.log('Service Worker registration failed:', err);
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased pwa-root">
        <div className="app-shell">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}
