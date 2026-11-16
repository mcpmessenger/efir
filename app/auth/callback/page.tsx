'use client'

import { useEffect, useState } from 'react'
import { EfIrMark } from '@/components/efir-site'

function buildAppLink() {
  const current = new URL(window.location.href)
  const params = new URLSearchParams(current.search)
  const fragment = new URLSearchParams(current.hash.replace(/^#/, ''))
  fragment.forEach((value, key) => params.append(key, value))
  const query = params.toString()
  return `efir://auth/callback${query ? `?${query}` : ''}`
}

export default function AuthCallbackPage() {
  const [hasParams, setHasParams] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const hasAuthParams = new URLSearchParams(url.search).size > 0 || new URLSearchParams(url.hash.replace(/^#/, '')).size > 0
    setHasParams(hasAuthParams)
    if (!hasAuthParams) return
    const appLink = buildAppLink()
    window.location.replace(appLink)
    const timer = window.setTimeout(() => setShowFallback(true), 1500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <main className="bridge-page">
      <div className="bridge-card">
        <EfIrMark className="bridge-mark" />
        {hasParams ? <>
          <p className="bridge-eyebrow"><span className="on-air-dot" /> SECURE HANDOFF</p>
          <h1>Returning you<br />to EFIR<span className="red-dot">.</span></h1>
          <p className="bridge-note">Your sign-in is complete. You can close this page if the app has opened.</p>
          {showFallback && <a className="primary-link" href={buildAppLink()}>Tap to return to the app <span aria-hidden="true">↗</span></a>}
        </> : <>
          <p className="bridge-eyebrow">EFIR / APP SIGN-IN</p>
          <h1>Your sign-in<br />starts in the app.</h1>
          <p className="bridge-note">This page is the sign-in bridge for the EFIR app. Open EFIR on your phone and sign in from there.</p>
        </>}
        <span className="bridge-foot">HIGHLIGHT IT. BROADCAST IT.</span>
      </div>
    </main>
  )
}
