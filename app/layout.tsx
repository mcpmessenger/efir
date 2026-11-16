import type { Metadata, Viewport } from 'next'
import './globals.css'
import './manage.css'
import { AuthProvider } from '@/components/auth-provider'

export const metadata: Metadata = {
  title: { default: 'EFIR — Highlight it. Broadcast it.', template: '%s | EFIR' },
  description: 'Manage your EFIR channel, share public takes, and watch creator channels from any browser.',
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
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#08080C' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" /></head><body><AuthProvider>{children}</AuthProvider></body></html>
}
