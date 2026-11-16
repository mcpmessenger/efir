'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { GoogleSignInButton } from '@/components/google-sign-in-button'
import { Wordmark } from '@/components/efir-site'
import { createClient } from '@/lib/supabase/client'

type HeaderProfile = { display_name: string | null; username: string | null; avatar_url: string | null }

export function SiteHeaderClient() {
  const { user, loading } = useAuth()
  const [signOutError, setSignOutError] = useState('')
  const { data: profile } = useSWR<HeaderProfile>(user ? ['header-profile', user.id] : null, async (): Promise<HeaderProfile> => {
    const { data, error } = await createClient().from('profiles')
      .select('display_name,username,avatar_url')
      .eq('id', user!.id)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Profile not found.')
    return data
  })

  const name = profile?.display_name || profile?.username || String(user?.user_metadata?.full_name || 'Your channel')
  const avatar = profile?.avatar_url || String(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '')

  async function signOut() {
    setSignOutError('')
    const { error } = await createClient().auth.signOut()
    if (error) setSignOutError('Sign out failed. Please try again.')
  }

  return <header className="site-header">
    <Link href="/" className="brand-link" aria-label="EFIR home"><Wordmark /></Link>
    {loading ? <span className="header-loading" aria-label="Checking sign-in status" /> : user ? <div className="header-account">
      <Link href="/studio" className="header-channel-link">
        {avatar ? <img className="header-avatar" src={avatar} alt="" /> : <span className="header-avatar header-avatar-fallback" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
        <span className="header-account-name">{name}</span>
      </Link>
      <Link href="/studio" className="header-studio-link">Your Channel</Link>
      <button className="header-signout" type="button" onClick={() => void signOut()}><LogOut aria-hidden="true" /><span>Sign out</span></button>
      {signOutError && <span className="header-auth-error" role="status">{signOutError}</span>}
    </div> : <GoogleSignInButton compact />}
  </header>
}
