'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AudioLines, ChevronRight, Play, Tv2, Video } from 'lucide-react'
import { FeedItem, fetchAirwavesFeed } from '@/lib/feed'
import { EfIrMark } from '@/components/efir-site'

interface AirwavesRailProps {
  initialItems?: FeedItem[]
}

export function AirwavesRail({ initialItems = [] }: AirwavesRailProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [loading, setLoading] = useState(initialItems.length === 0)

  useEffect(() => {
    fetchAirwavesFeed()
      .then((data) => {
        setItems(data)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('Failed to load airwaves feed:', err)
        setLoading(false)
      })
  }, [])

  return (
    <section className="airwaves-section section-wrap" aria-labelledby="airwaves-heading">
      <div className="airwaves-header">
        <div className="airwaves-title-wrap">
          <p className="eyebrow">
            <span className="on-air-dot" /> LIVE — THE AIRWAVES
          </p>
          <h2 id="airwaves-heading">
            What’s broadcasting <span className="gradient-text">right now.</span>
          </h2>
        </div>
        <Link href="/watch" className="watch-all-link">
          <span>Watch the stream</span>
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="airwaves-rail-loading">
          <div className="header-loading" />
          <span>Tuning into the airwaves…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="airwaves-empty">
          <EfIrMark className="empty-mark" />
          <h3>The Airwaves are quiet — for now.</h3>
          <p>Be the first to broadcast from the EFIR app.</p>
        </div>
      ) : (
        <div className="airwaves-rail-container">
          <div className="airwaves-rail">
            {items.map((item, index) => {
              const poster = item.media.image_url || item.media.raw_url || undefined
              const isVideo = item.media.type === 'video'
              const isAudio = item.media.type === 'audio'
              const authorName = item.author.display_name || item.author.username || 'Broadcaster'

              return (
                <Link
                  key={item.id}
                  href={`/watch?take=${encodeURIComponent(item.id)}`}
                  className="airwaves-card"
                  aria-label={`Watch take by ${authorName}: ${item.comment || item.media.type}`}
                >
                  <div className="airwaves-card-media">
                    {isVideo && poster ? (
                      <img src={poster} alt="" className="airwaves-media-img" loading="lazy" />
                    ) : isVideo && item.media.playable_url ? (
                      <video
                        src={item.media.playable_url}
                        className="airwaves-media-video"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : item.media.type === 'image' && poster ? (
                      <img src={poster} alt="" className="airwaves-media-img" loading="lazy" />
                    ) : isAudio ? (
                      <div className="airwaves-audio-tile">
                        <AudioLines className="tile-icon" />
                        <span>Voice take</span>
                      </div>
                    ) : (
                      <div className="airwaves-text-tile">
                        <p>{item.comment || 'Text take'}</p>
                      </div>
                    )}
                    <div className="airwaves-play-overlay">
                      <div className="play-pill">
                        <Play className="play-icon" aria-hidden="true" fill="currentColor" />
                        <span>Watch</span>
                      </div>
                    </div>
                    <span className="airwaves-type-tag">
                      {item.media.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="airwaves-card-info">
                    <div className="airwaves-author-row">
                      {item.author.avatar_url ? (
                        <img
                          src={item.author.avatar_url}
                          alt=""
                          className="airwaves-avatar"
                        />
                      ) : (
                        <div className="airwaves-avatar airwaves-avatar-fallback">
                          {authorName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="airwaves-author-name">{authorName}</span>
                    </div>
                    {item.comment ? (
                      <p className="airwaves-comment">{item.comment}</p>
                    ) : (
                      <p className="airwaves-comment placeholder">Live broadcast</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
