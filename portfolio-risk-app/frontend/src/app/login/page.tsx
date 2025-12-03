'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LockClosedIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
        username: formData.username,
        password: formData.password
      })

      if (response.data.success) {
        // Store tokens in localStorage
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token)
          localStorage.setItem('refresh_token', response.data.refresh_token)
          localStorage.setItem('user_id', response.data.user_id.toString())
        }

        // Check if assessment was just completed
        const pendingAssessment = localStorage.getItem('pendingAssessment')

        if (pendingAssessment) {
          // User just completed assessment, redirect to results
          router.push('/results')
        } else {
          // Regular login, go to portfolio
          router.push('/portfolio')
        }
      } else if (response.data.requires_2fa) {
        // Handle 2FA (for future implementation)
        setError('2FA is enabled but not yet implemented in this UI')
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.data?.detail) {
        // Handle both string and object detail (validation errors)
        const detail = err.response.data.detail
        if (typeof detail === 'string') {
          setError(detail)
        } else if (Array.isArray(detail)) {
          // FastAPI validation errors are arrays of objects
          const errorMessages = detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
          setError(errorMessages)
        } else if (typeof detail === 'object') {
          setError(JSON.stringify(detail))
        } else {
          setError('Login failed. Please check your credentials and try again.')
        }
      } else {
        setError('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary-500/10 via-transparent to-transparent" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-accent-500/10 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30"
          >
            <LockClosedIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-neutral-400">Sign in to access your portfolio</p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Username/Email Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-300 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input w-full pl-11"
                  placeholder="Enter your username or email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input w-full pl-11 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all ${
                isLoading
                  ? 'bg-neutral-700 cursor-not-allowed'
                  : 'btn-gradient'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-dark-900 text-neutral-500">Don't have an account?</span>
              </div>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6">
            <Link
              href="/signup"
              className="btn-secondary w-full block text-center"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-neutral-500 hover:text-primary-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
