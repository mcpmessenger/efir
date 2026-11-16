'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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

interface WatchPlayerProps {
  initialTakes?: FeedItem[]
}

export function WatchPlayer({ initialTakes = [] }: WatchPlayerProps) {
  const searchParams = useSearchParams()
  const takeParam = searchParams.get('take')

  const [takes, setTakes] = useState<FeedItem[]>(initialTakes)
  const [loading, setLoading] = useState(initialTakes.length === 0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [imageProgress, setImageProgress] = useState(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null)
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch feed on mount
  useEffect(() => {
    fetchAirwavesFeed()
      .then((data) => {
        setTakes(data)
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

  const currentTake = takes[currentIndex] || null

  const handleNext = useCallback(() => {
    if (takes.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % takes.length)
    setIsPlaying(true)
    setImageProgress(0)
  }, [takes.length])

  const handlePrev = useCallback(() => {
    if (takes.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + takes.length) % takes.length)
    setIsPlaying(true)
    setImageProgress(0)
  }, [takes.length])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  // Sync video/audio playback with isPlaying & isMuted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
      if (isPlaying) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
      }
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted
      if (isPlaying) {
        audioRef.current.play().catch(() => {})
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, isMuted, currentIndex])

  // Timer for image / text takes (hold ~6 seconds, then auto-advance)
  useEffect(() => {
    if (!currentTake) return

    if (imageTimerRef.current) clearTimeout(imageTimerRef.current)
    if (imageIntervalRef.current) clearInterval(imageIntervalRef.current)

    const isStatic = currentTake.media.type === 'image' || currentTake.media.type === 'text'

    if (isStatic && isPlaying) {
      setImageProgress(0)
      const durationMs = 6000
      const tickMs = 50
      let elapsed = 0

      imageIntervalRef.current = setInterval(() => {
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        handlePrev()
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
  }, [handleNext, handlePrev, togglePlay, toggleMute])

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
          <EfIrMark className="empty-mark" />
          <h1>The Airwaves are quiet — for now.</h1>
          <p>When creators broadcast public takes from the app, they play here live.</p>
          <Link href="/" className="outline-button" style={{ marginTop: 24 }}>
            Return to Home
          </Link>
        </div>
        <Disclosure />
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

  const upVotes = currentTake.reactions?.up || currentTake.reactions?.likes || 0
  const downVotes = currentTake.reactions?.down || currentTake.reactions?.dislikes || 0

  return (
    <main className="watch-main section-wrap">
      {/* Top Stream Header Bar */}
      <div className="watch-top-bar">
        <div className="watch-live-indicator">
          <span className="on-air-dot" />
          <span className="watch-tag">THE AIRWAVES</span>
          <span className="watch-pos">
            {currentIndex + 1} / {takes.length}
          </span>
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
              key={currentTake.id}
              src={playable}
              poster={poster}
              className="watch-stage-video"
              playsInline
              autoPlay
              muted={isMuted}
              onEnded={handleNext}
            />
          ) : media.type === 'audio' && audioSrc ? (
            <div className="watch-audio-stage">
              {poster ? (
                <img src={poster} alt="" className="watch-audio-bg" />
              ) : (
                <div className="watch-audio-glow" />
              )}
              <div className="watch-audio-wave-wrap">
                <AudioLines className="wave-icon" aria-hidden="true" />
                <div className="watch-wave-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <audio
                ref={audioRef}
                key={currentTake.id}
                src={audioSrc}
                autoPlay
                muted={isMuted}
                onEnded={handleNext}
              />
            </div>
          ) : media.type === 'image' && poster ? (
            <div className="watch-image-stage">
              <img
                key={currentTake.id}
                src={poster}
                alt={currentTake.comment || 'Broadcast take'}
                className="watch-stage-img"
              />
            </div>
          ) : (
            <div className="watch-text-stage">
              <EfIrMark className="text-stage-mark" />
              <p className="watch-text-content">
                {currentTake.comment || 'A live commentary take'}
              </p>
            </div>
          )}

          {/* Pause Overlay indicator */}
          {!isPlaying && (
            <div className="watch-paused-overlay">
              <div className="paused-pill">
                <Pause aria-hidden="true" />
                <span>PAUSED</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Side Prev/Next Nav Arrows */}
        <button
          type="button"
          className="watch-nav-arrow watch-nav-prev"
          onClick={handlePrev}
          aria-label="Previous take (Left Arrow)"
          title="Previous take (Left Arrow)"
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        <button
          type="button"
          className="watch-nav-arrow watch-nav-next"
          onClick={handleNext}
          aria-label="Next take (Right Arrow)"
          title="Next take (Right Arrow)"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      {/* Info & Metadata Panel */}
      <div className="watch-meta-card">
        <div className="watch-author-block">
          {author.avatar_url ? (
            <img src={author.avatar_url} alt="" className="watch-avatar" />
          ) : (
            <div className="watch-avatar watch-avatar-fallback">
              {authorName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="watch-author-details">
            <div className="watch-author-line">
              {authorId ? (
                <Link
                  href={`/c/${authorId}`}
                  className="watch-author-link"
                  title="View creator channel"
                >
                  <span className="author-name">{authorName}</span>
                  <span className="channel-pill">Channel ↗</span>
                </Link>
              ) : (
                <span className="author-name">{authorName}</span>
              )}
              {currentTake.intent && (
                <span className="watch-intent-badge">{currentTake.intent}</span>
              )}
            </div>
            {author.username && (
              <p className="watch-username">@{author.username}</p>
            )}
          </div>
        </div>

        {currentTake.comment && (
          <p className="watch-commentary">{currentTake.comment}</p>
        )}

        <div className="watch-bottom-meta">
          <time className="watch-date">{dateFormatted}</time>
          <div className="watch-reactions">
            <span>↑ {upVotes}</span>
            <span>↓ {downVotes}</span>
          </div>
          <span className="watch-hotkeys-hint">
            Hotkeys: ← / → Next · Space Pause · M Mute
          </span>
        </div>
      </div>

      <Disclosure />
    </main>
  )
}
