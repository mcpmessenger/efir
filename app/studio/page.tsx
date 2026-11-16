import type { Metadata } from 'next'
import { SiteShell } from '@/components/efir-site'
import { StudioDashboard } from '@/components/studio-dashboard'

export const metadata: Metadata = {
  title: 'Your Channel',
  description: 'Manage your EFIR channel, review your takes, and control what is public.',
  robots: { index: false, follow: false },
}

export default function StudioPage() {
  return <SiteShell><StudioDashboard /></SiteShell>
}
