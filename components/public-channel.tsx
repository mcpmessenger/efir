'use client'

import useSWR from 'swr'
import { LoaderCircle } from 'lucide-react'
import { Disclosure, EfIrMark } from '@/components/efir-site'
import { TakeCard, type TakeRecord } from '@/components/take-card'
import { createClient } from '@/lib/supabase/client'

type PublicProfile = { id: string; display_name: string | null; username: string | null; avatar_url: string | null }
type PublicChannelData = { profile: PublicProfile | null; takes: TakeRecord[] }

const publicTakeColumns = 'id,user_id,comment,media_type,media_url,audio_url,image_url,playable_url,created_at'

async function loadPublicChannel(userId: string): Promise<PublicChannelData> {
  const supabase = createClient()
  const [profileResult, takesResult] = await Promise.all([
    supabase.from('profiles').select('id,display_name,username,avatar_url').eq('id', userId).maybeSingle(),
    supabase.from('takes').select(publicTakeColumns)
      .eq('user_id', userId)
      .eq('visibility', 'public')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false }),
  ])
  if (profileResult.error) throw profileResult.error
  if (takesResult.error) throw takesResult.error
  return { profile: profileResult.data, takes: (takesResult.data ?? []) as TakeRecord[] }
}

export function PublicChannel({ userId }: { userId: string }) {
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
  const { data, error, isLoading } = useSWR<PublicChannelData>(validId ? ['public-channel', userId] : null, () => loadPublicChannel(userId))

  if (!validId) return <main className="channel-main section-wrap"><ChannelUnavailable /></main>
  if (isLoading) return <main className="channel-main section-wrap"><div className="loading-state"><LoaderCircle aria-hidden="true" /><span>Loading channel…</span></div></main>
  if (error || !data?.profile) return <main className="channel-main section-wrap"><ChannelUnavailable /></main>

  const name = data.profile.display_name || data.profile.username || 'EFIR creator'
  const avatar = data.profile.avatar_url

  return <main className="channel-main section-wrap">
    <header className="channel-heading">
      {avatar ? <img className="channel-avatar" src={avatar} alt="" /> : <div className="channel-avatar channel-avatar-fallback" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>}
      <div className="channel-title"><p className="eyebrow"><span className="on-air-dot" /> EFIR CHANNEL</p><h1>{name}<span className="red-dot">.</span></h1>{data.profile.username && <p className="channel-username">@{data.profile.username}</p>}</div>
      <span className="channel-live">PUBLIC CHANNEL</span>
    </header>

    <Disclosure />

    <section className="channel-takes" aria-labelledby="channel-takes-title">
      <div className="studio-section-heading"><div><p className="eyebrow">ON AIR</p><h2 id="channel-takes-title">Public takes <span className="takes-count">{data.takes.length}</span></h2></div></div>
      {data.takes.length ? <div className="takes-grid">{data.takes.map((take) => <TakeCard key={take.id} take={take} ownerName={name} />)}</div> : <div className="empty-takes channel-empty"><EfIrMark className="empty-mark" /><h3>No public takes yet.</h3><p>When this channel shares a take, it will play here.</p></div>}
    </section>
  </main>
}

function ChannelUnavailable() {
  return <section className="data-error" role="status"><EfIrMark className="data-error-mark" /><h1>This channel isn&apos;t available.</h1><p>The link may be incorrect, or this channel is private.</p></section>
}
