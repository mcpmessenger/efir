export interface FeedAuthor {
  id?: string
  username: string
  display_name: string
  avatar_url: string | null
}

export interface FeedMedia {
  type: 'video' | 'audio' | 'image' | 'text'
  raw_url?: string | null
  image_url?: string | null
  playable_url?: string | null
  audio_url?: string | null
  timestamp?: string | null
}

export interface FeedItem {
  id: string
  slug: string
  pass_url?: string
  qr_url?: string
  author: FeedAuthor
  source?: {
    url: string
    title: string
    domain: string
  }
  quote?: string
  comment?: string
  intent?: string
  media: FeedMedia
  is_disputed?: boolean
  reactions?: Record<string, number>
  created_at: string
}

export const EFIR_FEED_URL = 'https://xljkinaqtijucenvzoax.supabase.co/functions/v1/feed'

export async function fetchAirwavesFeed(): Promise<FeedItem[]> {
  const res = await fetch(EFIR_FEED_URL, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch feed: ${res.statusText}`)
  }
  const data = await res.json()
  return data.items || []
}
