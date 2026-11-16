import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'EFIR — Highlight it. Broadcast it.', template: '%s | EFIR' },
  description: 'EFIR is you, on the topic, on everyone’s TV. Record a take on your phone and broadcast it as your channel.',
  applicationName: 'EFIR',
  metadataBase: new URL('https://efir.fm'),
  openGraph: {
    title: 'EFIR — Highlight it. Broadcast it.',
    description: 'Highlight it. Broadcast it. EFIR is you, on the topic, on everyone’s TV.',
    siteName: 'EFIR',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'EFIR — Highlight it. Broadcast it.' }],
  },
  twitter: { card: 'summary_large_image', title: 'EFIR — Highlight it. Broadcast it.', description: 'Highlight it. Broadcast it.', images: ['/opengraph-image'] },
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#08080C' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" /></head><body>{children}</body></html>
}
