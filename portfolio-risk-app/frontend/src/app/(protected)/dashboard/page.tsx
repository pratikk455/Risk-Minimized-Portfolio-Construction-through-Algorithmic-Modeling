'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'
import {
  ChartBarIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const quickStats = [
  {
    id: 1,
    name: 'Portfolio Value',
    value: '$25,840',
    change: '+12.5%',
    trend: 'up',
    icon: ArrowTrendingUpIcon,
    color: 'text-green-600'
  },
  {
    id: 2,
    name: 'Risk Score',
    value: '7.2/10',
    change: 'Moderate',
    trend: 'stable',
    icon: ShieldCheckIcon,
    color: 'text-blue-600'
  },
  {
    id: 3,
    name: 'Diversification',
    value: '92%',
    change: 'Excellent',
    trend: 'up',
    icon: ChartBarIcon,
    color: 'text-purple-600'
  },
  {
    id: 4,
    name: 'Last Rebalance',
    value: '2 days ago',
    change: 'On track',
    trend: 'stable',
    icon: ClockIcon,
    color: 'text-orange-600'
  },
]

const features = [
  {
    icon: DocumentTextIcon,
    title: 'Risk Assessment',
    description: 'Complete your personalized risk questionnaire',
    href: '/assessment',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    progress: 0,
    status: 'start'
  },
  {
    icon: BriefcaseIcon,
    title: 'Your Portfolio',
    description: 'View and manage your investment portfolio',
    href: '/portfolio',
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'from-green-50 to-green-100',
    progress: 0,
    status: 'locked'
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics',
    description: 'Track performance and risk metrics',
    href: '/analytics',
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100',
    progress: 0,
    status: 'locked'
  },
]

const steps = [
  {
    id: 1,
    title: 'Complete Risk Assessment',
    description: 'Answer questions about your investment goals and risk tolerance',
    status: 'current',
    href: '/assessment'
  },
  {
    id: 2,
    title: 'Review Portfolio Recommendations',
    description: 'Get AI-powered portfolio allocations based on your profile',
    status: 'upcoming',
    href: '/portfolio'
  },
  {
    id: 3,
    title: 'Track Performance',
    description: 'Monitor your portfolio and receive rebalancing alerts',
    status: 'upcoming',
    href: '/analytics'
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchUser = async () => {
      try {
        const userData = await api.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Failed to fetch user', error)
        logout()
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [isAuthenticated, router, setUser, logout])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-semibold text-neutral-700">Loading your dashboard...</p>
          <p className="text-neutral-500 mt-2">Just a moment while we prepare everything</p>
        </motion.div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                PortfolioRisk
              </Link>
            </motion.div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full border border-primary-200">
                <StarIcon className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">
                  Welcome, {user?.full_name || user?.username}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 text-neutral-600 hover:text-red-600 font-medium transition-colors rounded-lg hover:bg-red-50"
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Your Portfolio Dashboard</h1>
          <p className="text-xl text-neutral-600">Track, optimize, and grow your investments with confidence</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${stat.color}`}>{stat.change}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color.replace('text-', 'from-').replace('-600', '-100')} ${stat.color.replace('text-', 'to-').replace('-600', '-200')}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.03 }}
              className="group relative"
            >
              <Link href={feature.href} className="block">
                <div className={`bg-gradient-to-br ${feature.bgGradient} p-8 rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 ${feature.status === 'locked' ? 'opacity-60' : ''}`}>
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                  <p className="text-neutral-700 leading-relaxed mb-4">{feature.description}</p>

                  {feature.status === 'locked' && (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <ShieldCheckIcon className="h-4 w-4" />
                      Complete risk assessment first
                    </div>
                  )}

                  {feature.status === 'start' && (
                    <div className="flex items-center gap-2 text-primary-600 font-semibold">
                      Start Here
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.div>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-gradient-to-br from-white to-neutral-50 rounded-3xl shadow-xl p-8 border border-neutral-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">Getting Started</h2>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0">
                  {step.status === 'current' ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg"
                    >
                      {step.id}
                    </motion.div>
                  ) : step.status === 'completed' ? (
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircleIcon className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-neutral-200 text-neutral-500 rounded-full flex items-center justify-center font-bold">
                      {step.id}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${step.status === 'current' ? 'text-primary-700' : 'text-neutral-700'}`}>
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 mb-3">{step.description}</p>

                  {step.status === 'current' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        Get Started
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </motion.div>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pro Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-100"
        >
          <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <StarIcon className="h-5 w-5" />
            Pro Tips for Success
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-700">
            <div className="flex items-start gap-2">
              <span className="text-primary-500">💡</span>
              <span>Complete your risk assessment honestly for the best recommendations</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500">📊</span>
              <span>Review your portfolio monthly, but avoid making frequent changes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500">⚖️</span>
              <span>Rebalance when asset allocations drift more than 5% from target</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500">🎯</span>
              <span>Stay focused on long-term goals and ignore short-term market noise</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}