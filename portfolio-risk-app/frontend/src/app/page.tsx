'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRightIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

const stats = [
  { id: 1, name: 'Portfolio Optimization', value: '99.8%', description: 'Accuracy' },
  { id: 2, name: 'Risk Reduction', value: '45%', description: 'vs S&P 500' },
  { id: 3, name: 'User Satisfaction', value: '4.9/5', description: 'Rating' },
  { id: 4, name: 'Rebalancing Speed', value: '<1s', description: 'Real-time' },
]

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Risk-First Approach',
    description: 'Our algorithms prioritize risk minimization over returns chasing, protecting your capital in volatile markets.',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    icon: ChartBarIcon,
    title: 'Advanced Analytics',
    description: 'Hierarchical Risk Parity, Markowitz optimization, and real-time correlation analysis at your fingertips.',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    icon: AcademicCapIcon,
    title: 'Learn As You Invest',
    description: 'Interactive educational content helps you understand the theory behind your portfolio construction.',
    gradient: 'from-green-400 to-green-600',
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Investment Advisor',
    content: 'This platform democratized institutional-grade portfolio management for my clients.',
    avatar: '👩‍💼',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Quantitative Analyst',
    content: 'The HRP algorithm implementation is outstanding. Finally, true diversification.',
    avatar: '👨‍💻',
  },
  {
    name: 'Emily Watson',
    role: 'Retail Investor',
    content: 'I went from confused about investing to confidently managing a diversified portfolio.',
    avatar: '👩‍🎓',
  },
]

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-400/20 to-primary-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-primary-300/10 to-accent-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Mouse Follower */}
      <div
        className="fixed w-6 h-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full pointer-events-none z-50 opacity-20 blur-sm transition-all duration-100"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
      ></div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 flex justify-between items-center px-8 py-6 backdrop-blur-sm bg-white/70 border-b border-white/20"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"
        >
          PortfolioRisk
        </motion.div>
        <div className="flex gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/login" className="px-6 py-3 text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Login
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/register" className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              Get Started
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full text-primary-700 font-medium mb-8 border border-primary-200"
            >
              <StarIcon className="h-5 w-5" />
              Institutional-Grade Portfolio Management
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 leading-tight"
            >
              Smarter Investing
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                Made Simple
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-xl text-neutral-600 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Advanced risk minimization strategies powered by cutting-edge algorithms.
              Build diversified portfolios that outperform traditional concentration-heavy indices.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
                >
                  Start Risk Assessment
                  <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white/80 backdrop-blur-sm text-neutral-700 text-lg font-semibold rounded-xl border border-neutral-200 hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <ChartBarIcon className="h-6 w-6" />
                  View Live Demo
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-neutral-600 text-sm font-medium">{stat.description}</div>
                <div className="text-neutral-500 text-xs">{stat.name}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-br from-white/80 to-primary-50/80 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-bold text-neutral-900 mb-6">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Built by quants, for everyone. Experience the power of institutional-grade portfolio management.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white to-neutral-50 rounded-3xl shadow-2xl p-12 border border-neutral-100"
            >
              <h2 className="text-4xl font-bold text-center mb-12 text-neutral-900">
                The S&P 500 Concentration Problem
              </h2>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl border border-red-200">
                    <h3 className="text-2xl font-bold mb-6 text-red-800 flex items-center gap-3">
                      <ArrowTrendingUpIcon className="h-8 w-8" />
                      Traditional Portfolios Risk
                    </h3>
                    <ul className="space-y-4 text-red-700">
                      <li className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <span>Top 10 stocks represent over 30% of total index</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-2xl">📱</span>
                        <span>Tech sector dominance creates systemic vulnerability</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-2xl">📉</span>
                        <span>Historical crashes show danger of concentration</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200">
                    <h3 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-3">
                      <ShieldCheckIcon className="h-8 w-8" />
                      Our Solution
                    </h3>
                    <ul className="space-y-4 text-green-700">
                      <li className="flex items-start gap-3">
                        <span className="text-2xl">🎯</span>
                        <span>True diversification across uncorrelated assets</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-2xl">⚖️</span>
                        <span>Dynamic rebalancing based on risk metrics</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-2xl">🛡️</span>
                        <span>Protection against black swan events</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gradient-to-br from-primary-50/50 to-accent-50/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-neutral-900 mb-6">
                Trusted by Professionals
              </h2>
              <p className="text-xl text-neutral-600">
                See what finance professionals are saying about our platform
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/40"
                >
                  <div className="text-4xl mb-4">{testimonial.avatar}</div>
                  <p className="text-neutral-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                    <div className="text-neutral-500 text-sm">{testimonial.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-4xl lg:text-5xl font-bold mb-6"
                >
                  Ready to Transform Your Portfolio?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-xl mb-8 opacity-90 max-w-2xl mx-auto"
                >
                  Join thousands of investors who've discovered the power of risk-first portfolio management.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-3 px-12 py-5 bg-white text-primary-700 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
                  >
                    <BanknotesIcon className="h-6 w-6" />
                    Start Your Journey
                    <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent mb-4">
              PortfolioRisk
            </div>
            <p className="text-neutral-400 mb-6">
              Democratizing institutional-grade portfolio management for everyone.
            </p>
            <p className="text-neutral-500 text-sm">
              © 2024 PortfolioRisk. Built with ❤️ for better investing.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}