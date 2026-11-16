import { AudioLines, Eye, EyeOff, Trash2 } from 'lucide-react'

export interface TakeRecord {
  id: string
  user_id: string
  comment: string | null
  media_type: 'video' | 'audio' | 'image' | 'text' | string
  media_url: string | null
  audio_url: string | null
  image_url: string | null
  playable_url: string | null
  visibility?: 'public' | 'private' | string
  moderation_status?: string | null
  created_at: string
  reactions?: Record<string, unknown> | null
}

function displayScore(reactions: TakeRecord['reactions'], names: string[]) {
  if (!reactions) return 0
  for (const name of names) {
    const value = reactions[name]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return 0
}

export function TakeMedia({ take, ownerName }: { take: TakeRecord; ownerName: string }) {
  const poster = take.image_url || undefined
  const videoUrl = take.playable_url || take.media_url
  const audioUrl = take.playable_url || take.audio_url || take.media_url
  const imageUrl = take.image_url || take.media_url || take.playable_url
  const label = take.comment?.trim() || `${take.media_type} take by ${ownerName}`

  if (take.media_type === 'video' && videoUrl) {
    return <video className="take-video" controls playsInline preload="metadata" poster={poster} aria-label={label}>
      <source src={videoUrl} />
      Your browser does not support video playback.
    </video>
  }

  if (take.media_type === 'audio' && audioUrl) {
    return <div className="audio-take">
      {poster ? <img className="audio-poster" src={poster} alt={`Poster for ${label}`} /> : <div className="audio-wave" aria-hidden="true"><AudioLines /><span /><span /><span /><span /><span /><span /><span /></div>}
      <audio controls preload="none" aria-label={label}>
        <source src={audioUrl} />
        Your browser does not support audio playback.
      </audio>
    </div>
  }

  if ((take.media_type === 'image' || imageUrl) && imageUrl) {
    return <img className="take-image" src={imageUrl} alt={label} loading="lazy" />
  }

  return <div className="take-text-media"><AudioLines aria-hidden="true" /><p>{take.comment || 'A text take'}</p></div>
}

function reactionCount(reactions: TakeRecord['reactions'], direction: 'up' | 'down') {
  return direction === 'up'
    ? displayScore(reactions, ['up', 'upvotes', 'up_count', 'upvotes_count', 'likes'])
    : displayScore(reactions, ['down', 'downvotes', 'down_count', 'downvotes_count', 'dislikes'])
}

export function TakeCard({
  take,
  ownerName,
  owner = false,
  busy = false,
  onToggle,
  onDelete,
}: {
  take: TakeRecord
  ownerName: string
  owner?: boolean
  busy?: boolean
  onToggle?: () => void
  onDelete?: () => void
}) {
  const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(take.created_at))

  return <article className="take-card">
    <div className="take-media"><TakeMedia take={take} ownerName={ownerName} /></div>
    <div className="take-card-body">
      <div className="take-meta"><time dateTime={take.created_at}>{date}</time>{owner && <span className={`visibility-badge ${take.visibility === 'public' ? 'is-public' : 'is-private'}`}>{take.visibility === 'public' ? 'Public' : 'Private'}</span>}</div>
      {take.comment && <p className="take-caption">{take.comment}</p>}
      {owner && <div className="take-card-footer">
        <span className="take-score" aria-label={`${reactionCount(take.reactions, 'up')} up votes and ${reactionCount(take.reactions, 'down')} down votes`}><span>↑ {reactionCount(take.reactions, 'up')}</span><span>↓ {reactionCount(take.reactions, 'down')}</span></span>
        <div className="take-actions">
          <button className="take-action" type="button" onClick={onToggle} disabled={busy} aria-label={take.visibility === 'public' ? 'Make take private' : 'Make take public'} title={take.visibility === 'public' ? 'Make private' : 'Make public'}>
            {take.visibility === 'public' ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
          <button className="take-action take-delete" type="button" onClick={onDelete} disabled={busy} aria-label="Delete take" title="Delete take"><Trash2 aria-hidden="true" /></button>
        </div>
      </div>}
      {owner && take.moderation_status && take.moderation_status !== 'approved' && <p className="take-moderation">{take.moderation_status}</p>}
    </div>
  </article>
}
