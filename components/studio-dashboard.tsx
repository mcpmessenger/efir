'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import type { User } from '@supabase/supabase-js'
import { ArrowUpRight, ExternalLink, LoaderCircle, X } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { EfIrMark } from '@/components/efir-site'
import { TakeCard, type TakeRecord } from '@/components/take-card'
import { createClient } from '@/lib/supabase/client'

type Profile = { id: string; display_name: string | null; username: string | null; avatar_url: string | null }
type StudioData = { profile: Profile | null; takes: TakeRecord[] }

const takeColumns = 'id,user_id,comment,media_type,media_url,audio_url,image_url,playable_url,visibility,moderation_status,created_at,reactions'

async function loadStudio(user: User): Promise<StudioData> {
  const supabase = createClient()
  const [profileResult, takesResult] = await Promise.all([
    supabase.from('profiles').select('id,display_name,username,avatar_url').eq('id', user.id).maybeSingle(),
    supabase.from('takes').select(takeColumns).order('created_at', { ascending: false }),
  ])
  if (profileResult.error) throw profileResult.error
  if (takesResult.error) throw takesResult.error
  return { profile: profileResult.data, takes: (takesResult.data ?? []) as TakeRecord[] }
}

function storageObjects(take: TakeRecord) {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!configuredUrl) return new Map<string, string[]>()
  const expectedOrigin = new URL(configuredUrl).origin
  const objects = new Map<string, Set<string>>()

  for (const source of [take.media_url, take.audio_url, take.image_url, take.playable_url]) {
    if (!source) continue
    try {
      const url = new URL(source)
      if (url.origin !== expectedOrigin) continue
      const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/)
      if (!match) continue
      const bucket = decodeURIComponent(match[1])
      const path = match[2].split('/').map((part) => decodeURIComponent(part)).join('/')
      if (!objects.has(bucket)) objects.set(bucket, new Set())
      objects.get(bucket)?.add(path)
    } catch {
      continue
    }
  }

  return new Map([...objects].map(([bucket, paths]) => [bucket, [...paths]]))
}

