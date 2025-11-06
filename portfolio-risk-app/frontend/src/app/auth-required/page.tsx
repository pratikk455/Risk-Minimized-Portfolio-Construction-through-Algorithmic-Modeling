'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LockClosedIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function AuthRequiredPage() {
  const router = useRouter()
  const [riskProfile, setRiskProfile] = useState('')
  const [riskScore, setRiskScore] = useState('')

  useEffect(() => {
    // Check if there's a pending assessment
    const pendingAssessment = localStorage.getItem('pendingAssessment')
    const assessmentResults = localStorage.getItem('assessmentResults')

    if (!pendingAssessment || !assessmentResults) {
      // No pending assessment, redirect to home
      router.push('/')
      return
    }

    // Parse assessment results to show risk profile
    try {
      const results = JSON.parse(assessmentResults)
      setRiskProfile(results.riskProfile)
      setRiskScore(results.riskScore)
    } catch (error) {
      console.error('Error parsing assessment results:', error)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Success Icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-600" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Assessment Complete!
          </h1>
          <p className="text-xl text-gray-600">
            Your risk profile: <span className="font-bold text-primary-600">{riskProfile}</span>
          </p>
          {riskScore && (
            <p className="text-gray-500 mt-2">
              Risk Score: {riskScore}/10
            </p>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <LockClosedIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Save Your Results
            </h2>
            <p className="text-gray-600 text-lg">
              Create an account or sign in to:
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Save your risk assessment results</p>
                <p className="text-sm text-gray-600">Keep your personalized risk profile and answers secure</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Generate your optimized portfolio</p>
                <p className="text-sm text-gray-600">Get personalized ETF recommendations based on your risk profile</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Track your portfolio over time</p>
                <p className="text-sm text-gray-600">Monitor performance and rebalance as needed</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Retake assessments anytime</p>
                <p className="text-sm text-gray-600">Update your risk profile as your goals change</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/signup"
              className="w-full block"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <UserPlusIcon className="h-6 w-6" />
                Create Account
                <ArrowRightIcon className="h-5 w-5" />
              </motion.button>
            </Link>

            <Link
              href="/login"
              className="w-full block"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-white border-2 border-primary-600 text-primary-600 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
              >
                <LockClosedIcon className="h-6 w-6" />
                Sign In
                <ArrowRightIcon className="h-5 w-5" />
              </motion.button>
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Your assessment data is stored locally and will be saved to your account when you sign up or login.
              We take your privacy seriously and will never share your information.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
