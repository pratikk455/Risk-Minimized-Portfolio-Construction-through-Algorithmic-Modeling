'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircleIcon, ArrowLeftIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface AssessmentResults {
  answers: Record<string, number>
  riskScore: string
  riskProfile: string
  completedAt: string
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<AssessmentResults | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const savedResults = localStorage.getItem('assessmentResults')
    if (!savedResults) {
      router.push('/assessment')
      return
    }
    setResults(JSON.parse(savedResults))
  }, [router])

  const handleGeneratePortfolio = async () => {
    setIsGenerating(true)

    // Simulate portfolio generation with a 2.5 second delay
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Mark portfolio as generated in localStorage
    localStorage.setItem('portfolioGenerated', 'true')

    // Redirect to portfolio page
    router.push('/portfolio')
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  const getRiskColor = (profile: string) => {
    switch (profile) {
      case 'Very Conservative':
        return 'from-blue-500 to-blue-600'
      case 'Conservative':
        return 'from-green-500 to-green-600'
      case 'Moderate':
        return 'from-yellow-500 to-yellow-600'
      case 'Aggressive':
        return 'from-orange-500 to-orange-600'
      case 'Very Aggressive':
        return 'from-red-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getRecommendation = (profile: string) => {
    switch (profile) {
      case 'Very Conservative':
        return {
          title: 'Capital Preservation Focus',
          description: 'Your profile suggests a strong preference for protecting capital over growth. Consider bond-heavy portfolios with minimal equity exposure.',
          allocation: 'Recommended: 80% Bonds, 15% Stocks, 5% Cash'
        }
      case 'Conservative':
        return {
          title: 'Income & Stability',
          description: 'You prefer steady, predictable returns with limited downside risk. A balanced portfolio with emphasis on income-generating assets suits you.',
          allocation: 'Recommended: 60% Bonds, 30% Stocks, 10% Cash'
        }
      case 'Moderate':
        return {
          title: 'Balanced Growth',
          description: 'You seek a balance between growth and risk management. A diversified portfolio across multiple asset classes is ideal.',
          allocation: 'Recommended: 40% Bonds, 50% Stocks, 10% Alternatives'
        }
      case 'Aggressive':
        return {
          title: 'Growth Oriented',
          description: 'You are comfortable with volatility in pursuit of higher returns. Equity-focused portfolios with strategic alternatives fit your profile.',
          allocation: 'Recommended: 20% Bonds, 65% Stocks, 15% Alternatives'
        }
      case 'Very Aggressive':
        return {
          title: 'Maximum Growth Potential',
          description: 'You prioritize high returns and can handle significant volatility. Consider concentrated equity positions and alternative investments.',
          allocation: 'Recommended: 10% Bonds, 70% Stocks, 20% Alternatives'
        }
      default:
        return {
          title: 'Custom Strategy',
          description: 'Based on your unique profile, we recommend a tailored investment approach.',
          allocation: 'Recommended: Custom allocation'
        }
    }
  }

  const recommendation = getRecommendation(results.riskProfile)
  const riskColorGradient = getRiskColor(results.riskProfile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-primary-600 transition-colors group mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-600" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Assessment Complete!
          </h1>
          <p className="text-xl text-gray-600">
            Your comprehensive risk profile has been calculated
          </p>
        </motion.div>

        {/* Risk Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Risk Profile</h2>
            <div className={`inline-block px-8 py-4 bg-gradient-to-r ${riskColorGradient} text-white rounded-2xl shadow-lg`}>
              <div className="text-5xl font-bold mb-2">{results.riskProfile}</div>
              <div className="text-lg opacity-90">Risk Score: {results.riskScore}/10</div>
            </div>
          </div>

          {/* Score Visualization */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Very Conservative</span>
              <span>Very Aggressive</span>
            </div>
            <div className="relative h-4 bg-gradient-to-r from-blue-200 via-yellow-200 to-red-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(parseFloat(results.riskScore) / 10) * 100}%` }}
                transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
                className="absolute h-full bg-gradient-to-r from-primary-600 to-accent-600 rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <ChartBarIcon className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{recommendation.title}</h3>
                <p className="text-gray-700 mb-4">{recommendation.description}</p>
                <div className="bg-white rounded-lg p-4 border-2 border-primary-200">
                  <p className="font-semibold text-primary-700">{recommendation.allocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-primary-600">30</div>
              <div className="text-sm text-gray-600">Questions Answered</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-primary-600">6</div>
              <div className="text-sm text-gray-600">Sections Completed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-primary-600">{results.riskScore}</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-primary-600">100%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </div>

          {/* Completed Date */}
          <div className="text-center text-sm text-gray-500">
            Completed on {new Date(results.completedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/assessment"
            className="px-8 py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all text-center"
          >
            Retake Assessment
          </Link>
          <button
            onClick={handleGeneratePortfolio}
            disabled={isGenerating}
            className={`px-8 py-4 rounded-xl font-semibold transition-all text-center flex items-center justify-center gap-2 ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Portfolio...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                Generate My Portfolio
              </>
            )}
          </button>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl"
        >
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This risk assessment is for educational purposes only and does not constitute financial advice.
            Please consult with a qualified financial advisor before making investment decisions.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
