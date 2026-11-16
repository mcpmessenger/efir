'use client'

import { useEffect, useState } from 'react'
import { EfIrMark } from '@/components/efir-site'
import { GoogleSignInButton } from '@/components/google-sign-in-button'
import { createClient } from '@/lib/supabase/client'

type CallbackMode = 'checking' | 'mobile' | 'signin' | 'error'

function buildAppLink() {
  const current = new URL(window.location.href)
  const params = new URLSearchParams(current.search)
  const fragment = new URLSearchParams(current.hash.replace(/^#/, ''))
  fragment.forEach((value, key) => params.append(key, value))
  const query = params.toString()
  return `efir://auth/callback${query ? `?${query}` : ''}`
}

export default function AuthCallbackPage() {
  const [mode, setMode] = useState<CallbackMode>('checking')
  const [appLink, setAppLink] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const supabase = createClient()

    if (url.searchParams.get('flow') === 'web') {
      let active = true
      setMode('checking')

      async function finishWebSignIn() {
        // Honor a same-origin `next` path (e.g. /link?code=XXXXXX from the
        // TV-link page); anything else falls back to /studio.
        const nextParam = url.searchParams.get('next')
        const next =
          nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
            ? nextParam
            : '/studio'

        const providerError = url.searchParams.get('error_description') || url.searchParams.get('error')
        if (providerError) {
          if (active) {
            setErrorMessage('Google sign-in could not be completed. Please try again.')
            setMode('error')
          }
          return
        }

        const code = url.searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            if (active) {
              setErrorMessage('Your sign-in link could not be verified. Please try signing in again.')
              setMode('error')
            }
            return
          }
          window.location.replace(next)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          window.location.replace(next)
          return
        }
        if (active) {
          setErrorMessage('No sign-in confirmation was received. Please try again.')
          setMode('error')
        }
      }

      void finishWebSignIn()
      return () => { active = false }
    }

    const hasParams = url.searchParams.size > 0 || new URLSearchParams(url.hash.replace(/^#/, '')).size > 0
    if (hasParams) {
      const nextAppLink = buildAppLink()
      setAppLink(nextAppLink)
      setMode('mobile')
      window.location.replace(nextAppLink)
      const timer = window.setTimeout(() => setShowFallback(true), 1500)
      return () => window.clearTimeout(timer)
    }

    setMode('signin')
  }, [])

  return <main className="bridge-page">
    <div className="bridge-card">
      <EfIrMark className="bridge-mark" />
      {mode === 'mobile' ? <>
        <p className="bridge-eyebrow"><span className="on-air-dot" /> SECURE HANDOFF</p>
        <h1>Returning you<br />to EFIR<span className="red-dot">.</span></h1>
        <p className="bridge-note">Your sign-in is complete. You can close this page if the app has opened.</p>
        {showFallback && <a className="primary-link" href={appLink}>Tap to return to the app <span aria-hidden="true">↗</span></a>}
      </> : mode === 'checking' ? <>
        <p className="bridge-eyebrow">EFIR / SECURE SIGN-IN</p>
        <h1>Connecting<br />your channel.</h1>
        <p className="bridge-note" role="status">Finishing your secure sign-in…</p>
      </> : mode === 'signin' ? <>
        <p className="bridge-eyebrow">EFIR / YOUR CHANNEL</p>
        <h1>Sign in to EFIR<span className="red-dot">.</span></h1>
        <p className="bridge-note">Manage your channel, your takes, and your trails from the web.</p>
        <GoogleSignInButton />
      </> : <>
        <p className="bridge-eyebrow">EFIR / SIGN-IN</p>
        <h1>Let&apos;s try that again.</h1>
        <p className="bridge-note" role="alert">{errorMessage}</p>
        <GoogleSignInButton />
      </>}
      <span className="bridge-foot">HIGHLIGHT IT. BROADCAST IT.</span>
    </div>
  </main>
}
