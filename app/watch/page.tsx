import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SiteShell } from '@/components/efir-site'
import { WatchPlayer } from '@/components/watch-player'

export const metadata: Metadata = {
  title: 'Watch the Airwaves | EFIR',
  description: 'Lean-back stream of public commentary takes from the EFIR airwaves.',
}

export default function WatchPage() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <main className="watch-main section-wrap">
            <div className="watch-loading-state">
              <div className="header-loading" />
              <span>Connecting to the stream…</span>
            </div>
          </main>
        }
      >
        <WatchPlayer />
      </Suspense>
    </SiteShell>
  )
}
