'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface QuestionData {
  id: string
  section: string
  question: string
  description?: string
  scale: {
    min: { value: number; label: string }
    max: { value: number; label: string }
  }
}

const questions: QuestionData[] = [
  // Section 1: Personal & Financial Profile (6 questions)
  {
    id: 'age_group',
    section: '1. Personal & Financial Profile',
    question: 'Age Group',
    scale: {
      min: { value: 1, label: '70+' },
      max: { value: 10, label: 'Under 25' },
    },
  },
  {
    id: 'investment_horizon',
    section: '1. Personal & Financial Profile',
    question: 'Investment Horizon (years until goal or retirement)',
    scale: {
      min: { value: 1, label: '< 2 years' },
      max: { value: 10, label: '> 20 years' },
    },
  },
  {
    id: 'income_stability',
    section: '1. Personal & Financial Profile',
    question: 'Income Stability',
    scale: {
      min: { value: 1, label: 'Highly unstable or irregular' },
      max: { value: 10, label: 'Very stable or multiple sources' },
    },
  },
  {
    id: 'emergency_fund',
    section: '1. Personal & Financial Profile',
    question: 'Emergency Fund Availability',
    scale: {
      min: { value: 1, label: 'None' },
      max: { value: 10, label: '>2 years of expenses saved' },
    },
  },
  {
    id: 'dependents',
    section: '1. Personal & Financial Profile',
    question: 'Dependents or Major Obligations',
    scale: {
      min: { value: 1, label: 'Many dependents / high expenses' },
      max: { value: 10, label: 'None' },
    },
  },
  {
    id: 'income_for_investment',
    section: '1. Personal & Financial Profile',
    question: 'Proportion of Income Available for Investment',
    scale: {
      min: { value: 1, label: '<5%' },
      max: { value: 10, label: '>50%' },
    },
  },
  // Section 2: Risk Tolerance & Behavioral Tendencies (6 questions)
  {
    id: 'reaction_to_volatility',
    section: '2. Risk Tolerance & Behavioral Tendencies',
    question: 'Reaction to Volatility: If your portfolio drops 20% in a month',
    scale: {
      min: { value: 1, label: 'Sell everything immediately' },
      max: { value: 10, label: 'Add more to take advantage of lower prices' },
    },
  },
  {
    id: 'comfort_with_uncertainty',
    section: '2. Risk Tolerance & Behavioral Tendencies',
    question: "I'm comfortable not knowing my short-term returns if long-term prospects are strong",
    scale: {
      min: { value: 1, label: 'Strongly disagree' },
      max: { value: 10, label: 'Strongly agree' },
    },
  },
  {
    id: 'risk_reward_preference',
    section: '2. Risk Tolerance & Behavioral Tendencies',
    question: 'Risk–Reward Trade-off Preference',
    scale: {
      min: { value: 1, label: 'Prefer stable 3–5% annual returns' },
      max: { value: 10, label: 'Prefer uncertain 15–20% potential with high volatility' },
    },
  },
  {
    id: 'max_drawdown_tolerance',
    section: '2. Risk Tolerance & Behavioral Tendencies',
    question: 'Maximum Drawdown Tolerance (% loss you can endure temporarily)',
    scale: {
      min: { value: 1, label: '<5%' },
      max: { value: 10, label: '>40%' },
    },
  },
  {
    id: 'emotional_reaction_speed',
    section: '2. Risk Tolerance & Behavioral Tendencies',
    question: 'Speed of Emotional Reaction to Market Changes',
    scale: {
      min: { value: 1, label: 'Extremely reactive' },
      max: { value: 10, label: 'Very calm and patient' },
    },
  },
  {
    id: 'loss_aversion',
    section: '2. Risk Tolerance & Behavioral Tendencies',
    question: 'A $1,000 loss upsets me more than a $1,000 gain pleases me',
    scale: {
      min: { value: 1, label: 'Strongly agree (high loss aversion)' },
      max: { value: 10, label: 'Strongly disagree (low loss aversion)' },
    },
  },
  // Section 3: Investment Preferences & Style (6 questions)
  {
    id: 'primary_goal',
    section: '3. Investment Preferences & Style',
    question: 'Primary Investment Goal',
    scale: {
      min: { value: 1, label: 'Capital preservation' },
      max: { value: 10, label: 'Wealth maximization' },
    },
    description: '5 = Balanced growth',
  },
  {
    id: 'preferred_strategy',
    section: '3. Investment Preferences & Style',
    question: 'Preferred Investment Strategy',
    scale: {
      min: { value: 1, label: 'Passive index investing' },
      max: { value: 10, label: 'Active or alternative strategy investing' },
    },
  },
  {
    id: 'views_on_leverage',
    section: '3. Investment Preferences & Style',
    question: 'Views on Leverage (borrowing to invest)',
    scale: {
      min: { value: 1, label: 'Never acceptable' },
      max: { value: 10, label: 'Fully comfortable with leverage for higher returns' },
    },
  },
  {
    id: 'trading_frequency',
    section: '3. Investment Preferences & Style',
    question: 'Trading Frequency Preference',
    scale: {
      min: { value: 1, label: 'Buy-and-hold long-term (>5 years)' },
      max: { value: 10, label: 'Active trader or algorithmic trader' },
    },
  },
  {
    id: 'diversification_importance',
    section: '3. Investment Preferences & Style',
    question: 'Diversification Importance',
    scale: {
      min: { value: 1, label: 'Prefer few high-conviction bets' },
      max: { value: 10, label: 'Prefer wide diversification' },
    },
  },
  {
    id: 'algorithm_trust',
    section: '3. Investment Preferences & Style',
    question: 'I trust quantitative models more than human judgment for investment decisions',
    scale: {
      min: { value: 1, label: 'Strongly disagree' },
      max: { value: 10, label: 'Strongly agree' },
    },
  },
  // Section 4: Thematic Views (6 questions)
  {
    id: 'esg_importance',
    section: '4. Thematic Views (ESG, Crypto, Ethics)',
    question: 'ESG (Environmental, Social, Governance) Importance: How important is it that your investments align with ethical or sustainable values?',
    scale: {
      min: { value: 1, label: 'Not at all important' },
      max: { value: 10, label: 'Extremely important' },
    },
  },
  {
    id: 'esg_return_sacrifice',
    section: '4. Thematic Views (ESG, Crypto, Ethics)',
    question: 'Willingness to Sacrifice Return for ESG Values',
    scale: {
      min: { value: 1, label: 'Never sacrifice returns' },
      max: { value: 10, label: 'Fully willing to accept lower returns for ethical impact' },
    },
  },
  {
    id: 'crypto_view',
    section: '4. Thematic Views (ESG, Crypto, Ethics)',
    question: 'View on Cryptocurrency as an Asset Class',
    scale: {
      min: { value: 1, label: 'Completely speculative and risky' },
      max: { value: 10, label: 'Legitimate long-term store of value' },
    },
  },
  {
    id: 'crypto_comfort',
    section: '4. Thematic Views (ESG, Crypto, Ethics)',
    question: 'Comfort Level Holding Crypto in Portfolio',
    scale: {
      min: { value: 1, label: '0% allocation preferred' },
      max: { value: 10, label: '>20% allocation acceptable' },
    },
  },
  {
    id: 'alternative_assets_interest',
    section: '4. Thematic Views (ESG, Crypto, Ethics)',
    question: 'Interest in Alternative Assets (Art, NFTs, Private Equity, etc.)',
    scale: {
      min: { value: 1, label: 'No interest' },
      max: { value: 10, label: 'Very open and exploratory' },
    },
  },
  {
    id: 'tech_disruption_belief',
    section: '4. Thematic Views (ESG, Crypto, Ethics)',
    question: 'Belief in Technological Disruption (AI, blockchain, automation) as Investment Themes',
    scale: {
      min: { value: 1, label: 'Skeptical' },
      max: { value: 10, label: 'Very optimistic' },
    },
  },
  // Section 5: Financial Literacy & Confidence (4 questions)
  {
    id: 'financial_knowledge',
    section: '5. Financial Literacy & Confidence',
    question: 'Understanding of Investment Concepts',
    scale: {
      min: { value: 1, label: 'Beginner' },
      max: { value: 10, label: 'Expert (understands Sharpe ratio, VaR, etc.)' },
    },
  },
  {
    id: 'market_data_interpretation',
    section: '5. Financial Literacy & Confidence',
    question: 'Ability to Interpret Market Data',
    scale: {
      min: { value: 1, label: 'I rely on others' },
      max: { value: 10, label: 'I regularly analyze charts, correlations, metrics' },
    },
  },
  {
    id: 'decision_confidence',
    section: '5. Financial Literacy & Confidence',
    question: 'Confidence in Personal Decision-Making',
    scale: {
      min: { value: 1, label: 'Completely dependent on advice' },
      max: { value: 10, label: 'Fully self-reliant' },
    },
  },
  {
    id: 'fintech_usage',
    section: '5. Financial Literacy & Confidence',
    question: 'Use of Financial Technology Tools',
    scale: {
      min: { value: 1, label: 'None' },
      max: { value: 10, label: 'Heavy user (APIs, trading bots, backtesting tools)' },
    },
  },
  // Section 6: Time Preference & Future Orientation (2 questions)
  {
    id: 'immediate_vs_deferred',
    section: '6. Time Preference & Future Orientation',
    question: 'Preference for Immediate vs. Deferred Gains',
    scale: {
      min: { value: 1, label: 'Prefer small, certain short-term rewards' },
      max: { value: 10, label: 'Prefer large, uncertain long-term gains' },
    },
  },
  {
    id: 'retirement_priority',
    section: '6. Time Preference & Future Orientation',
    question: 'Retirement Planning Priority',
    scale: {
      min: { value: 1, label: 'Not planning / short-term focus' },
      max: { value: 10, label: 'Fully focused on long-term retirement planning' },
    },
  },
]

