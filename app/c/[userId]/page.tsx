import type { Metadata } from 'next'
import { SiteShell } from '@/components/efir-site'
import { PublicChannel } from '@/components/public-channel'

export const metadata: Metadata = {
  title: 'Public Channel',
  description: 'Watch public takes from an EFIR channel, right in your browser.',
}

export default async function PublicChannelPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return <SiteShell><PublicChannel userId={userId} /></SiteShell>
}
