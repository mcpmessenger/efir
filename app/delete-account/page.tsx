import { Mail, ShieldCheck } from 'lucide-react'
import { SiteShell } from '@/components/efir-site'

export default function DeleteAccountPage() {
  return <SiteShell>
    <main className="legal-page section-wrap">
      <p className="eyebrow"><span className="eyebrow-line" /> ACCOUNT &amp; PRIVACY</p>
      <div className="legal-content">
        <div className="legal-icon"><ShieldCheck aria-hidden="true" /></div>
        <h1>Delete your<br /><span className="gradient-text">EFIR account.</span></h1>
        <p className="legal-intro">You’re always in control of what you’ve shared. Here’s how to permanently remove your account and content.</p>
        <section className="legal-card"><span className="legal-step">01 — IN THE APP</span><h2>The fastest way</h2><p>In the app: Settings → Account → Delete account. This permanently deletes your takes (including their media files), your channel, and your profile.</p></section>
        <section className="legal-card"><span className="legal-step">02 — CAN’T SIGN IN?</span><h2>We can help</h2><p>Email us from the address on your account, and we’ll process the deletion for you.</p><a className="email-link" href="mailto:will@efir.fm"><Mail aria-hidden="true" /> will@efir.fm <span aria-hidden="true">↗</span></a></section>
        <p className="legal-warning"><span aria-hidden="true">!</span> Deletion is permanent and can’t be undone. Your takes and their media files, channel, and profile will be removed.</p>
      </div>
    </main>
  </SiteShell>
}
