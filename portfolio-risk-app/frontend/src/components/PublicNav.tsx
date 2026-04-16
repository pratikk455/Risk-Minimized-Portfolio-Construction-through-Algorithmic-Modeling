'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function BrandMark() {
  return (
    <div
      className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-primary"
      style={{ background: 'linear-gradient(135deg, #5B5BF6 0%, #8B5CF6 55%, #F76343 100%)' }}
    >
      <span className="text-on-dark font-bold text-sm">H</span>
    </div>
  )
}

const LINKS = [
  { href: '/',           label: 'Home' },
  { href: '/assessment', label: 'Assessment' },
]

export default function PublicNav() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="glass sticky top-0 z-40 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="heading-sm">Hedgewise</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-dark-800/70 rounded-full p-1 border border-dark-700/60">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-pill ${isActive(l.href) ? 'nav-pill-active' : 'nav-pill-inactive'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login"  className="btn-ghost text-sm">Log in</Link>
          <Link href="/signup" className="btn-gradient text-sm py-2 px-4">Get started</Link>
        </div>
      </div>
    </header>
  )
}