export default function AssessmentPage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const currentSection = currentQuestion.section

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [currentQuestion.id]: value })
  }

  const handleNext = () => {
    if (answers[currentQuestion.id] !== undefined) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    } else {
      toast.error('Please select a value before continuing')
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error('Please answer all questions')
      return
    }

    setIsSubmitting(true)
    try {
      // For now, just show results without backend call
      // Calculate a simple risk score
      const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0) / questions.length

      let riskProfile = 'Moderate'
      if (totalScore <= 3) riskProfile = 'Very Conservative'
      else if (totalScore <= 4.5) riskProfile = 'Conservative'
      else if (totalScore <= 6) riskProfile = 'Moderate'
      else if (totalScore <= 7.5) riskProfile = 'Aggressive'
      else riskProfile = 'Very Aggressive'

      // Store results in localStorage
      localStorage.setItem('assessmentResults', JSON.stringify({
        answers,
        riskScore: totalScore.toFixed(2),
        riskProfile,
        completedAt: new Date().toISOString()
      }))

      // Mark that assessment is pending (user needs to login/signup)
      localStorage.setItem('pendingAssessment', 'true')

      toast.success(`Assessment complete! Your risk profile: ${riskProfile}`)

      // Check if user is logged in
      const accessToken = localStorage.getItem('access_token')

      if (accessToken) {
        // User is logged in, go to results
        setTimeout(() => {
          router.push('/results')
        }, 1500)
      } else {
        // User not logged in, redirect to auth page
        toast.success('Please login or create an account to save your results', {
          duration: 3000
        })
        setTimeout(() => {
          router.push('/auth-required')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Assessment submission error:', error)
      toast.error('Failed to process assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSectionProgress = () => {
    const sections = [...new Set(questions.map(q => q.section))]
    return sections.map((section, idx) => {
      const sectionQuestions = questions.filter(q => q.section === section)
      const answeredInSection = sectionQuestions.filter(q => answers[q.id] !== undefined).length
      return {
        name: section,
        completed: answeredInSection === sectionQuestions.length,
        progress: (answeredInSection / sectionQuestions.length) * 100,
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Comprehensive Risk Assessment</h1>
          <p className="text-gray-600">Complete this 30-question assessment (~15 minutes) to determine your personalized investment profile</p>
        </div>

        {/* Section Progress Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Section Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {getSectionProgress().map((section, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-2 ${
                  section.completed
                    ? 'border-green-500 bg-green-50'
                    : section.progress > 0
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-xs font-medium text-gray-700 mb-1">{section.name}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        section.completed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${section.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">{Math.round(section.progress)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Overall Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-primary-600 to-accent-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Section Badge */}
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold">
                  {currentSection}
                </span>
              </div>

              {/* Question */}
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                {currentQuestion.question}
              </h2>
              {currentQuestion.description && (
                <p className="text-gray-600 mb-6 italic">{currentQuestion.description}</p>
              )}

              {/* Slider Scale */}
              <div className="mt-8 mb-6">
                <div className="flex justify-between text-sm text-gray-700 mb-4 px-2">
                  <span className="text-left max-w-[45%]">
                    <span className="font-medium">1:</span> {currentQuestion.scale.min.label}
                  </span>
                  <span className="text-right max-w-[45%]">
                    <span className="font-medium">10:</span> {currentQuestion.scale.max.label}
                  </span>
                </div>

                <div className="relative pt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={answers[currentQuestion.id] || 5}
                    onChange={(e) => handleAnswer(parseInt(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #fecaca 0%, #fef08a 50%, #bbf7d0 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span key={num} className="w-4 text-center">{num}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg text-xl font-bold">
                    Selected: {answers[currentQuestion.id] || '—'}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(answers).length !== questions.length}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Assessment ✓'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion.id] === undefined}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Summary at the end */}
        {currentQuestionIndex === questions.length - 1 && Object.keys(answers).length === questions.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl"
          >
            <h3 className="font-bold text-green-900 mb-2 text-lg">
              ✓ All Questions Answered!
            </h3>
            <p className="text-green-800">
              You've completed all 30 questions. Click "Complete Assessment" to see your personalized risk profile and portfolio recommendations.
            </p>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
}
