'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

const questions = [
  {
    id: 1,
    category: 'Risk Tolerance',
    question: 'How would you react if your portfolio dropped 20% in value over 3 months?',
    options: [
      { value: 1, label: 'Sell everything immediately', description: 'I cannot tolerate any losses' },
      { value: 2, label: 'Sell some positions', description: 'I would reduce my exposure' },
      { value: 3, label: 'Hold and wait', description: 'I would wait for recovery' },
      { value: 4, label: 'Buy more', description: 'I see it as a buying opportunity' },
    ],
  },
  {
    id: 2,
    category: 'Time Horizon',
    question: 'When do you expect to need the money from this investment?',
    options: [
      { value: 1, label: 'Less than 3 years', description: 'Short-term needs' },
      { value: 2, label: '3-7 years', description: 'Medium-term goals' },
      { value: 3, label: '7-15 years', description: 'Long-term objectives' },
      { value: 4, label: 'More than 15 years', description: 'Retirement or legacy' },
    ],
  },
  {
    id: 3,
    category: 'Investment Experience',
    question: 'How would you describe your investment experience?',
    options: [
      { value: 1, label: 'Beginner', description: 'New to investing' },
      { value: 2, label: 'Some experience', description: '1-3 years of investing' },
      { value: 3, label: 'Experienced', description: '3-10 years of active investing' },
      { value: 4, label: 'Expert', description: 'Professional or 10+ years' },
    ],
  },
  {
    id: 4,
    category: 'Investment Goals',
    question: 'What is your primary investment objective?',
    options: [
      { value: 1, label: 'Capital preservation', description: 'Protect what I have' },
      { value: 2, label: 'Steady income', description: 'Regular returns' },
      { value: 3, label: 'Balanced growth', description: 'Mix of growth and safety' },
      { value: 4, label: 'Maximum growth', description: 'Highest possible returns' },
    ],
  },
  {
    id: 5,
    category: 'Liquidity Needs',
    question: 'How important is it to have quick access to your invested funds?',
    options: [
      { value: 1, label: 'Very important', description: 'May need funds anytime' },
      { value: 2, label: 'Somewhat important', description: 'Occasional access needed' },
      { value: 3, label: 'Not very important', description: 'Can lock funds for years' },
      { value: 4, label: 'Not important at all', description: 'Long-term commitment' },
    ],
  },
]

export default function AssessmentPage() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value })

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateRiskProfile = () => {
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0)
    const avgScore = totalScore / questions.length

    if (avgScore <= 1.5) return 'Conservative'
    if (avgScore <= 2.5) return 'Moderate'
    if (avgScore <= 3.5) return 'Aggressive'
    return 'Very Aggressive'
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error('Please answer all questions')
      return
    }

    setIsSubmitting(true)
    try {
      const riskProfile = calculateRiskProfile()
      const response = await api.submitAssessment({
        answers,
        risk_profile: riskProfile,
        timestamp: new Date().toISOString(),
      })

      toast.success(`Assessment complete! Your risk profile: ${riskProfile}`)
      router.push('/portfolio')
    } catch (error) {
      toast.error('Failed to submit assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100
  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Assessment</h1>
          <p className="text-gray-600">Answer these questions to determine your ideal portfolio</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-primary-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {question.category}
              </span>
            </div>

            <h2 className="text-2xl font-semibold mb-6 text-gray-900">
              {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    answers[question.id] === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center
                      ${answers[question.id] === option.value ? 'border-primary-500' : 'border-gray-300'}">
                      {answers[question.id] === option.value && (
                        <div className="w-3 h-3 bg-primary-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentQuestion === questions.length - 1 && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(answers).length !== questions.length}
                className="btn-primary px-8 py-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Assessment'}
              </button>
            )}
          </div>
        </div>

        {Object.keys(answers).length === questions.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg"
          >
            <h3 className="font-semibold text-green-900 mb-2">
              Preliminary Risk Profile: {calculateRiskProfile()}
            </h3>
            <p className="text-green-700">
              Based on your responses, we'll create a personalized portfolio optimized for your risk tolerance.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}