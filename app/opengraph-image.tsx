import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'EFIR — Highlight it. Broadcast it.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '88px', background: '#08080c', color: '#f5f5f7', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '34px' }}>
        <span style={{ fontSize: 190, fontWeight: 800, lineHeight: 1, background: 'linear-gradient(120deg, #8b5cf6, #22d3ee)', backgroundClip: 'text', color: 'transparent' }}>Э</span>
        <span style={{ fontSize: 86, fontWeight: 800, letterSpacing: '-8px' }}>efir<span style={{ color: '#ff3b30' }}>.</span></span>
      </div>
      <div style={{ marginTop: 28, fontSize: 46, fontWeight: 700, letterSpacing: '-2px' }}>Highlight it. Broadcast it.</div>
      <div style={{ marginTop: 22, fontSize: 21, color: '#9998a6' }}>You, on the topic, on everyone’s TV.</div>
    </div>,
    size,
  )
}
