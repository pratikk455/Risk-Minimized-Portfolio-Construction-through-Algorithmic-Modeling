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
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('portfolioGenerated')
    localStorage.removeItem('pendingAssessment')
    localStorage.removeItem('assessmentResults')

    setIsLoggedIn(false)
    router.push('/')
  }

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: '/', label: 'Home', icon: HomeIcon, showAlways: true },
    { href: '/assessment', label: 'Assessment', icon: ClipboardDocumentCheckIcon, showAlways: true },
    { href: '/portfolio', label: 'Portfolio', icon: ChartBarIcon, showWhenLoggedIn: true },
    { href: '/trading', label: 'Trading', icon: BanknotesIcon, showWhenLoggedIn: true },
  ]

  return (
    <nav className="glass sticky top-0 z-50 border-b border-neutral-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-lg text-white">Hedgewise</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-dark-800/50 rounded-full p-1">
            {navLinks.map((link) => {
              const shouldShow = link.showAlways || (link.showWhenLoggedIn && isLoggedIn)
              if (!shouldShow) return null

              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-pill flex items-center gap-2 ${
                    isActive(link.href)
                      ? 'nav-pill-active'
                      : 'nav-pill-inactive'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-ghost"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn-gradient"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white hover:bg-dark-800 rounded-xl transition-all"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-800/50 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const shouldShow = link.showAlways || (link.showWhenLoggedIn && isLoggedIn)
                if (!shouldShow) return null

                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      isActive(link.href)
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-neutral-400 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}

              <div className="border-t border-neutral-800/50 pt-4 mt-2">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Logout
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-center text-neutral-300 hover:bg-dark-800 rounded-xl font-medium transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-gradient text-center"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
