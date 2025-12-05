'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Doughnut } from 'react-chartjs-2'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import {
  ChartBarIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  LightBulbIcon,
  PlayIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ETFAllocation {
  ticker: string
  name: string
  category: string
  weight: number
  expected_return: number
  volatility: number
  risk_level: number
}

interface PortfolioMetrics {
  expected_return: number
  expected_volatility: number
  sharpe_ratio: number
  category_breakdown: {
    bonds: number
    stocks: number
    alternatives: number
  }
}

interface PortfolioData {
  id?: number
  risk_profile: string
  risk_score: number
  allocations: ETFAllocation[]
  metrics: PortfolioMetrics
  ai_recommendation?: string
  created_at?: string
}

// Color utilities for dark theme
const getRiskLevelColorDark = (level: number) => {
  if (level <= 3) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (level <= 6) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

const getCategoryColorDark = (category: string) => {
  switch (category) {
    case 'bonds':
      return 'bg-blue-500/20 text-blue-400'
    case 'stocks':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'alternatives':
      return 'bg-purple-500/20 text-purple-400'
    default:
      return 'bg-neutral-500/20 text-neutral-400'
  }
}

// Educational content for tooltips
const educationalContent: Record<string, { title: string; simple: string; example: string; emoji: string }> = {
  expectedReturn: {
    title: "Expected Return",
    simple: "This is how much money your investment might grow in a year. Think of it like interest on a savings account, but potentially higher (and riskier)!",
    example: "If you invest $1,000 and the expected return is 8%, you might have $1,080 after one year.",
    emoji: "📈"
  },
  volatility: {
    title: "Volatility (Risk)",
    simple: "This shows how much your investment value might bounce up and down. Higher volatility = more of a rollercoaster ride for your money!",
    example: "A volatility of 15% means your investment could swing up or down by about 15% in a typical year.",
    emoji: "🎢"
  },
  sharpeRatio: {
    title: "Sharpe Ratio",
    simple: "This is like a 'bang for your buck' score. It tells you how much return you're getting for the risk you're taking. Higher is better!",
    example: "A Sharpe ratio of 1.5 is good - you're getting nice returns without crazy risk. Below 1 means you might want more reward for the risk.",
    emoji: "⚖️"
  },
  riskProfile: {
    title: "Risk Profile",
    simple: "This is your personal comfort level with investment ups and downs. It's based on your answers in the assessment.",
    example: "Conservative = prefer stability. Aggressive = okay with big swings for potentially bigger gains.",
    emoji: "🎯"
  },
  etf: {
    title: "ETF (Exchange-Traded Fund)",
    simple: "An ETF is like a basket of investments you can buy with one purchase. Instead of buying one company's stock, you buy a little piece of many!",
    example: "VOO holds 500 of the biggest US companies. One share = tiny ownership in Apple, Google, Amazon, and 497 more!",
    emoji: "🧺"
  },
  bonds: {
    title: "Bonds",
    simple: "Bonds are like IOUs from companies or governments. You lend them money, they pay you back with interest. Usually safer but lower returns than stocks.",
    example: "Government bonds are super safe - the US government has never failed to pay back. Corporate bonds pay more but are slightly riskier.",
    emoji: "🏦"
  },
  stocks: {
    title: "Stocks",
    simple: "When you buy a stock, you own a tiny piece of that company! If the company does well, your stock becomes more valuable.",
    example: "If you own Apple stock and they sell tons of iPhones, your investment grows. But if sales drop, so might your investment.",
    emoji: "📊"
  },
  alternatives: {
    title: "Alternative Investments",
    simple: "These are investments outside of regular stocks and bonds - like gold, real estate, or even cryptocurrency. They can help diversify your portfolio.",
    example: "Gold often goes up when stocks go down, so having some can protect your portfolio during market crashes.",
    emoji: "💎"
  },
  allocation: {
    title: "Allocation",
    simple: "This is what percentage of your money goes into each investment. It's like dividing a pizza - how big is each slice?",
    example: "If VOO has 25% allocation and you invest $1,000 total, you'd put $250 into VOO.",
    emoji: "🍕"
  },
  diversification: {
    title: "Diversification",
    simple: "Don't put all your eggs in one basket! By spreading money across different investments, if one fails, others might save you.",
    example: "If you only owned airline stocks in 2020... ouch. But if you also had tech stocks, they balanced out the losses!",
    emoji: "🥚"
  },
  riskLevel: {
    title: "Risk Level",
    simple: "Each investment has a risk rating from 1-10. Lower numbers = steadier but smaller gains. Higher numbers = potential for bigger gains but also bigger losses.",
    example: "A bond fund might be risk level 2 (steady). A crypto ETF might be risk level 9 (wild ride!).",
    emoji: "🌡️"
  }
}

// Tooltip component with hover explanation - smart positioning to stay within viewport
const EducationalTooltip = ({
  content,
  children
}: {
  content: keyof typeof educationalContent
  children: React.ReactNode
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)
  const info = educationalContent[content]

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = 320 // w-80 = 20rem = 320px
    const tooltipHeight = 200 // approximate height

    // Check available space in each direction
    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - rect.bottom
    const spaceLeft = rect.left
    const spaceRight = viewportWidth - rect.right

    // Prefer top, but use other positions if not enough space
    if (spaceAbove >= tooltipHeight + 20) {
      setPosition('top')
    } else if (spaceBelow >= tooltipHeight + 20) {
      setPosition('bottom')
    } else if (spaceRight >= tooltipWidth + 20) {
      setPosition('right')
    } else if (spaceLeft >= tooltipWidth + 20) {
      setPosition('left')
    } else {
      // Default to bottom if nothing else works
      setPosition('bottom')
    }
  }, [])

  const handleMouseEnter = () => {
    calculatePosition()
    setIsVisible(true)
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-dark-800'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-b-dark-800'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-l-dark-800'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-r-dark-800'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-dark-800'
    }
  }

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-[9999] w-80 max-w-[calc(100vw-2rem)] pointer-events-none ${getPositionClasses()}`}
          >
            <div className="bg-dark-800 border border-neutral-700 text-white rounded-xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{info.emoji}</span>
                <h4 className="font-bold text-lg">{info.title}</h4>
              </div>
              <p className="text-neutral-300 text-sm mb-3">{info.simple}</p>
              <div className="bg-dark-900 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <LightBulbIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-neutral-400 text-xs">{info.example}</p>
                </div>
              </div>
              {/* Arrow */}
              <div className={`absolute ${getArrowClasses()}`}></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PortfolioPage() {
  const router = useRouter()
  const [hasPortfolio, setHasPortfolio] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [showTour, setShowTour] = useState(false)

  // Start the intro.js tour
  const startTour = useCallback(async () => {
    // Dynamically import intro.js to avoid SSR issues
    const introJs = (await import('intro.js')).default
    await import('intro.js/introjs.css')

    const intro = introJs()

    intro.setOptions({
      steps: [
        {
          title: '👋 Welcome to Your Portfolio!',
          intro: "Let's take a quick tour to understand your personalized investment portfolio. Don't worry - we'll explain everything in simple terms!"
        },
        {
          element: '#risk-profile-card',
          title: '🎯 Your Risk Profile',
          intro: "This is YOUR personal investment style based on your quiz answers. It determines how we balance safety vs. growth potential in your portfolio."
        },
        {
          element: '#expected-return-display',
          title: '📈 Expected Annual Return',
          intro: "This percentage shows how much your investment might grow in a year. Remember: it's an estimate, not a guarantee! Think of it as an educated guess based on historical data."
        },
        {
          element: '#ai-recommendation',
          title: '🤖 AI Insights',
          intro: "Our AI assistant (powered by Google's Gemini) analyzes your profile and gives you personalized tips. It's like having a friendly financial advisor!"
        },
        {
          element: '#portfolio-chart',
          title: '🍕 Portfolio Pie Chart',
          intro: "This shows how your money is divided among different investments. Each slice is an ETF - a basket of stocks or bonds you can buy as one package. Bigger slice = more of your money goes there!"
        },
        {
          element: '#asset-breakdown',
          title: '📊 Asset Class Breakdown',
          intro: "Your investments are split into 3 main types:\n\n🏦 Bonds: Safer, steady returns (like lending money to the government)\n\n📈 Stocks: Higher potential returns but more ups and downs\n\n💎 Alternatives: Things like gold or real estate for extra diversification"
        },
        {
          element: '#sharpe-ratio-display',
          title: '⚖️ The Sharpe Ratio',
          intro: "This is the 'bang for your buck' score! It measures how much return you get for the risk you take.\n\n• Above 1.0 = Good\n• Above 1.5 = Great\n• Above 2.0 = Excellent\n\nHigher is better!"
        },
        {
          element: '#metrics-cards',
          title: '📋 Key Metrics',
          intro: "These cards show important numbers about your portfolio. Hover over any metric to learn more! We've added helpful explanations everywhere."
        },
        {
          element: '#holdings-table',
          title: '📝 Your ETF Holdings',
          intro: "Here's the detailed list of every ETF in your portfolio. Each row shows:\n\n• Ticker: The short code (like VOO)\n• Name: What the ETF actually is\n• Weight: How much of your money goes here\n• Expected Return & Volatility: Performance predictions\n\nHover over column headers to learn more!"
        },
        {
          element: '#next-steps',
          title: "🚀 What's Next?",
          intro: "Ready to invest for real? Follow these steps to turn your portfolio from a plan into reality. Remember: this is educational - consider talking to a financial advisor before investing real money!"
        },
        {
          title: '🎓 You Did It!',
          intro: "You now understand the basics of portfolio investing! Remember:\n\n✅ Diversification reduces risk\n✅ Higher returns = higher risk\n✅ The Sharpe Ratio measures efficiency\n✅ ETFs make investing simple\n\nHover over any element with a ❓ to learn more. Happy investing!"
        }
      ],
      showProgress: true,
      showBullets: true,
      showStepNumbers: false,
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: "Let's Go! ✓",
      skipLabel: '×',
      tooltipClass: 'custom-introjs-tooltip',
      highlightClass: 'custom-introjs-highlight',
      exitOnOverlayClick: false,
      disableInteraction: false,
      scrollToElement: true,
      scrollPadding: 150,
      autoPosition: true,
      positionPrecedence: ['bottom', 'top', 'right', 'left']
    })

    intro.start()
  }, [])

  // Check if user has seen the tour before
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('portfolioTourCompleted')
    if (!hasSeenTour && hasPortfolio && portfolio) {
      setShowTour(true)
    }
  }, [hasPortfolio, portfolio])

  // Auto-start tour for first-time users
  useEffect(() => {
    if (showTour && portfolio) {
      const timer = setTimeout(() => {
        startTour()
        localStorage.setItem('portfolioTourCompleted', 'true')
        setShowTour(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showTour, portfolio, startTour])

  useEffect(() => {
    // Check if portfolio has been generated
    const portfolioGenerated = localStorage.getItem('portfolioGenerated')
    const portfolioDataStr = localStorage.getItem('portfolioData')

    if (portfolioGenerated === 'true' && portfolioDataStr) {
      try {
        const portfolioData = JSON.parse(portfolioDataStr)
        setPortfolio(portfolioData)
        setHasPortfolio(true)
      } catch (e) {
        console.error('Failed to parse portfolio data:', e)
        setHasPortfolio(false)
      }
    } else {
      // Try to fetch from API
      fetchActivePortfolio()
    }
    setIsLoading(false)
  }, [])

  const fetchActivePortfolio = async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      return
    }

    try {
      const response = await axios.get(`${API_URL}/api/portfolio/active`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.data) {
        setPortfolio(response.data)
        setHasPortfolio(true)
        localStorage.setItem('portfolioData', JSON.stringify(response.data))
        localStorage.setItem('portfolioGenerated', 'true')
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    }
  }

  // Color palette for chart
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(34, 197, 94, 0.8)',    // Green
    'rgba(16, 185, 129, 0.8)',   // Emerald
    'rgba(251, 146, 60, 0.8)',   // Orange
    'rgba(249, 115, 22, 0.8)',   // Dark Orange
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(219, 39, 119, 0.8)',   // Rose
    'rgba(168, 85, 247, 0.8)',   // Violet
    'rgba(20, 184, 166, 0.8)',   // Teal
    'rgba(234, 179, 8, 0.8)',    // Yellow
    'rgba(132, 204, 22, 0.8)',   // Lime
    'rgba(244, 63, 94, 0.8)',    // Red
  ]

  const getRiskLevelLabel = (level: number) => {
    if (level <= 3) return 'Low'
    if (level <= 6) return 'Medium'
    return 'High'
  }

  const getRiskLevelColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-700 border-green-300'
    if (level <= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bonds':
        return 'bg-blue-100 text-blue-700'
      case 'stocks':
        return 'bg-green-100 text-green-700'
      case 'alternatives':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary-500/20 border-t-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (!hasPortfolio || !portfolio) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto px-4 text-center"
        >
          <div className="card p-12">
            <ChartBarIcon className="h-24 w-24 text-neutral-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">No Portfolio Yet</h1>
            <p className="text-neutral-400 mb-8">
              You haven't generated your optimized portfolio yet. Complete the risk assessment first,
              then generate your personalized investment portfolio.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/assessment')}
                className="btn-gradient"
              >
                Take Assessment
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary"
              >
                Go Home
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const donutData = {
    labels: portfolio.allocations.map(h => `${h.ticker} (${h.weight.toFixed(1)}%)`),
    datasets: [
      {
        data: portfolio.allocations.map(h => h.weight),
        backgroundColor: colors.slice(0, portfolio.allocations.length),
        borderColor: colors.slice(0, portfolio.allocations.length).map(c => c.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  }

  const donutOptions = {
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const holding = portfolio.allocations[context.dataIndex]
            return [
              `${holding.ticker}: ${holding.weight.toFixed(1)}%`,
              `${holding.name}`,
              `Category: ${holding.category}`,
            ]
          },
        },
      },
    },
    maintainAspectRatio: false,
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Custom Intro.js styles for dark theme */}
      <style jsx global>{`
        .introjs-tooltip {
          max-width: min(420px, calc(100vw - 40px)) !important;
          font-family: inherit !important;
          border-radius: 1rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          border: 1px solid rgba(63, 63, 70, 0.5) !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #1a1a24 !important;
          /* Prevent going outside viewport */
          max-height: calc(100vh - 100px) !important;
          overflow-y: auto !important;
        }
        /* Ensure tooltip stays within viewport boundaries */
        .introjs-tooltipReferenceLayer {
          max-width: 100vw !important;
          overflow: visible !important;
        }
        .introjs-floating {
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          margin-left: 0 !important;
          margin-top: 0 !important;
        }
        .introjs-tooltip-header {
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%) !important;
          padding: 1rem 1.25rem !important;
          padding-right: 2.5rem !important;
          border-bottom: none !important;
        }
        .introjs-tooltip-title {
          font-size: 1.1rem !important;
          font-weight: 700 !important;
          color: white !important;
          margin: 0 !important;
        }
        .introjs-tooltiptext {
          font-size: 0.95rem !important;
          line-height: 1.7 !important;
          color: #a1a1aa !important;
          white-space: pre-line !important;
          padding: 1.25rem !important;
          background: #1a1a24 !important;
        }
        .introjs-tooltipbuttons {
          padding: 0.75rem 1.25rem 1.25rem !important;
          border-top: 1px solid #3f3f46 !important;
          background: #0d0d14 !important;
        }
        .introjs-button {
          border-radius: 0.75rem !important;
          padding: 0.6rem 1.25rem !important;
          font-weight: 600 !important;
          text-shadow: none !important;
          font-size: 0.875rem !important;
          transition: all 0.2s ease !important;
        }
        .introjs-button:hover {
          transform: translateY(-1px) !important;
        }
        .introjs-nextbutton {
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%) !important;
          border: none !important;
          color: white !important;
          box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4) !important;
        }
        .introjs-nextbutton:hover {
          box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.5) !important;
        }
        .introjs-prevbutton {
          background: #2d2d3a !important;
          border: 1px solid #3f3f46 !important;
          color: #a1a1aa !important;
          margin-right: 0.5rem !important;
        }
        .introjs-prevbutton:hover {
          border-color: #6366f1 !important;
          color: white !important;
        }
        .introjs-skipbutton {
          position: absolute !important;
          top: 0.75rem !important;
          right: 0.75rem !important;
          width: 28px !important;
          height: 28px !important;
          padding: 0 !important;
          font-size: 1.25rem !important;
          line-height: 28px !important;
          text-align: center !important;
          color: rgba(255, 255, 255, 0.8) !important;
          background: rgba(255, 255, 255, 0.15) !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }
        .introjs-skipbutton:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          color: white !important;
        }
        .introjs-helperLayer {
          border-radius: 1rem !important;
          box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.8), 0 0 0 4px rgba(99, 102, 241, 0.5) !important;
        }
        .introjs-arrow {
          border: none !important;
        }
        .introjs-arrow.top {
          border-bottom: 10px solid #6366f1 !important;
        }
        .introjs-arrow.bottom {
          border-top: 10px solid #1a1a24 !important;
        }
        .introjs-arrow.left {
          border-right: 10px solid #6366f1 !important;
        }
        .introjs-arrow.right {
          border-left: 10px solid #6366f1 !important;
        }
        .introjs-progress {
          background-color: rgba(255, 255, 255, 0.2) !important;
          height: 4px !important;
          margin: 0.5rem 1.25rem 0 !important;
          border-radius: 2px !important;
        }
        .introjs-progressbar {
          background: white !important;
          border-radius: 2px !important;
        }
        .introjs-bullets {
          padding: 0.5rem 0 0 !important;
        }
        .introjs-bullets ul li a {
          width: 8px !important;
          height: 8px !important;
          background: #3f3f46 !important;
        }
        .introjs-bullets ul li a.active {
          background: #6366f1 !important;
          width: 20px !important;
          border-radius: 4px !important;
        }
        .introjs-donebutton {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          border: none !important;
          color: white !important;
          box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4) !important;
        }
        .introjs-donebutton:hover {
          box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.5) !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header with Tour Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Your Optimized Portfolio</h1>
            <p className="text-neutral-400">Personalized allocation based on your risk profile and Sharpe ratio optimization</p>
          </div>
          <button
            onClick={() => {
              startTour()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all"
          >
            <PlayIcon className="h-5 w-5" />
            Take the Tour
            <AcademicCapIcon className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          id="risk-profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-2xl p-8 text-white mb-8 shadow-xl shadow-primary-500/20"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <EducationalTooltip content="riskProfile">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  Risk Profile: {portfolio.risk_profile}
                  <QuestionMarkCircleIcon className="h-6 w-6 opacity-70 hover:opacity-100" />
                </h2>
              </EducationalTooltip>
              <p className="text-lg opacity-90">Risk Score: {portfolio.risk_score}/10</p>
              <EducationalTooltip content="sharpeRatio">
                <p className="opacity-80 mt-2 flex items-center gap-1 cursor-help">
                  Optimized for risk-adjusted returns using Sharpe ratio
                  <QuestionMarkCircleIcon className="h-4 w-4 opacity-70 hover:opacity-100" />
                </p>
              </EducationalTooltip>
            </div>
            <div id="expected-return-display" className="text-center md:text-right">
              <EducationalTooltip content="expectedReturn">
                <div className="cursor-help">
                  <div className="text-5xl font-bold mb-2 flex items-center justify-center md:justify-end gap-2">
                    {portfolio.metrics.expected_return.toFixed(1)}%
                    <QuestionMarkCircleIcon className="h-7 w-7 opacity-70 hover:opacity-100" />
                  </div>
                  <div className="text-lg opacity-90">Expected Annual Return</div>
                </div>
              </EducationalTooltip>
              <EducationalTooltip content="etf">
                <div className="mt-3 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm cursor-help">
                  <div className="text-sm opacity-80 flex items-center justify-center gap-1">
                    Total Holdings
                    <QuestionMarkCircleIcon className="h-4 w-4 opacity-70 hover:opacity-100" />
                  </div>
                  <div className="text-2xl font-bold">{portfolio.allocations.length} ETFs</div>
                </div>
              </EducationalTooltip>
            </div>
          </div>
        </motion.div>

        {/* AI Recommendation */}
        {portfolio.ai_recommendation && (
          <motion.div
            id="ai-recommendation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-6 mb-8 border-l-4 border-l-primary-500"
          >
            <div className="flex items-start gap-3">
              <SparklesIcon className="h-6 w-6 text-primary-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  AI Portfolio Insights
                  <span className="text-xs font-normal bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full">Powered by Gemini</span>
                </h3>
                <p className="text-neutral-300 whitespace-pre-line">{portfolio.ai_recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Chart and Asset Class Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Donut Chart */}
          <motion.div
            id="portfolio-chart"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <EducationalTooltip content="allocation">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2 cursor-help text-white">
                <ChartBarIcon className="h-6 w-6 text-primary-400" />
                Portfolio Allocation
                <QuestionMarkCircleIcon className="h-5 w-5 text-neutral-500 hover:text-primary-400" />
              </h3>
            </EducationalTooltip>
            <div className="h-96">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </motion.div>

          {/* Asset Class Summary */}
          <motion.div
            id="asset-breakdown"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <EducationalTooltip content="diversification">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2 cursor-help text-white">
                Asset Class Breakdown
                <QuestionMarkCircleIcon className="h-5 w-5 text-neutral-500 hover:text-primary-400" />
              </h3>
            </EducationalTooltip>
            <div className="space-y-6">
              <div>
                <EducationalTooltip content="bonds">
                  <div className="flex justify-between mb-2 cursor-help">
                    <span className="font-medium text-neutral-300 flex items-center gap-1">
                      🏦 Bonds
                      <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500 hover:text-blue-400" />
                    </span>
                    <span className="font-bold text-blue-400">{portfolio.metrics.category_breakdown?.bonds?.toFixed(1) || 0}%</span>
                  </div>
                </EducationalTooltip>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolio.metrics.category_breakdown?.bonds || 0}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  />
                </div>
              </div>

              <div>
                <EducationalTooltip content="stocks">
                  <div className="flex justify-between mb-2 cursor-help">
                    <span className="font-medium text-neutral-300 flex items-center gap-1">
                      📈 Stocks
                      <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500 hover:text-emerald-400" />
                    </span>
                    <span className="font-bold text-emerald-400">{portfolio.metrics.category_breakdown?.stocks?.toFixed(1) || 0}%</span>
                  </div>
                </EducationalTooltip>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolio.metrics.category_breakdown?.stocks || 0}%` }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  />
                </div>
              </div>

              <div>
                <EducationalTooltip content="alternatives">
                  <div className="flex justify-between mb-2 cursor-help">
                    <span className="font-medium text-neutral-300 flex items-center gap-1">
                      💎 Alternatives
                      <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500 hover:text-purple-400" />
                    </span>
                    <span className="font-bold text-purple-400">{portfolio.metrics.category_breakdown?.alternatives?.toFixed(1) || 0}%</span>
                  </div>
                </EducationalTooltip>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolio.metrics.category_breakdown?.alternatives || 0}%` }}
                    transition={{ delay: 0.7, duration: 1 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                  />
                </div>
              </div>

              {/* Sharpe Ratio Score */}
              <div id="sharpe-ratio-display" className="mt-8 pt-6 border-t border-neutral-800">
                <EducationalTooltip content="sharpeRatio">
                  <div className="text-center cursor-help">
                    <div className="text-sm text-neutral-400 mb-2 flex items-center justify-center gap-1">
                      Sharpe Ratio
                      <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500 hover:text-primary-400" />
                    </div>
                    <div className="text-4xl font-bold text-primary-400">{portfolio.metrics.sharpe_ratio.toFixed(2)}</div>
                    <p className="text-sm text-neutral-500 mt-2">
                      {portfolio.metrics.sharpe_ratio >= 2 ? '🌟 Excellent!' :
                       portfolio.metrics.sharpe_ratio >= 1.5 ? '✨ Great!' :
                       portfolio.metrics.sharpe_ratio >= 1 ? '👍 Good' : '📊 Moderate'}
                    </p>
                  </div>
                </EducationalTooltip>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Portfolio Metrics */}
        <motion.div
          id="metrics-cards"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <EducationalTooltip content="expectedReturn">
            <div className="stat-card cursor-help hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="stat-label">Expected Return</div>
                <QuestionMarkCircleIcon className="h-5 w-5 text-neutral-500 hover:text-emerald-400" />
              </div>
              <div className="stat-value text-emerald-400">{portfolio.metrics.expected_return.toFixed(1)}%</div>
              <div className="text-xs text-neutral-500 mt-1">📈 Annualized</div>
            </div>
          </EducationalTooltip>

          <EducationalTooltip content="volatility">
            <div className="stat-card cursor-help hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="stat-label">Volatility (Risk)</div>
                <QuestionMarkCircleIcon className="h-5 w-5 text-neutral-500 hover:text-amber-400" />
              </div>
              <div className="stat-value text-amber-400">{portfolio.metrics.expected_volatility.toFixed(1)}%</div>
              <div className="text-xs text-neutral-500 mt-1">🎢 Standard Deviation</div>
            </div>
          </EducationalTooltip>

          <EducationalTooltip content="sharpeRatio">
            <div className="stat-card cursor-help hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="stat-label">Sharpe Ratio</div>
                <QuestionMarkCircleIcon className="h-5 w-5 text-neutral-500 hover:text-blue-400" />
              </div>
              <div className="stat-value text-blue-400">{portfolio.metrics.sharpe_ratio.toFixed(2)}</div>
              <div className="text-xs text-neutral-500 mt-1">⚖️ Risk-Adjusted Return</div>
            </div>
          </EducationalTooltip>

          <EducationalTooltip content="riskProfile">
            <div className="stat-card cursor-help hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="stat-label">Risk Profile</div>
                <QuestionMarkCircleIcon className="h-5 w-5 text-neutral-500 hover:text-purple-400" />
              </div>
              <div className="stat-value text-purple-400">{portfolio.risk_score.toFixed(1)}/10</div>
              <div className="text-xs text-neutral-500 mt-1">🎯 {portfolio.risk_profile}</div>
            </div>
          </EducationalTooltip>
        </motion.div>

        {/* Detailed Holdings Table */}
        <motion.div
          id="holdings-table"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6 mb-8"
        >
          <EducationalTooltip content="etf">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2 cursor-help text-white">
              Detailed ETF Holdings
              <QuestionMarkCircleIcon className="h-5 w-5 text-neutral-500 hover:text-primary-400" />
            </h3>
          </EducationalTooltip>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300">
                    <EducationalTooltip content="etf">
                      <span className="flex items-center gap-1 cursor-help">
                        Ticker
                        <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500" />
                      </span>
                    </EducationalTooltip>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300">ETF Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300">
                    <EducationalTooltip content="diversification">
                      <span className="flex items-center gap-1 cursor-help">
                        Category
                        <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500" />
                      </span>
                    </EducationalTooltip>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-300">
                    <EducationalTooltip content="allocation">
                      <span className="flex items-center gap-1 justify-end cursor-help">
                        Allocation
                        <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500" />
                      </span>
                    </EducationalTooltip>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-300">
                    <EducationalTooltip content="expectedReturn">
                      <span className="flex items-center gap-1 justify-end cursor-help">
                        Exp. Return
                        <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500" />
                      </span>
                    </EducationalTooltip>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-300">
                    <EducationalTooltip content="volatility">
                      <span className="flex items-center gap-1 justify-end cursor-help">
                        Volatility
                        <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500" />
                      </span>
                    </EducationalTooltip>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-neutral-300">
                    <EducationalTooltip content="riskLevel">
                      <span className="flex items-center gap-1 justify-center cursor-help">
                        Risk
                        <QuestionMarkCircleIcon className="h-4 w-4 text-neutral-500" />
                      </span>
                    </EducationalTooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.allocations.map((holding, index) => (
                  <motion.tr
                    key={holding.ticker}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="border-b border-neutral-800 hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[index] }}
                        />
                        <span className="font-bold text-primary-400">{holding.ticker}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-neutral-300">{holding.name}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getCategoryColorDark(holding.category)}`}>
                        {holding.category === 'bonds' ? '🏦 ' : holding.category === 'stocks' ? '📈 ' : '💎 '}
                        {holding.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-white">{holding.weight.toFixed(1)}%</td>
                    <td className="py-4 px-4 text-right text-emerald-400 font-semibold">{holding.expected_return.toFixed(1)}%</td>
                    <td className="py-4 px-4 text-right text-amber-400 font-semibold">{holding.volatility.toFixed(1)}%</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRiskLevelColorDark(holding.risk_level)}`}>
                        {getRiskLevelLabel(holding.risk_level)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Educational Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card p-6 mb-8 border-l-4 border-l-amber-500"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-6 w-6 text-amber-400" />
            Quick Investment Tips
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold text-white mb-1">Stay the Course</h4>
              <p className="text-sm text-neutral-400">Don't panic sell during market dips. Time in the market beats timing the market!</p>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="font-semibold text-white mb-1">Rebalance Regularly</h4>
              <p className="text-sm text-neutral-400">Check your portfolio quarterly and rebalance if allocations drift more than 5%.</p>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-semibold text-white mb-1">Dollar-Cost Average</h4>
              <p className="text-sm text-neutral-400">Invest a fixed amount regularly, regardless of market conditions. It reduces timing risk!</p>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          id="next-steps"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-8 mb-8 border-l-4 border-l-blue-500"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <InformationCircleIcon className="h-6 w-6 text-blue-400" />
            Next Steps
          </h3>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Review your personalized ETF allocation based on your risk profile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Research each ETF to understand its investment strategy and holdings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Open a brokerage account (e.g., Fidelity, Schwab, Vanguard) if you don't have one</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">4.</span>
              <span>Purchase ETFs according to the recommended allocation percentages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">5.</span>
              <span>Rebalance your portfolio quarterly or when allocations drift significantly</span>
            </li>
          </ul>
        </motion.div>

        {/* Start Trading CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-8 mb-8 text-white shadow-xl shadow-emerald-500/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to Trade?</h3>
              <p className="opacity-90">
                Execute your portfolio with paper trading - $10,000 virtual money, zero risk!
              </p>
            </div>
            <button
              onClick={() => router.push('/trading')}
              className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <BanknotesIcon className="h-5 w-5" />
              Start Paper Trading
            </button>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <button
            onClick={() => {
              localStorage.removeItem('portfolioGenerated')
              localStorage.removeItem('portfolioData')
              router.push('/assessment')
            }}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Retake Assessment
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('portfolioTourCompleted')
              startTour()
            }}
            className="btn-gradient flex items-center justify-center gap-2"
          >
            <AcademicCapIcon className="h-5 w-5" />
            Replay Tutorial
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Return to Home
          </button>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6"
        >
          <p className="text-sm text-amber-300/80">
            <strong className="text-amber-300">Disclaimer:</strong> This portfolio recommendation is for educational purposes only and does not constitute financial advice.
            Past performance does not guarantee future results. Please consult with a qualified financial advisor before making investment decisions.
            All expected returns and risk metrics are estimates based on historical data and may not reflect actual future performance.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
