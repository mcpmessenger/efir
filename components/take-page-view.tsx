'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAirwavesFeed, type FeedItem } from '@/lib/feed'

const wrap: React.CSSProperties = {
  maxWidth: 640,
  margin: '32px auto',
  padding: '0 16px',
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: 20,
}

const mediaBox: React.CSSProperties = {
  width: '100%',
  background: '#000',
  borderRadius: 14,
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

/**
 * Public take page — where the Roku QR codes land (Will 2026-11-16).
 * The QR on a take must open THAT take, not the app's camera. Looks the
 * slug up in the live Airwaves feed (the TV stream is the same 50).
 */
export function TakePageView({ slug }: { slug: string }) {
  const [state, setState] = useState<'loading' | 'found' | 'missing' | 'error'>('loading')
  const [item, setItem] = useState<FeedItem | null>(null)

  useEffect(() => {
    let alive = true
    fetchAirwavesFeed()
      .then((items) => {
        if (!alive) return
        const found = items.find((i) => i.slug === slug)
        if (found) {
          setItem(found)
          setState('found')
        } else {
          setState('missing')
        }
      })
      .catch(() => {
        if (alive) setState('error')
      })
    return () => {
      alive = false
    }
  }, [slug])

  if (state === 'loading') {
    return (
      <main style={wrap}>
        <div style={card}>
          <p style={{ color: '#94A3B8', margin: 0 }}>Tuning in to this take…</p>
        </div>
      </main>
    )
  }

  if (state === 'missing' || state === 'error' || !item) {
    return (
      <main style={wrap}>
        <div style={card}>
          <h1 style={{ color: '#fff', fontSize: 21, margin: '0 0 8px' }}>
            {state === 'error' ? 'The airwaves glitched' : 'This take has rotated off the airwaves'}
          </h1>
          <p style={{ color: '#94A3B8', lineHeight: 1.5, margin: '0 0 16px' }}>
            {state === 'error'
              ? 'The feed could not be reached. Try again in a moment.'
              : 'EFIR keeps the most recent 50 takes on the stream, and this one has rolled off. The broadcaster still has it on their channel in the app.'}
          </p>
          <Link href="/watch" style={{ color: '#22D3EE', fontWeight: 800 }}>
            Watch the Airwaves →
          </Link>
        </div>
      </main>
    )
  }

  const media = item.media || ({} as FeedItem['media'])
  const videoUrl = media.playable_url || media.raw_url
  const imageUrl = media.image_url || (media.type === 'image' ? media.playable_url || media.raw_url : null)
  const audioUrl = media.audio_url || (media.type === 'audio' ? media.raw_url : null)
  const up = item.reactions?.up || 0
  const down = item.reactions?.down || 0

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {item.author.avatar_url ? (
            <img
              src={item.author.avatar_url}
              alt=""
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : null}
          <div>
            {item.author.id ? (
              <Link
                href={`/c/${item.author.id}`}
                style={{ color: '#22D3EE', fontWeight: 800, textDecoration: 'none' }}
              >
                {item.author.display_name}
              </Link>
            ) : (
              <span style={{ color: '#22D3EE', fontWeight: 800 }}>{item.author.display_name}</span>
            )}
            <div style={{ color: '#64748B', fontSize: 13 }}>@{item.author.username}</div>
          </div>
        </div>

        <div style={mediaBox}>
          {media.type === 'video' && videoUrl ? (
            <video
              src={videoUrl}
              controls
              playsInline
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          ) : media.type === 'audio' && audioUrl ? (
            <div style={{ padding: 24, width: '100%', boxSizing: 'border-box' }}>
              <div style={{ color: '#8B5CF6', fontWeight: 800, letterSpacing: 1, fontSize: 12, marginBottom: 10 }}>
                VOICE TAKE
              </div>
              <audio src={audioUrl} controls style={{ width: '100%' }} />
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={item.comment || 'EFIR take'}
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <p style={{ color: '#fff', padding: 24, lineHeight: 1.5 }}>{item.quote || item.comment || ''}</p>
          )}
        </div>

        {item.comment ? (
          <p style={{ color: '#E2E8F0', lineHeight: 1.55, margin: '14px 0 0' }}>{item.comment}</p>
        ) : null}
        {item.quote && media.type !== 'text' ? (
          <p style={{ color: '#94A3B8', lineHeight: 1.55, margin: '10px 0 0', fontStyle: 'italic' }}>
            “{item.quote}”
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: 14 }}>
            ▲ {up} · ▼ {down} · {up - down > 0 ? `+${up - down}` : `${up - down}`}
          </span>
          {item.source?.url ? (
            <a
              href={item.source.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#64748B', fontSize: 13, textDecoration: 'none' }}
            >
              Source: {item.source.domain} ↗
            </a>
          ) : null}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 18 }}>
        <Link href="/watch" style={{ color: '#22D3EE', fontWeight: 800 }}>
          Watch the Airwaves →
        </Link>
      </p>
    </main>
  )
}
