import type { Metadata } from 'next'
import { SiteShell, Disclosure } from '@/components/efir-site'
import { TvLinkManager } from '@/components/tv-link-manager'

export const metadata: Metadata = {
  title: 'Link your TV',
  description: 'Link your Roku TV to your EFIR account to watch your channel and private shelf on the big screen.',
  robots: { index: false, follow: false },
}

export default function LinkPage() {
  return (
    <SiteShell>
      <TvLinkManager />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 32px' }}>
        <Disclosure />
      </div>
    </SiteShell>
  )
}
