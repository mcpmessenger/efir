'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { FeedItem, fetchAirwavesFeed } from '@/lib/feed'
import { Disclosure, EfIrMark } from '@/components/efir-site'
import { createClient } from '@/lib/supabase/client'

interface WatchPlayerProps {
  initialTakes?: FeedItem[]
}

export function WatchPlayer({ initialTakes = [] }: WatchPlayerProps) {
  const searchParams = useSearchParams()
  const takeParam = searchParams.get('take')

  const [rawTakes, setRawTakes] = useState<FeedItem[]>(initialTakes)
  const [streamMode, setStreamMode] = useState<'airwaves' | 'top'>('airwaves')
  const [loading, setLoading] = useState(initialTakes.length === 0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [imageProgress, setImageProgress] = useState(0)
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null)
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch feed on mount
  useEffect(() => {
    fetchAirwavesFeed()
      .then((data) => {
        setRawTakes(data)
        if (takeParam) {
          const idx = data.findIndex((t) => t.id === takeParam || t.slug === takeParam)
          if (idx !== -1) setCurrentIndex(idx)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.warn('Failed to load feed for watch player:', err)
        setLoading(false)
      })
  }, [takeParam])

  // Active takes list based on stream mode (Airwaves vs Top Takes)
  const takes = useMemo(() => {
    if (streamMode === 'top') {
      return [...rawTakes].sort((a, b) => {
        const scoreA = (a.reactions?.up || 0) - (a.reactions?.down || 0)
        const scoreB = (b.reactions?.up || 0) - (b.reactions?.down || 0)
        return scoreB - scoreA
      })
    }
    return rawTakes
  }, [rawTakes, streamMode])

  const currentTake = takes[currentIndex] || null

  const handleNext = useCallback(() => {
    if (takes.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % takes.length)
    setImageProgress(0)
  }, [takes.length])

  const handlePrev = useCallback(() => {
    if (takes.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + takes.length) % takes.length)
    setImageProgress(0)
  }, [takes.length])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
    if (videoRef.current) videoRef.current.muted = !isMuted
    if (audioRef.current) audioRef.current.muted = !isMuted
  }, [isMuted])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev
      if (videoRef.current) {
        if (next) videoRef.current.play().catch(() => {})
        else videoRef.current.pause()
      }
      if (audioRef.current) {
        if (next) audioRef.current.play().catch(() => {})
        else audioRef.current.pause()
      }
      return next
    })
  }, [])

  const castVote = useCallback(async (direction: 'up' | 'down') => {
    if (!currentTake) return
    const cur = userVotes[currentTake.id] || 0
    let next = 0
    let target: 'up' | 'down' | 'clear' = direction
    if (direction === 'up') {
      if (cur === 1) {
        target = 'clear'
        next = 0
      } else {
        target = 'up'
        next = 1
      }
    } else {
      if (cur === -1) {
        target = 'clear'
        next = 0
      } else {
        target = 'down'
        next = -1
      }
    }

    setUserVotes((prev) => ({ ...prev, [currentTake.id]: next }))

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let voterKey = user?.id
      if (!voterKey && typeof window !== 'undefined') {
        voterKey = localStorage.getItem('efir_web_voter') || ''
        if (!voterKey) {
          voterKey = 'web_' + Math.random().toString(36).slice(2, 12)
          localStorage.setItem('efir_web_voter', voterKey)
        }
      }
      await supabase.rpc('vote_take', {
        p_take_id: currentTake.id,
        p_voter_key: voterKey || 'web_anonymous',
        p_direction: target,
      })
    } catch (err) {
      console.warn('Vote RPC error:', err)
    }
  }, [currentTake, userVotes])

  // Handle media switching
  useEffect(() => {
    if (!currentTake) return

    // Clear timers
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current)
    if (imageIntervalRef.current) clearInterval(imageIntervalRef.current)
    setImageProgress(0)

    const media = currentTake.media

    if (media.type === 'video' && videoRef.current) {
      videoRef.current.muted = isMuted
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    } else if (media.type === 'audio' && audioRef.current) {
      audioRef.current.muted = isMuted
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } else if (media.type === 'image' || media.type === 'text') {
      const durationMs = 6000
      const tickMs = 60
      let elapsed = 0

      imageIntervalRef.current = setInterval(() => {
        if (!isPlaying) return
        elapsed += tickMs
        setImageProgress(Math.min(100, (elapsed / durationMs) * 100))
      }, tickMs)

      imageTimerRef.current = setTimeout(() => {
        handleNext()
      }, durationMs)
    }

    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current)
      if (imageIntervalRef.current) clearInterval(imageIntervalRef.current)
    }
  }, [currentTake, isPlaying, handleNext])

  // Keyboard navigation & remote consistency
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        castVote('up')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        castVote('down')
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMute()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, togglePlay, toggleMute, castVote])

  if (loading) {
    return (
      <main className="watch-main section-wrap">
        <div className="watch-loading-state">
          <div className="header-loading" />
          <span>Tuning into the Airwaves stream…</span>
        </div>
      </main>
    )
  }

  if (takes.length === 0 || !currentTake) {
    return (
      <main className="watch-main section-wrap">
        <div className="watch-empty-state">
          <EfIrMark className="watch-empty-mark" />
          <h2>The Airwaves are quiet — for now.</h2>
          <p>Broadcast your first take from the phone app to start the live stream.</p>
          <div className="watch-empty-actions">
            <Link className="primary-button" href="/">
              Back to Home
            </Link>
            <Link className="outline-button" href="/studio">
              Go to Studio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const author = currentTake.author
  const authorName = author.display_name || author.username || 'EFIR Creator'
  const authorId = author.id
  const media = currentTake.media
  const poster = media.image_url || media.raw_url || undefined
  const playable = media.playable_url || media.raw_url || undefined
  const audioSrc = media.audio_url || (media.type === 'audio' ? media.playable_url || media.raw_url : undefined)

  const dateFormatted = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(currentTake.created_at))

  const baseUp = currentTake.reactions?.up || 0
  const baseDown = currentTake.reactions?.down || 0
  const userVote = userVotes[currentTake.id] || 0
  const displayUp = baseUp + (userVote === 1 ? 1 : 0)
  const displayDown = baseDown + (userVote === -1 ? 1 : 0)

  return (
    <main className="watch-main section-wrap">
      {/* Top Stream Header Bar */}
      <div className="watch-top-bar">
        <div className="watch-live-indicator">
          <span className="on-air-dot" />
          <span className="watch-tag">{streamMode === 'airwaves' ? 'THE AIRWAVES' : 'TOP TAKES (7D)'}</span>
          <span className="watch-pos">
            {currentIndex + 1} / {takes.length}
          </span>
        </div>

        {/* Stream switcher (Airwaves vs Top Takes) */}
        <div className="watch-stream-tabs">
          <button
            type="button"
            className={`watch-tab-pill ${streamMode === 'airwaves' ? 'is-active' : ''}`}
            onClick={() => {
              setStreamMode('airwaves')
              setCurrentIndex(0)
            }}
          >
            Airwaves
          </button>
          <button
            type="button"
            className={`watch-tab-pill ${streamMode === 'top' ? 'is-active' : ''}`}
            onClick={() => {
              setStreamMode('top')
              setCurrentIndex(0)
            }}
          >
            Top Takes
          </button>
        </div>

        <div className="watch-controls-top">
          <button
            type="button"
            className={`watch-mute-pill ${isMuted ? 'is-muted' : 'is-unmuted'}`}
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute stream' : 'Mute stream'}
            title="Press M to mute/unmute"
          >
            {isMuted ? (
              <>
                <VolumeX className="mute-icon" aria-hidden="true" />
                <span>UNMUTE (M)</span>
              </>
            ) : (
              <>
                <Volume2 className="mute-icon" aria-hidden="true" />
                <span>SOUND ON (M)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Theater Stage */}
      <div className="watch-theater">
        {/* Progress Bar for static media */}
        {(media.type === 'image' || media.type === 'text') && (
          <div className="watch-progress-track" aria-hidden="true">
            <div
              className="watch-progress-fill"
              style={{ width: `${imageProgress}%` }}
            />
          </div>
        )}

        <div className="watch-stage" onClick={togglePlay}>
          {media.type === 'video' && playable ? (
            <video
              ref={videoRef}
              className="watch-video-element"
              src={playable}
              poster={poster}
              playsInline
              preload="auto"
              onEnded={handleNext}
            />
          ) : media.type === 'audio' && audioSrc ? (
            <div className="watch-audio-stage">
              <audio
                ref={audioRef}
                src={audioSrc}
                preload="auto"
                onEnded={handleNext}
              />
              <div className="watch-audio-visual">
                {author.avatar_url ? (
                  <img
                    className="watch-audio-avatar"
                    src={author.avatar_url}
                    alt=""
                  />
                ) : (
                  <div className="watch-audio-avatar watch-audio-fallback">
                    {authorName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="watch-wave-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <p className="watch-audio-label">VOICE TAKE BROADCASTING</p>
              </div>
            </div>
          ) : media.type === 'image' && (media.image_url || media.raw_url) ? (
            <div className="watch-image-stage">
              <img
                className="watch-image-element"
                src={media.image_url || media.raw_url || ''}
                alt={currentTake.comment || 'Take image'}
              />
            </div>
          ) : (
            <div className="watch-text-stage">
              <AudioLines className="watch-text-icon" aria-hidden="true" />
              <p className="watch-text-quote">"{currentTake.quote}"</p>
              {currentTake.comment && (
                <p className="watch-text-commentary">{currentTake.comment}</p>
              )}
            </div>
          )}

          {/* Floating Play/Pause Indicator when paused */}
          {!isPlaying && (
            <div className="watch-paused-overlay" aria-hidden="true">
              <div className="watch-paused-badge">
                <Play className="play-icon" />
                <span>PAUSED</span>
              </div>
            </div>
          )}
        </div>

        {/* Previous / Next Floating Arrows */}
        <button
          type="button"
          className="watch-nav-arrow watch-nav-prev"
          onClick={handlePrev}
          aria-label="Previous take"
          title="Previous (←)"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className="watch-nav-arrow watch-nav-next"
          onClick={handleNext}
          aria-label="Next take"
          title="Next (→)"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Bottom Info Card */}
      <div className="watch-card">
        <div className="watch-author-row">
          {author.avatar_url ? (
            <img className="watch-avatar" src={author.avatar_url} alt="" />
          ) : (
            <div className="watch-avatar watch-avatar-fallback">
              {authorName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="watch-author-info">
            <div className="watch-author-name-row">
              {authorId ? (
                <Link
                  className="watch-author-name"
                  href={`/c/${authorId}`}
                  title={`View ${authorName}'s public channel`}
                >
                  {authorName}
                </Link>
              ) : (
                <span className="watch-author-name">{authorName}</span>
              )}
              {author.username && (
                <span className="watch-handle">@{author.username}</span>
              )}
            </div>
            {currentTake.source?.title && (
              <span className="watch-source-badge">
                Source: {currentTake.source.title}
              </span>
            )}
          </div>

          <div className="watch-card-actions">
            <Link
              className="outline-button watch-channel-link"
              href={authorId ? `/c/${authorId}` : '/'}
            >
              Channel
            </Link>
          </div>
        </div>

        {currentTake.comment && (
          <p className="watch-commentary">{currentTake.comment}</p>
        )}

        <div className="watch-bottom-meta">
          <time className="watch-date">{dateFormatted}</time>
          <div className="watch-reactions">
            <button
              type="button"
              className={`watch-vote-pill ${userVote === 1 ? 'is-up-active' : ''}`}
              onClick={() => castVote('up')}
              aria-label="Boost take"
              title="Boost take (↑ key)"
            >
              <span>▲</span> {displayUp}
            </button>
            <button
              type="button"
              className={`watch-vote-pill ${userVote === -1 ? 'is-down-active' : ''}`}
              onClick={() => castVote('down')}
              aria-label="Pass take"
              title="Pass take (↓ key)"
            >
              <span>▼</span> {displayDown}
            </button>
          </div>
          <span className="watch-hotkeys-hint">
            Hotkeys: ← / → Next · ↑ Boost · ↓ Pass · Space Pause · M Mute
          </span>
        </div>
      </div>

      <Disclosure />
    </main>
  )
}
