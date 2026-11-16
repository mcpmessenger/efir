'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GoogleSignInButton } from '@/components/google-sign-in-button'

type TvRow = {
  id: string
  device_hash: string
  display_name: string | null
  claimed_at: string | null
  created_at: string
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: 24,
  maxWidth: 520,
  margin: '32px auto',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: 6,
  textAlign: 'center',
  textTransform: 'uppercase',
  padding: '12px 8px',
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 14,
  background: '#22D3EE',
  color: '#08080C',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: 0.5,
  padding: '12px 8px',
  cursor: 'pointer',
}

export function TvLinkManager() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [tvs, setTvs] = useState<TvRow[]>([])

  const loadTvs = useCallback(async () => {
    const supabase = createClient() as any
    const { data } = await supabase
      .from('tv_links')
      .select('id, device_hash, display_name, claimed_at, created_at')
      .not('user_id', 'is', null)
      .order('claimed_at', { ascending: false })
    if (data) setTvs(data as TvRow[])
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('code')
    if (c) setCode(c.toUpperCase())
    ;(async () => {
      const { data } = await createClient().auth.getUser()
      setUser(data.user)
      setLoading(false)
      if (data.user) void loadTvs()
    })()
  }, [loadTvs])

  async function claim() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const supabase = createClient() as any
      const { data, error: rpcError } = await supabase.rpc('claim_tv_link', {
        p_code: code.trim(),
      })
      if (rpcError) throw rpcError
      if (data === true) {
        setMessage(
          'TV linked. Look at your TV — Your Channel and Private Shelf are now in the shelf rotation (REV / FWD on the remote).'
        )
        void loadTvs()
      } else {
        setError(
          'That code did not work. Codes expire after 10 minutes — leave the TV on the Link screen for a fresh code and try again.'
        )
      }
    } catch {
      setError('Something went wrong talking to EFIR. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function unlink(id: string) {
    const supabase = createClient() as any
    await supabase.from('tv_links').delete().eq('id', id)
    void loadTvs()
  }

  if (loading) {
    return (
      <main style={{ padding: '24px 16px' }}>
        <div style={card}>
          <p style={{ color: '#94A3B8', margin: 0 }}>Checking your sign-in…</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main style={{ padding: '24px 16px' }}>
        <div style={card}>
          <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>Link your TV</h1>
          <p style={{ color: '#94A3B8', margin: '0 0 18px', lineHeight: 1.5 }}>
            Sign in with the same account you use in the EFIR app, then enter the
            code shown on your TV. Your TV gets your channel and your private
            shelf — no password is ever typed on the TV.
          </p>
          <GoogleSignInButton nextPath={`/link${code ? `?code=${encodeURIComponent(code)}` : ''}`} />
        </div>
      </main>
    )
  }

  return (
    <main style={{ padding: '24px 16px' }}>
      <div style={card}>
        <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>Link your TV</h1>
        <p style={{ color: '#94A3B8', margin: '0 0 18px', lineHeight: 1.5 }}>
          Enter the 6-character code from the Link screen on your TV
          (REV / FWD on the remote cycles shelves to find it).
        </p>
        <input
          style={inputStyle}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="------"
          autoComplete="off"
          autoCapitalize="characters"
          aria-label="TV link code"
        />
        <button style={primaryBtn} onClick={claim} disabled={busy || code.length !== 6} type="button">
          {busy ? 'Linking…' : 'LINK THIS TV'}
        </button>
        {message && (
          <p role="status" style={{ color: '#22D3EE', lineHeight: 1.5, marginBottom: 0 }}>
            {message}
          </p>
        )}
        {error && (
          <p role="alert" style={{ color: '#FF3B30', lineHeight: 1.5, marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>

      {tvs.length > 0 && (
        <div style={card}>
          <h2 style={{ color: '#fff', fontSize: 17, margin: '0 0 12px' }}>Your linked TVs</h2>
          {tvs.map((tv) => (
            <div
              key={tv.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div>
                <div style={{ color: '#fff', fontWeight: 700 }}>
                  Roku TV · {tv.device_hash.replace(/^roku_/, '').slice(0, 8)}…
                </div>
                <div style={{ color: '#64748B', fontSize: 13 }}>
                  Linked{' '}
                  {tv.claimed_at
                    ? new Date(tv.claimed_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => unlink(tv.id)}
                style={{
                  background: 'rgba(255,59,48,0.12)',
                  color: '#FF3B30',
                  border: '1px solid rgba(255,59,48,0.4)',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  padding: '7px 12px',
                  cursor: 'pointer',
                }}
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
