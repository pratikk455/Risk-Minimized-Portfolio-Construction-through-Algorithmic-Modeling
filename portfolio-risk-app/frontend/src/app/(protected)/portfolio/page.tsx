'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Doughnut } from 'react-chartjs-2'
import { motion } from 'framer-motion'
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
  InformationCircleIcon
} from '@heroicons/react/24/outline'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
)

interface ETFHolding {
  ticker: string
  name: string
  assetClass: string
  percentage: number
  expectedReturn: number
  riskLevel: 'Low' | 'Medium' | 'High'
}

interface PortfolioData {
  holdings: ETFHolding[]
  metrics: {
    expectedReturn: number
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
  }
  riskProfile: string
  riskScore: number
  assetClassBreakdown: {
    stocks: number
    bonds: number
    realEstate: number
    commodities: number
  }
  diversificationScore: number
}

export default function PortfolioPage() {
  const router = useRouter()
  const [hasPortfolio, setHasPortfolio] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if portfolio has been generated
    const portfolioGenerated = localStorage.getItem('portfolioGenerated')
    setHasPortfolio(portfolioGenerated === 'true')
    setIsLoading(false)
  }, [])

  // Mock portfolio data - in real app, this would come from API
  const [portfolio] = useState<PortfolioData>({
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', assetClass: 'US Large Cap Stocks', percentage: 15, expectedReturn: 9.2, riskLevel: 'Medium' },
      { ticker: 'VUG', name: 'Vanguard Growth ETF', assetClass: 'US Large Cap Growth', percentage: 8, expectedReturn: 10.5, riskLevel: 'High' },
      { ticker: 'VOE', name: 'Vanguard Mid-Cap Value ETF', assetClass: 'US Mid Cap', percentage: 5, expectedReturn: 8.8, riskLevel: 'Medium' },
      { ticker: 'VBR', name: 'Vanguard Small-Cap Value ETF', assetClass: 'US Small Cap', percentage: 4, expectedReturn: 9.5, riskLevel: 'High' },
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', assetClass: 'International Developed', percentage: 12, expectedReturn: 8.1, riskLevel: 'Medium' },
      { ticker: 'VWO', name: 'Vanguard Emerging Markets ETF', assetClass: 'Emerging Markets', percentage: 6, expectedReturn: 9.8, riskLevel: 'High' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', assetClass: 'US Bonds', percentage: 20, expectedReturn: 3.8, riskLevel: 'Low' },
      { ticker: 'BNDX', name: 'Vanguard International Bond ETF', assetClass: 'International Bonds', percentage: 8, expectedReturn: 3.2, riskLevel: 'Low' },
      { ticker: 'TIP', name: 'iShares TIPS Bond ETF', assetClass: 'Inflation-Protected', percentage: 5, expectedReturn: 3.5, riskLevel: 'Low' },
      { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', assetClass: 'US REITs', percentage: 7, expectedReturn: 7.5, riskLevel: 'Medium' },
      { ticker: 'VNQI', name: 'Vanguard Global ex-US Real Estate ETF', assetClass: 'International REITs', percentage: 3, expectedReturn: 6.8, riskLevel: 'Medium' },
      { ticker: 'GLD', name: 'SPDR Gold Trust', assetClass: 'Commodities - Gold', percentage: 3, expectedReturn: 4.2, riskLevel: 'High' },
      { ticker: 'DBC', name: 'Invesco DB Commodity Index', assetClass: 'Commodities - Diversified', percentage: 2, expectedReturn: 5.1, riskLevel: 'High' },
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', assetClass: 'Dividend Stocks', percentage: 2, expectedReturn: 8.9, riskLevel: 'Low' },
    ],
    metrics: {
      expectedReturn: 7.8,
      volatility: 11.2,
      sharpeRatio: 0.62,
      maxDrawdown: -16.5,
    },
    riskProfile: 'Moderate',
    riskScore: 6,
    assetClassBreakdown: {
      stocks: 52,
      bonds: 33,
      realEstate: 10,
      commodities: 5,
    },
    diversificationScore: 8.5,
  })

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

  const donutData = {
    labels: portfolio.holdings.map(h => `${h.ticker} (${h.percentage}%)`),
    datasets: [
      {
        data: portfolio.holdings.map(h => h.percentage),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
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
            const holding = portfolio.holdings[context.dataIndex]
            return [
              `${holding.ticker}: ${holding.percentage}%`,
              `${holding.name}`,
              `Asset Class: ${holding.assetClass}`,
            ]
          },
        },
      },
    },
    maintainAspectRatio: false,
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (!hasPortfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto px-4 text-center"
        >
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <ChartBarIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Portfolio Yet</h1>
            <p className="text-gray-600 mb-8">
              You haven't generated your optimized portfolio yet. Complete the risk assessment first,
              then generate your personalized investment portfolio.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/assessment')}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Take Assessment
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Optimized Portfolio</h1>
          <p className="text-gray-600">Personalized allocation based on your risk profile and investment goals</p>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-8 text-white mb-8 shadow-xl"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Risk Profile: {portfolio.riskProfile}</h2>
              <p className="text-lg opacity-90">Risk Score: {portfolio.riskScore}/10</p>
              <p className="opacity-80 mt-2">Your portfolio is optimized for balanced growth with controlled risk</p>
            </div>
            <div className="text-center md:text-right">
              <div className="text-5xl font-bold mb-2">{portfolio.metrics.expectedReturn}%</div>
              <div className="text-lg opacity-90">Expected Annual Return</div>
              <div className="mt-3 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <div className="text-sm opacity-80">Total Holdings</div>
                <div className="text-2xl font-bold">{portfolio.holdings.length} ETFs</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chart and Asset Class Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Donut Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
              Portfolio Allocation
            </h3>
            <div className="h-96">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </motion.div>

          {/* Asset Class Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <h3 className="text-2xl font-semibold mb-6">Asset Class Breakdown</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Stocks</span>
                  <span className="font-bold text-blue-600">{portfolio.assetClassBreakdown.stocks}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolio.assetClassBreakdown.stocks}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Bonds</span>
                  <span className="font-bold text-green-600">{portfolio.assetClassBreakdown.bonds}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolio.assetClassBreakdown.bonds}%` }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Real Estate</span>
                  <span className="font-bold text-orange-600">{portfolio.assetClassBreakdown.realEstate}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolio.assetClassBreakdown.realEstate}%` }}
                    transition={{ delay: 0.7, duration: 1 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Commodities</span>
                  <span className="font-bold text-yellow-600">{portfolio.assetClassBreakdown.commodities}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${portfolio.assetClassBreakdown.commodities}%` }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600"
                  />
                </div>
              </div>

              {/* Diversification Score */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Diversification Score</div>
                  <div className="text-4xl font-bold text-primary-600">{portfolio.diversificationScore}/10</div>
                  <p className="text-sm text-gray-500 mt-2">Excellent portfolio diversification</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Portfolio Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Expected Return</div>
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-green-600">{portfolio.metrics.expectedReturn}%</div>
            <div className="text-xs text-gray-500 mt-1">Annualized</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Volatility (Risk)</div>
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">{portfolio.metrics.volatility}%</div>
            <div className="text-xs text-gray-500 mt-1">Standard Deviation</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Sharpe Ratio</div>
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{portfolio.metrics.sharpeRatio}</div>
            <div className="text-xs text-gray-500 mt-1">Risk-Adjusted Return</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Max Drawdown</div>
              <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-red-600">{portfolio.metrics.maxDrawdown}%</div>
            <div className="text-xs text-gray-500 mt-1">Worst-Case Scenario</div>
          </div>
        </motion.div>

        {/* Detailed Holdings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <h3 className="text-2xl font-semibold mb-6">Detailed ETF Holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ticker</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">ETF Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset Class</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Allocation</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Expected Return</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Risk</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((holding, index) => (
                  <motion.tr
                    key={holding.ticker}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[index] }}
                        />
                        <span className="font-bold text-primary-600">{holding.ticker}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{holding.name}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{holding.assetClass}</td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900">{holding.percentage}%</td>
                    <td className="py-4 px-4 text-right text-green-600 font-semibold">{holding.expectedReturn}%</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRiskLevelColor(holding.riskLevel)}`}>
                        {holding.riskLevel}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-8"
        >
          <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <InformationCircleIcon className="h-6 w-6" />
            Next Steps
          </h3>
          <ul className="space-y-3 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Review your portfolio allocation and individual ETF recommendations above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Research each ETF to understand its investment strategy and holdings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Consider consulting with a financial advisor before making investment decisions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Monitor your portfolio performance and rebalance quarterly or as needed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Reassess your risk profile annually or after major life changes</span>
            </li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <button
            onClick={() => {
              localStorage.removeItem('portfolioGenerated')
              router.push('/assessment')
            }}
            className="px-8 py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Retake Assessment
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Return to Home
          </button>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
        >
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This portfolio recommendation is for educational purposes only and does not constitute financial advice.
            Past performance does not guarantee future results. Please consult with a qualified financial advisor before making investment decisions.
            All expected returns and risk metrics are estimates based on historical data and may not reflect actual future performance.
          </p>
        </motion.div>
      </div>
    </div>
  )
}