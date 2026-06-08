import Link from "next/link"
import { Heart } from "lucide-react"

const FAMILY_LINKS = [
  { href: "/nurses", label: "Find Caregivers" },
  { href: "#", label: "How It Works" },
  { href: "#", label: "Pricing" },
]

const PROVIDER_LINKS = [
  { href: "/register?role=provider", label: "Join as Provider" },
  { href: "#", label: "Requirements" },
  { href: "#", label: "Support" },
]

const COMPANY_LINKS = [
  { href: "#", label: "About Us" },
  { href: "#", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
]

const SOCIAL_LINKS = [
  { href: "https://facebook.com", label: "Facebook" },
  { href: "https://twitter.com", label: "Twitter" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: "https://instagram.com", label: "Instagram" },
]

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[linear-gradient(180deg,#0a0e27_0%,#0f1535_55%,#080b1e_100%)] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute bottom-[-140px] right-[-80px] h-[340px] w-[340px] rounded-full bg-brand-500/25 blur-[95px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1180px] px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-14 md:px-8 md:pt-16">
        <div className="grid gap-6 border-b border-white/10 pb-8 sm:grid-cols-2 sm:gap-8 sm:pb-10 md:gap-10 md:pb-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="relative z-10 max-w-xs sm:col-span-2 sm:max-w-sm lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 text-white no-underline hover:no-underline">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 sm:h-11 sm:w-11">
                <Heart className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight sm:text-xl">HanapKalinga</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:mt-4">
              Connecting families with trusted healthcare professionals across the Philippines.
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">For Families</p>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
              {FAMILY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">For Providers</p>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
              {PROVIDER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Company</p>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 sm:mt-6">Follow Us</p>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex flex-col items-start justify-between gap-3 text-xs text-slate-500 sm:mt-6 sm:gap-4 md:flex-row md:items-center">
          <p>&copy;{new Date().getFullYear()} HanapKalinga. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <a href="#" className="transition-colors hover:text-white">Accessibility Statement</a>
          </div>
        </div>

        <p
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-0 select-none text-[56px] font-semibold leading-none tracking-tight text-slate-500/15 max-sm:hidden md:text-[160px]"
        >
          HanapKalinga
        </p>
      </div>
    </footer>
  )
}
