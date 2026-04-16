'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  Squares2X2Icon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

type NavLink = {
  href: string
  label: string
  icon: typeof HomeIcon
  showAlways?: boolean
  showWhenLoggedIn?: boolean
}

const LINKS: NavLink[] = [
  { href: '/',           label: 'Home',       icon: HomeIcon,                      showAlways: true },
  { href: '/dashboard',  label: 'Dashboard',  icon: Squares2X2Icon,                showWhenLoggedIn: true },
  { href: '/portfolio',  label: 'Portfolio',  icon: ChartBarIcon,                  showWhenLoggedIn: true },
  { href: '/trading',    label: 'Trading',    icon: BanknotesIcon,                 showWhenLoggedIn: true },
  { href: '/assessment', label: 'Assessment', icon: ClipboardDocumentCheckIcon,    showAlways: true },
]

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div
      className={`${s} rounded-2xl flex items-center justify-center shadow-primary`}
      style={{ background: 'linear-gradient(135deg, #5B5BF6 0%, #8B5CF6 55%, #F76343 100%)' }}
    >
      <span className="text-on-dark font-bold">H</span>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('access_token'))
  }, [pathname])

  const handleLogout = () => {
    ['access_token','refresh_token','user_id','portfolioGenerated','pendingAssessment','assessmentResults']
      .forEach(k => localStorage.removeItem(k))
    setIsLoggedIn(false)
    router.push('/')
  }

  const visible = LINKS.filter(l => l.showAlways || (l.showWhenLoggedIn && isLoggedIn))
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="min-h-screen">
      {/* ───── Desktop sidebar ───── */}
      <aside className="app-sidebar">
        <Link href="/" className="flex items-center gap-3 px-6 h-16 border-b border-dark-700/60">
          <BrandMark />
          <span className="heading-sm">Hedgewise</span>
        </Link>

        <nav className="flex-1 px-3 py-6 space-y-1">
          <div className="px-3 pb-2 eyebrow">Menu</div>
          {visible.map(l => {
            const Icon = l.icon
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`sidebar-item ${isActive(l.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{l.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-dark-700/60">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="sidebar-item sidebar-item-inactive w-full hover:text-red-600 hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Log out</span>
            </button>
          ) : (
            <div className="space-y-2">
              <Link href="/login"  className="btn-secondary w-full text-center block">Log in</Link>
              <Link href="/signup" className="btn-gradient  w-full text-center block">Get started</Link>
            </div>
          )}
        </div>
      </aside>

      {/* ───── Top bar (mobile + desktop) ───── */}
      <header className="app-topbar lg:pl-64">
        <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8">
          {/* Mobile brand */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="heading-sm">Hedgewise</span>
          </Link>

          {/* Desktop search */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                placeholder="Search assets, orders…"
                className="input w-full pl-10 py-2.5 text-sm bg-dark-800/80 border-transparent focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button className="hidden lg:flex items-center justify-center w-10 h-10 rounded-2xl text-neutral-500 hover:text-neutral-900 hover:bg-dark-800 transition-all" aria-label="Notifications">
                <BellIcon className="h-5 w-5" />
              </button>
            )}
            {!isLoggedIn && (
              <div className="hidden lg:flex items-center gap-2">
                <Link href="/login"  className="btn-ghost text-sm">Log in</Link>
                <Link href="/signup" className="btn-gradient text-sm py-2 px-4">Get started</Link>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-neutral-700 hover:bg-dark-800 rounded-2xl transition-all"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ───── Main content ───── */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </main>

      {/* ───── Mobile bottom tab bar ───── */}
      <nav className="app-bottombar">
        {visible.slice(0, 5).map(l => {
          const Icon = l.icon
          const active = isActive(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`bottombar-item ${active ? 'bottombar-item-active' : 'bottombar-item-inactive'}`}
            >
              <Icon className="h-5 w-5" />
              <span>{l.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ───── Mobile drawer ───── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-soft-xl animate-slide-left">
            <div className="flex items-center justify-between px-6 h-16 border-b border-dark-700/60">
              <div className="flex items-center gap-2">
                <BrandMark size="sm" />
                <span className="heading-sm">Hedgewise</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-neutral-500 hover:bg-dark-800 rounded-2xl"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 space-y-1">
              {visible.map(l => {
                const Icon = l.icon
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={`sidebar-item ${isActive(l.href) ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{l.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="absolute bottom-0 inset-x-0 p-4 border-t border-dark-700/60">
              {isLoggedIn ? (
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="sidebar-item sidebar-item-inactive w-full hover:text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Link href="/login"  onClick={() => setMobileOpen(false)} className="btn-secondary w-full text-center block">Log in</Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="btn-gradient  w-full text-center block">Get started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
