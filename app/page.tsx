import { ArrowDownRight, ArrowUpRight, AudioLines, CirclePlay, ScanLine, Tv2, Video } from 'lucide-react'
import { Disclosure, EfIrMark, SiteShell } from '@/components/efir-site'

const steps = [
  { number: '01', title: 'Record', icon: AudioLines, text: 'Voice or face. Sixty seconds. Straight from the moment you’re watching.' },
  { number: '02', title: 'Broadcast', icon: Video, text: 'Your takes become your channel. Instantly.' },
  { number: '03', title: 'Watch', icon: Tv2, text: 'Channels play lean-back on Roku. React, vote, scan the QR to answer back.' },
]

export default function Page() {
  return (
    <SiteShell>
      <main>
        <section className="hero section-wrap">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-mark-wrap"><EfIrMark className="hero-mark" /></div>
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> YOUR CHANNEL. YOUR TAKE.</p>
            <h1><span className="hero-word">efir<span className="red-dot">.</span></span><span className="hero-tagline">Highlight it.<br /><span className="gradient-text">Broadcast it.</span></span></h1>
            <p className="hero-description">Record a take on your phone — a fact-check, a hot take, your evening — and it plays on TVs as your channel.</p>
            <a className="text-link" href="#how-it-works">See how it works <ArrowDownRight aria-hidden="true" /></a>
          </div>
          <div className="hero-coordinate" aria-hidden="true">EFIR / LIVE<br />37° 46′ N · 122° 25′ W</div>
        </section>

        <section id="how-it-works" className="steps-section section-wrap">
          <div className="section-heading"><p className="eyebrow">FROM THE MOMENT TO THE SCREEN</p><h2>A point of view,<br />in the room.</h2></div>
          <div className="steps-grid">
            {steps.map(({ number, title, icon: Icon, text }) => <article className="step-card" key={number}>
              <div className="card-topline"><span>{number} / 03</span><Icon aria-hidden="true" /></div>
              <h3>{title}</h3><p>{text}</p>
            </article>)}
          </div>
        </section>

        <section className="trail-section section-wrap">
          <div className="trail-panel">
            <div className="trail-orbit" aria-hidden="true"><span /><span /><span /></div>
            <div className="trail-copy"><p className="eyebrow">GO A LITTLE FURTHER</p><h2>Some stories<br />take a <span className="gradient-text">Trail.</span></h2><p>Trails are guided shows — a creator talks you through a video, or narrates their evening, take by take.</p></div>
            <div className="trail-side"><CirclePlay aria-hidden="true" /><span>YOUR NEXT STORY<br />IS ALREADY THERE.</span><ArrowUpRight aria-hidden="true" /></div>
          </div>
        </section>

        <section className="broadcast-strip section-wrap" aria-label="EFIR on your screen">
          <div><span className="on-air-dot" /><span>YOUR TAKE, ON AIR</span></div><div className="strip-rule" /><span>MADE FOR THE BIG SCREEN</span><Tv2 aria-hidden="true" /><ScanLine aria-hidden="true" />
        </section>
        <Disclosure />
      </main>
    </SiteShell>
  )
}