export function StudioDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [busyTakeId, setBusyTakeId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TakeRecord | null>(null)
  const [actionError, setActionError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const { data, error, isLoading, mutate } = useSWR<StudioData>(user ? ['studio', user.id] : null, () => loadStudio(user!))

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/callback')
  }, [authLoading, router, user])

  useEffect(() => {
    if (!pendingDelete) return
    const dialog = dialogRef.current
    if (!dialog) return
    const activeDialog: HTMLElement = dialog
    const deleteButton = activeDialog.querySelector<HTMLButtonElement>('.danger-button')
    deleteButton?.focus()

    function trapFocus(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyTakeId) {
        event.preventDefault()
        setPendingDelete(null)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(activeDialog.querySelectorAll<HTMLElement>('button:not([disabled])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    activeDialog.addEventListener('keydown', trapFocus)
    return () => activeDialog.removeEventListener('keydown', trapFocus)
  }, [busyTakeId, pendingDelete])

  if (authLoading || (!user && !authLoading) || (user && isLoading)) {
    return <main className="studio-main section-wrap"><div className="loading-state"><LoaderCircle aria-hidden="true" /><span>Loading your channel…</span></div></main>
  }

  if (error || !data || !user) {
    return <main className="studio-main section-wrap"><section className="data-error" role="alert"><EfIrMark className="data-error-mark" /><h1>Your channel is unavailable</h1><p>We couldn&apos;t load your takes right now. Please refresh and try again.</p><button className="outline-button" type="button" onClick={() => void mutate()}>Try again</button></section></main>
  }

  const channelName = data.profile?.display_name || data.profile?.username || String(user.user_metadata?.full_name || 'Your channel')
  const avatar = data.profile?.avatar_url || String(user.user_metadata?.avatar_url || user.user_metadata?.picture || '')

  async function toggleVisibility(take: TakeRecord) {
    if (!user) return
    setActionError('')
    setBusyTakeId(take.id)
    const visibility = take.visibility === 'public' ? 'private' : 'public'

    try {
      const { data: updated, error: updateError } = await createClient().from('takes')
        .update({ visibility })
        .eq('id', take.id)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle()
      if (updateError) throw updateError
      if (!updated) throw new Error('This take could not be updated.')
      await mutate()
    } catch {
      setActionError('That visibility change could not be saved. Check your connection and try again.')
    } finally {
      setBusyTakeId(null)
    }
  }

  async function deleteTake() {
    if (!user || !pendingDelete) return
    const take = pendingDelete
    setActionError('')
    setBusyTakeId(take.id)

    try {
      const supabase = createClient()
      for (const [bucket, paths] of storageObjects(take)) {
        const { error: storageError } = await supabase.storage.from(bucket).remove(paths)
        if (storageError) throw storageError
      }

      const { error: deleteError } = await supabase.from('takes').delete().eq('id', take.id).eq('user_id', user.id)
      if (deleteError) throw deleteError
      setPendingDelete(null)
      await mutate()
    } catch {
      setActionError('The take could not be deleted. Its media may be restricted by storage permissions.')
    } finally {
      setBusyTakeId(null)
    }
  }

  return <main className="studio-main section-wrap">
    <section className="studio-heading" aria-labelledby="studio-title">
      <div className="studio-identity">
        {avatar ? <img className="studio-avatar" src={avatar} alt="" /> : <div className="studio-avatar studio-avatar-fallback" aria-hidden="true">{channelName.slice(0, 1).toUpperCase()}</div>}
        <div><p className="eyebrow"><span className="on-air-dot" /> YOUR CHANNEL</p><h1 id="studio-title">{channelName}<span className="red-dot">.</span></h1><p className="studio-subtitle">Your channel is what plays on TVs.</p></div>
      </div>
      <Link className="outline-button" href={`/c/${user.id}`}>View public channel <ExternalLink aria-hidden="true" /></Link>
    </section>

    {actionError && <p className="action-error" role="alert">{actionError}</p>}
    <section className="studio-section" aria-labelledby="takes-title">
      <div className="studio-section-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h2 id="takes-title">Your takes <span className="takes-count">{data.takes.length}</span></h2></div><span className="studio-section-note">Newest first</span></div>
      {data.takes.length ? <div className="takes-grid">{data.takes.map((take) => <TakeCard key={take.id} take={take} ownerName={channelName} owner busy={busyTakeId === take.id} onToggle={() => void toggleVisibility(take)} onDelete={() => setPendingDelete(take)} />)}</div> : <div className="empty-takes"><EfIrMark className="empty-mark" /><h3>No takes yet.</h3><p>Record your first one in the EFIR app — the phone is the studio.</p></div>}
    </section>

    <section className="studio-section trails-placeholder" aria-labelledby="trails-title"><div><p className="eyebrow">IN PROGRESS</p><h2 id="trails-title">Trails</h2></div><p>Trails you build in the app will appear here.</p><ArrowUpRight aria-hidden="true" /></section>

    {pendingDelete && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyTakeId) setPendingDelete(null) }}>
      <section ref={dialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" tabIndex={-1}>
        <button className="dialog-close" type="button" onClick={() => setPendingDelete(null)} disabled={Boolean(busyTakeId)} aria-label="Close confirmation"><X aria-hidden="true" /></button>
        <p className="eyebrow">REMOVE FROM YOUR CHANNEL</p><h2 id="delete-title">Delete this take?</h2><p id="delete-description">Delete this take and its media files? This can&apos;t be undone.</p>
        <div className="dialog-actions"><button className="outline-button" type="button" onClick={() => setPendingDelete(null)} disabled={Boolean(busyTakeId)}>Cancel</button><button className="danger-button" type="button" onClick={() => void deleteTake()} disabled={Boolean(busyTakeId)}>{busyTakeId === pendingDelete.id ? 'Deleting…' : 'Delete take'}</button></div>
      </section>
    </div>}
  </main>
}
