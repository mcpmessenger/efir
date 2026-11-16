'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function GoogleSignInButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setBusy(true)
    setError('')

    try {
      const configuredRedirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
      const callback = configuredRedirect
        ? new URL(configuredRedirect)
        : new URL('/auth/callback', window.location.origin)
      callback.searchParams.set('flow', 'web')

      const { error: signInError } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: 'select_account' },
        },
      })

      if (signInError) throw signInError
    } catch {
      setError('Google sign-in could not be started. Please try again.')
      setBusy(false)
    }
  }

  return <span className={compact ? 'google-signin-wrap google-signin-wrap-compact' : 'google-signin-wrap'}>
    <button className={compact ? 'google-signin google-signin-compact' : 'google-signin'} type="button" onClick={signIn} disabled={busy} aria-busy={busy}>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="google-g"><path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.8h5.4a4.62 4.62 0 0 1-2 3.03v2.47h3.24c1.9-1.75 2.96-4.33 2.96-7.3Z"/><path fill="#34A853" d="M10 20c2.7 0 4.97-.9 6.63-2.47l-3.24-2.47c-.9.6-2.04.96-3.4.96-2.62 0-4.84-1.77-5.64-4.15H1v2.54A10 10 0 0 0 10 20Z"/><path fill="#FBBC05" d="M4.35 11.87a6.02 6.02 0 0 1 0-3.74V5.59H1a10 10 0 0 0 0 8.82l3.35-2.54Z"/><path fill="#EA4335" d="M10 3.98c1.47 0 2.78.5 3.82 1.52l2.86-2.86C14.96.97 12.7 0 10 0a10 10 0 0 0-9 5.59l3.35 2.54C5.16 5.75 7.38 3.98 10 3.98Z"/></svg>
      {busy ? 'Connecting…' : 'Sign in with Google'}
    </button>
    {error && <span className="google-signin-error" role="status">{error}</span>}
  </span>
}
