import type { Metadata } from 'next'
import { SiteShell, Disclosure } from '@/components/efir-site'
import { TakePageView } from '@/components/take-page-view'

export const metadata: Metadata = {
  title: 'Take on EFIR',
  description: 'A take broadcast on EFIR — watch it right in your browser.',
}

export default async function TakePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <SiteShell>
      <TakePageView slug={slug} />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 32px' }}>
        <Disclosure />
      </div>
    </SiteShell>
  )
}
