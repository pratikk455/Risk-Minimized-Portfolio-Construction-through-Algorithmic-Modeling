'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon,
  PhoneIcon, ArrowRightIcon, CheckCircleIcon, SparklesIcon, ShieldCheckIcon, BoltIcon,
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

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false }
    if (formData.password.length < 8)                    { setError('Password must be at least 8 characters long'); return false }
    if (!formData.email.includes('@'))                   { setError('Please enter a valid email address'); return false }
    if (formData.username.length < 3)                    { setError('Username must be at least 3 characters long'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true); setError('')

    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/register-step1`, {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        phone_number: formData.phone_number || null,
        password: formData.password,
      })

      if (response.data.success) {
        setSuccess(true)
        if (response.data.user_id) localStorage.setItem('pending_user_id', response.data.user_id.toString())
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError(response.data.message || 'Registration failed')
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (err.response?.data?.message) setError(err.response.data.message)
      else if (typeof detail === 'string') setError(detail)
      else if (Array.isArray(detail))     setError(detail.map((e: any) => e.msg || JSON.stringify(e)).join(', '))
      else if (typeof detail === 'object' && detail) setError(JSON.stringify(detail))
      else setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center card p-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-success-100"
          >
            <CheckCircleIcon className="h-10 w-10 text-success-600" />
          </motion.div>
          <h2 className="heading-xl mb-3">You're in</h2>
          <p className="body-md mb-6">Account created successfully. Redirecting to sign-in…</p>
          <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-primary-200 border-t-primary-600 mx-auto" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_1.05fr]">
      {/* ───────── Form side (first on desktop) ───────── */}
      <section className="flex flex-col min-h-screen px-6 py-8 lg:px-16 lg:py-12 order-2 lg:order-1">
        <div className="lg:hidden mb-10"><BrandMark /></div>

        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full mx-auto"
          >
            <div className="mb-8">
              <h2 className="heading-xl mb-2">Create your account</h2>
              <p className="body-md">
                Already have one?{' '}
                <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Full name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text" name="full_name" value={formData.full_name} onChange={handleChange} required
                    className="input w-full pl-11" placeholder="Ada Lovelace"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Username</label>
                  <input
                    type="text" name="username" value={formData.username} onChange={handleChange} required minLength={3}
                    className="input w-full" placeholder="ada_l"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Phone <span className="text-neutral-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange}
                      className="input w-full pl-11" placeholder="+1 555 0199"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Email</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="input w-full pl-11" placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange} required minLength={8}
                    className="input w-full pl-11 pr-12" placeholder="At least 8 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-dark-800">
                    {showPassword ? <EyeSlashIcon className="h-4 w-4 text-neutral-500" /> : <EyeIcon className="h-4 w-4 text-neutral-500" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Confirm password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange} required
                    className="input w-full pl-11 pr-12" placeholder="Repeat your password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-dark-800">
                    {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4 text-neutral-500" /> : <EyeIcon className="h-4 w-4 text-neutral-500" />}
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
                    Creating account…
                  </>
                ) : (
                  <>Create account <ArrowRightIcon className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <p className="mt-6 text-center body-xs">
              By creating an account, you agree to our{' '}
              <a href="#" className="underline hover:text-neutral-700">Terms</a> and{' '}
              <a href="#" className="underline hover:text-neutral-700">Privacy Policy</a>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ───────── Marketing panel ───────── */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white order-1 lg:order-2"
        style={{
          background:
            'radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.25), transparent 55%),' +
            'linear-gradient(135deg, #4ADEA2 0%, #4FC4E8 35%, #9A6BF5 70%, #6D5BF7 100%)',
          backgroundSize: '180% 180%',
          animation: 'aurora 22s ease infinite',
        }}
      >
        <div className="flex justify-end"><BrandMark /></div>

        <div className="relative z-10 max-w-md">
          <div className="eyebrow text-white/80 mb-5">Join Hedgewise</div>
          <h1 className="display-lg !text-white mb-6 leading-[1.05]">
            Start with a<br/>smarter portfolio.
          </h1>
          <p className="text-white/85 text-lg leading-relaxed mb-10">
            Answer a short questionnaire. Get a risk-matched allocation built
            on modern portfolio theory — ready to trade in minutes.
          </p>

          <ul className="space-y-4 text-white/90">
            {[
              { icon: SparklesIcon,    title: 'Tailored to you',      body: '30-question assessment, personalized mix.' },
              { icon: BoltIcon,        title: 'Paper-trade instantly', body: 'Test drive before going live.' },
              { icon: ShieldCheckIcon, title: 'Zero lock-in',         body: 'Cancel or withdraw any time.' },
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

        <div className="relative z-10 text-sm text-white/70 text-right">
          © {new Date().getFullYear()} Hedgewise.
        </div>
      </aside>
    </div>
  )
}
