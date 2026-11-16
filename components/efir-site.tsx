import Link from 'next/link'

const iconUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/efir-icon-transparent-Zjev5iVcHNZjn9ssKntq38PFqaOUtv.png'
const lightWordmarkUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/efir-wordmark-transparent-WAAM4U9ejz4vp1ewemT7b45xQq0Z9r.png'
const darkWordmarkUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/efir-wordmark-on-dark-P43K95s2zu7s9QoKKMHUh5pfGRt2mq.png'

export function EfIrMark({ className = '' }: { className?: string }) {
  return <span className={`efir-mark ${className}`} aria-label="EFIR mark">Э</span>
}

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return <img className="wordmark" src={dark ? darkWordmarkUrl : lightWordmarkUrl} alt="efir" />
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-link" aria-label="EFIR home"><Wordmark /></Link>
      <span className="on-air"><span className="on-air-dot" /> ON AIR</span>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/" className="footer-brand" aria-label="EFIR home"><Wordmark dark /></Link>
      <span className="copyright">© 2026 EFIR</span>
      <nav aria-label="Footer navigation" className="footer-links">
        <Link href="/delete-account">Delete account</Link>
        <Link href="/auth/callback">App sign-in</Link>
      </nav>
    </footer>
  )
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>
}

export function Disclosure() {
  return <p className="disclosure"><span aria-hidden="true">i</span> Images on EFIR may be AI-generated or AI-augmented.</p>
}
