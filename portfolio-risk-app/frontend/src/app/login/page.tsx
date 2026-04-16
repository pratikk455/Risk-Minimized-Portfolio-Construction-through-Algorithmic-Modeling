'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LockClosedIcon, UserIcon, EyeIcon, EyeSlashIcon,
  ArrowRightIcon, ShieldCheckIcon, SparklesIcon, BoltIcon,
} from '@heroicons/react/24/outline'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-primary"
        style={{ background: 'linear-gradient(135deg, #5B5BF6 0%, #8B5CF6 55%, #F76343 100%)' }}
      >
        <span className="text-on-dark font-bold">H</span>
      </div>
      <span className="heading-md">Hedgewise</span>
    </Link>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ username: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
        username: formData.username,
        password: formData.password,
      })

      if (response.data.success) {
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token)
          localStorage.setItem('refresh_token', response.data.refresh_token)
          localStorage.setItem('user_id', response.data.user_id.toString())
        }
        const pendingAssessment = localStorage.getItem('pendingAssessment')
        router.push(pendingAssessment ? '/results' : '/portfolio')
      } else if (response.data.requires_2fa) {
        setError('2FA is enabled but not yet implemented in this UI')
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (err.response?.data?.message) setError(err.response.data.message)
      else if (typeof detail === 'string') setError(detail)
      else if (Array.isArray(detail)) setError(detail.map((e: any) => e.msg || JSON.stringify(e)).join(', '))
      else if (typeof detail === 'object' && detail) setError(JSON.stringify(detail))
      else setError('Login failed. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ───────── Marketing panel ───────── */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white"
        style={{
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.25), transparent 55%),' +
            'linear-gradient(135deg, #6D5BF7 0%, #9A6BF5 35%, #4FC4E8 70%, #4ADEA2 100%)',
          backgroundSize: '180% 180%',
          animation: 'aurora 22s ease infinite',
        }}
      >
        <BrandMark />

        <div className="relative z-10 max-w-md">
          <div className="eyebrow text-white/80 mb-5">Welcome back</div>
          <h1 className="display-lg !text-white mb-6 leading-[1.05]">
            Invest with clarity.<br/>Rest with confidence.
          </h1>
          <p className="text-white/85 text-lg leading-relaxed mb-10">
            Your risk-aware portfolio, rebalanced continuously — built on the
            science of modern portfolio theory.
          </p>

          <ul className="space-y-4 text-white/90">
            {[
              { icon: ShieldCheckIcon, title: 'Bank-grade security',  body: 'Encrypted at rest, 2FA throughout.' },
              { icon: BoltIcon,        title: 'Real-time execution', body: 'Paper-trade or live via Alpaca.' },
              { icon: SparklesIcon,    title: 'Personalized',        body: 'Every allocation matches your risk score.' },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-white/75">{body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-white/70">
          © {new Date().getFullYear()} Hedgewise. All rights reserved.
        </div>
      </aside>

      {/* ───────── Form side ───────── */}
      <section className="flex flex-col min-h-screen px-6 py-8 lg:px-16 lg:py-12">
        <div className="lg:hidden mb-10"><BrandMark /></div>

        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full mx-auto"
          >
            <div className="mb-10">
              <h2 className="heading-xl mb-2">Sign in</h2>
              <p className="body-md">
                New here?{' '}
                <Link href="/signup" className="text-primary-600 font-semibold hover:text-primary-700">
                  Create an account
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Username or email
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text" id="username" name="username"
                    value={formData.username} onChange={handleChange} required
                    className="input w-full pl-11"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-neutral-700">
                    Password
                  </label>
                  <button type="button" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'} id="password" name="password"
                    value={formData.password} onChange={handleChange} required
                    className="input w-full pl-11 pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-dark-800"
                  >
                    {showPassword
                      ? <EyeSlashIcon className="h-4 w-4 text-neutral-500" />
                      : <EyeIcon      className="h-4 w-4 text-neutral-500" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-gradient w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRightIcon className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <div className="hr-label my-8">or</div>

            <Link href="/signup" className="btn-secondary w-full text-center block">
              Create an account
            </Link>

            <p className="mt-10 text-center body-xs">
              By continuing, you agree to our{' '}
              <a href="#" className="underline hover:text-neutral-700">Terms</a> and{' '}
              <a href="#" className="underline hover:text-neutral-700">Privacy Policy</a>.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
