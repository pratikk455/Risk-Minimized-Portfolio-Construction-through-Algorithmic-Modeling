'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ClockIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface TradingStatus {
  configured: boolean
  paper_trading?: boolean
  account_status?: string
  buying_power?: number
  portfolio_value?: number
  cash?: number
  message?: string
  error?: string
}

interface Position {
  symbol: string
  qty: number
  avg_entry_price: number
  market_value: number
  cost_basis: number
  unrealized_pl: number
  unrealized_plpc: number
  current_price: number
  change_today: number
  side: string
}

interface Order {
  id: string
  symbol: string
  qty: number | null
  notional: number | null
  filled_qty: number
  filled_avg_price: number | null
  side: string
  type: string
  status: string
  created_at: string
  filled_at: string | null
}

interface PortfolioAllocation {
  ticker: string
  name: string
  weight: number
}

export default function TradingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [tradingStatus, setTradingStatus] = useState<TradingStatus | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [portfolio, setPortfolio] = useState<any>(null)
  const [investmentAmount, setInvestmentAmount] = useState<string>('1000')
  const [isExecuting, setIsExecuting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'execute' | 'positions' | 'orders'>('execute')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Sell modal state
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [sellAmount, setSellAmount] = useState<string>('')
  const [sellMode, setSellMode] = useState<'amount' | 'percentage'>('amount')
  const [reinvestAfterSell, setReinvestAfterSell] = useState(false)
  const [isSelling, setIsSelling] = useState(false)

  // Limit paper trading to $10,000
  const MAX_INVESTMENT = 10000

  // Calculate available cash based on simulated $10k budget
  const investedAmount = positions.reduce((sum, pos) => sum + pos.cost_basis, 0)
  const availableCash = Math.max(0, MAX_INVESTMENT - investedAmount)

  const fetchTradingStatus = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/api/trading/status`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      setTradingStatus(response.data)
      setLastUpdated(new Date())
    } catch (error: any) {
      console.error('Error fetching trading status:', error)
      if (error.response?.status === 401) {
        router.push('/login')
      }
    }
  }, [router])

  const fetchPositions = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken || !tradingStatus?.configured) return

    try {
      const response = await axios.get(`${API_URL}/api/trading/positions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      setPositions(response.data.positions || [])
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }, [tradingStatus])

  const fetchOrders = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken || !tradingStatus?.configured) return

    try {
      const response = await axios.get(`${API_URL}/api/trading/orders?limit=20`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      setOrders(response.data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }, [tradingStatus])

  const fetchPortfolio = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) return

    try {
      const response = await axios.get(`${API_URL}/api/portfolio/active`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      setPortfolio(response.data)
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await fetchTradingStatus()
      await fetchPortfolio()
      setIsLoading(false)
    }
    init()
  }, [fetchTradingStatus, fetchPortfolio])

  useEffect(() => {
    if (tradingStatus?.configured) {
      fetchPositions()
      fetchOrders()
    }
  }, [tradingStatus, fetchPositions, fetchOrders])

  // Auto-refresh for live data every 10 seconds
  useEffect(() => {
    if (!tradingStatus?.configured) return

    const interval = setInterval(() => {
      fetchTradingStatus()
      fetchPositions()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [tradingStatus?.configured, fetchTradingStatus, fetchPositions])

  const handleExecutePortfolio = async () => {
    setShowConfirmModal(false)
    setIsExecuting(true)

    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      toast.error('Please login first')
      router.push('/login')
      return
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/trading/execute-portfolio`,
        { investment_amount: parseFloat(investmentAmount) },
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )

      if (response.data.success) {
        toast.success(`Successfully placed ${response.data.summary.successful_orders} orders!`)
        // Refresh data
        await fetchPositions()
        await fetchOrders()
        await fetchTradingStatus()
        setActiveTab('orders')
      } else {
        toast.error('Some orders failed. Check the orders tab for details.')
      }
    } catch (error: any) {
      console.error('Error executing portfolio:', error)
      toast.error(error.response?.data?.detail || 'Failed to execute portfolio')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCloseAllPositions = async () => {
    if (!confirm('Are you sure you want to close ALL positions? This will sell everything.')) {
      return
    }

    const accessToken = localStorage.getItem('access_token')
    try {
      await axios.delete(`${API_URL}/api/trading/positions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      toast.success('All positions closed')
      await fetchPositions()
      await fetchTradingStatus()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to close positions')
    }
  }

  const handleClosePosition = async (symbol: string) => {
    const accessToken = localStorage.getItem('access_token')
    try {
      await axios.delete(`${API_URL}/api/trading/position/${symbol}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      toast.success(`Closed position in ${symbol}`)
      await fetchPositions()
      await fetchTradingStatus()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to close ${symbol}`)
    }
  }

  // Open sell modal for a position
  const openSellModal = (position: Position) => {
    setSelectedPosition(position)
    setSellAmount('')
    setSellMode('amount')
    setReinvestAfterSell(false)
    setShowSellModal(true)
  }

  // Calculate sell quantity based on amount or percentage
  const calculateSellQty = (): number => {
    if (!selectedPosition) return 0
    const value = parseFloat(sellAmount) || 0

    if (sellMode === 'percentage') {
      // Percentage of shares
      return (value / 100) * selectedPosition.qty
    } else {
      // Dollar amount - convert to shares
      return value / selectedPosition.current_price
    }
  }

  // Get the dollar value of what will be sold
  const getSellValue = (): number => {
    if (!selectedPosition) return 0
    const value = parseFloat(sellAmount) || 0

    if (sellMode === 'percentage') {
      return (value / 100) * selectedPosition.market_value
    } else {
      return Math.min(value, selectedPosition.market_value)
    }
  }

  // Handle partial sell
  const handleSellPosition = async () => {
    if (!selectedPosition) return

    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      toast.error('Please login first')
      return
    }

    const sellQty = calculateSellQty()
    const sellValue = getSellValue()

    if (sellQty <= 0 || sellQty > selectedPosition.qty) {
      toast.error('Invalid sell quantity')
      return
    }

    setIsSelling(true)

    try {
      // If selling entire position
      if (sellQty >= selectedPosition.qty * 0.99) {
        await axios.delete(`${API_URL}/api/trading/position/${selectedPosition.symbol}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        toast.success(`Sold all ${selectedPosition.symbol}`)
      } else {
        // Partial sell - use a sell order
        await axios.post(
          `${API_URL}/api/trading/order`,
          {
            symbol: selectedPosition.symbol,
            qty: sellQty,
            side: 'sell',
            type: 'market'
          },
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        )
        toast.success(`Sold $${sellValue.toFixed(2)} of ${selectedPosition.symbol}`)
      }

      // Refresh positions and orders
      await fetchPositions()
      await fetchOrders()
      await fetchTradingStatus()

      // If reinvest option is selected, execute portfolio with the sold amount
      if (reinvestAfterSell && sellValue > 0) {
        // Wait a moment for the sell to settle
        await new Promise(resolve => setTimeout(resolve, 1000))

        try {
          const response = await axios.post(
            `${API_URL}/api/trading/execute-portfolio`,
            { investment_amount: sellValue },
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          )

          if (response.data.success) {
            toast.success(`Reinvested $${sellValue.toFixed(2)} across portfolio!`)
            await fetchPositions()
            await fetchOrders()
          }
        } catch (reinvestError: any) {
          console.error('Error reinvesting:', reinvestError)
          toast.error('Sell completed but reinvestment failed')
        }
      }

      setShowSellModal(false)
      setSelectedPosition(null)
      setActiveTab('orders')
    } catch (error: any) {
      console.error('Error selling position:', error)
      toast.error(error.response?.data?.detail || `Failed to sell ${selectedPosition.symbol}`)
    } finally {
      setIsSelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary-500/20 border-t-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Loading trading dashboard...</p>
        </div>
      </div>
    )
  }

  // Not configured state
  if (!tradingStatus?.configured) {
    return (
      <div className="min-h-screen bg-dark-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 text-center"
          >
            <Cog6ToothIcon className="h-20 w-20 text-neutral-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Setup Required</h1>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">
              To start paper trading, you need to configure your Alpaca API keys.
              Start with a $10,000 virtual budget to practice trading!
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
              <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5" />
                How to get Alpaca API Keys
              </h3>
              <ol className="text-blue-300/80 space-y-2 text-sm">
                <li><span className="font-bold text-blue-400">1.</span> Go to <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">alpaca.markets</a> and sign up for free</li>
                <li><span className="font-bold text-blue-400">2.</span> Navigate to Paper Trading in your dashboard</li>
                <li><span className="font-bold text-blue-400">3.</span> Generate API keys (View → Generate New Keys)</li>
                <li><span className="font-bold text-blue-400">4.</span> Add to your backend <code className="bg-blue-500/20 px-1 rounded">.env</code> file:</li>
              </ol>
              <pre className="bg-dark-800 rounded-lg p-3 mt-3 text-xs overflow-x-auto text-neutral-300">
{`ALPACA_API_KEY=your_api_key_here
ALPACA_SECRET_KEY=your_secret_key_here`}
              </pre>
            </div>

            <button
              onClick={() => router.push('/portfolio')}
              className="btn-gradient"
            >
              Back to Portfolio
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // No portfolio state
  if (!portfolio) {
    return (
      <div className="min-h-screen bg-dark-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 text-center"
          >
            <ChartBarIcon className="h-20 w-20 text-neutral-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">No Portfolio Found</h1>
            <p className="text-neutral-400 mb-8">
              You need to generate a portfolio before you can start trading.
            </p>
            <button
              onClick={() => router.push('/assessment')}
              className="btn-gradient"
            >
              Take Assessment
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">Paper Trading</h1>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-semibold">
                  Simulated
                </span>
              </div>
              <p className="text-neutral-400">Execute your portfolio with virtual money - no real risk!</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400">LIVE</span>
                <span className="text-neutral-600">|</span>
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={() => { fetchTradingStatus(); fetchPositions(); }}
                className="p-2 text-neutral-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                title="Refresh data"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Account Summary - Simulated $10k Budget */}
        {(() => {
          // Portfolio value is the current market value of positions
          const portfolioValue = positions.reduce((sum, pos) => sum + pos.market_value, 0)
          // Total P/L
          const totalPL = portfolioValue - investedAmount

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <div className="stat-card hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="stat-label">Portfolio Value</span>
                  <BanknotesIcon className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="stat-value text-emerald-400">
                  ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {totalPL !== 0 && (
                  <div className={`text-sm mt-1 ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)} ({investedAmount > 0 ? ((totalPL / investedAmount) * 100).toFixed(2) : 0}%)
                  </div>
                )}
              </div>

              <div className="stat-card hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="stat-label">Available Cash</span>
                  <CurrencyDollarIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="stat-value text-blue-400">
                  ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  of ${MAX_INVESTMENT.toLocaleString()} budget
                </div>
              </div>

              <div className="stat-card hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="stat-label">Invested</span>
                  <BanknotesIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div className="stat-value text-purple-400">
                  ${investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  {((investedAmount / MAX_INVESTMENT) * 100).toFixed(0)}% of budget used
                </div>
              </div>

              <div className="stat-card hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="stat-label">Positions</span>
                  <ChartBarIcon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="stat-value text-amber-400">
                  {positions.length}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  {positions.length > 0 ? 'Active holdings' : 'No holdings'}
                </div>
              </div>
            </motion.div>
          )
        })()}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-dark-800/50 p-1 rounded-xl w-fit">
          {['execute', 'positions', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {tab === 'execute' && 'Execute Portfolio'}
              {tab === 'positions' && `Positions (${positions.length})`}
              {tab === 'orders' && `Orders (${orders.length})`}
            </button>
          ))}
        </div>

        {/* Execute Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'execute' && (
            <motion.div
              key="execute"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Investment Amount Card */}
              <div className="card p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <RocketLaunchIcon className="h-6 w-6 text-primary-400" />
                  Execute Your Portfolio
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Investment Amount ($)
                  </label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    min="1"
                    max={availableCash}
                    className="input-large w-full"
                    placeholder="1000"
                  />
                  <p className="text-sm text-neutral-500 mt-2">
                    Available: ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ${MAX_INVESTMENT.toLocaleString()} budget
                  </p>
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[1000, 2500, 5000, 7500, 10000].filter(amount => amount <= availableCash).map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setInvestmentAmount(amount.toString())}
                      className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      ${amount.toLocaleString()}
                    </button>
                  ))}
                  {availableCash > 0 && availableCash < 1000 && (
                    <button
                      onClick={() => setInvestmentAmount(availableCash.toFixed(2))}
                      className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      All (${availableCash.toFixed(2)})
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isExecuting || !parseFloat(investmentAmount) || parseFloat(investmentAmount) > availableCash || availableCash <= 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    isExecuting || !parseFloat(investmentAmount) || parseFloat(investmentAmount) > availableCash || availableCash <= 0
                      ? 'bg-neutral-700 cursor-not-allowed text-neutral-500'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                      Executing Orders...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5" />
                      Execute Portfolio
                    </>
                  )}
                </button>
              </div>

              {/* Allocation Preview */}
              <div className="card p-6">
                <h3 className="text-xl font-bold text-white mb-4">Allocation Preview</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {portfolio.allocations?.map((alloc: PortfolioAllocation) => {
                    const amount = (alloc.weight / 100) * parseFloat(investmentAmount || '0')
                    return (
                      <div
                        key={alloc.ticker}
                        className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl"
                      >
                        <div>
                          <span className="font-bold text-primary-400">{alloc.ticker}</span>
                          <span className="text-neutral-500 text-sm ml-2">{alloc.weight.toFixed(1)}%</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-white">
                            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <motion.div
              key="positions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Current Positions</h3>
                <div className="flex gap-2">
                  <button
                    onClick={fetchPositions}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  {positions.length > 0 && (
                    <button
                      onClick={handleCloseAllPositions}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
                    >
                      <StopIcon className="h-4 w-4" />
                      Close All
                    </button>
                  )}
                </div>
              </div>

              {positions.length === 0 ? (
                <div className="text-center py-12">
                  <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-neutral-600" />
                  <p className="text-neutral-400">No open positions</p>
                  <p className="text-sm mt-2 text-neutral-500">Execute your portfolio to start trading!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="text-left py-3 px-4 font-semibold text-neutral-400 text-sm">Symbol</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">Avg Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">Current</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">Market Value</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">P/L</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">P/L %</th>
                        <th className="text-center py-3 px-4 font-semibold text-neutral-400 text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => (
                        <tr key={pos.symbol} className="border-b border-neutral-800/50 hover:bg-dark-800/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-primary-400">{pos.symbol}</td>
                          <td className="py-4 px-4 text-right text-white">{pos.qty.toFixed(4)}</td>
                          <td className="py-4 px-4 text-right text-neutral-300">${pos.avg_entry_price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right text-neutral-300">${pos.current_price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-semibold text-white">
                            ${pos.market_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold ${pos.unrealized_pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pos.unrealized_pl >= 0 ? '+' : ''}${pos.unrealized_pl.toFixed(2)}
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold ${pos.unrealized_plpc >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pos.unrealized_plpc >= 0 ? '+' : ''}{pos.unrealized_plpc.toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openSellModal(pos)}
                                className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors"
                              >
                                Sell
                              </button>
                              <button
                                onClick={() => handleClosePosition(pos.symbol)}
                                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                              >
                                Close All
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Order History</h3>
                <button
                  onClick={fetchOrders}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="h-16 w-16 mx-auto mb-4 text-neutral-600" />
                  <p className="text-neutral-400">No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="text-left py-3 px-4 font-semibold text-neutral-400 text-sm">Symbol</th>
                        <th className="text-left py-3 px-4 font-semibold text-neutral-400 text-sm">Side</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">Filled</th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-400 text-sm">Price</th>
                        <th className="text-center py-3 px-4 font-semibold text-neutral-400 text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-neutral-400 text-sm">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-neutral-800/50 hover:bg-dark-800/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-primary-400">{order.symbol}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              order.side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {order.side === 'buy' ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                              {order.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-white">
                            {order.qty?.toFixed(4) || (order.notional && `$${order.notional.toFixed(2)}`)}
                          </td>
                          <td className="py-4 px-4 text-right text-neutral-300">{order.filled_qty.toFixed(4)}</td>
                          <td className="py-4 px-4 text-right text-neutral-300">
                            {order.filled_avg_price ? `$${order.filled_avg_price.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'filled' ? 'bg-emerald-500/20 text-emerald-400' :
                              order.status === 'canceled' || order.status === 'expired' ? 'bg-neutral-500/20 text-neutral-400' :
                              order.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {order.status === 'filled' && <CheckCircleIcon className="h-3 w-3" />}
                              {order.status === 'rejected' && <XCircleIcon className="h-3 w-3" />}
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-neutral-500">
                            {new Date(order.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-amber-400 mb-1">Paper Trading Disclaimer</h4>
              <p className="text-sm text-amber-300/80">
                This is simulated trading with virtual money. No real money is at risk.
                Paper trading is for educational purposes and to test strategies.
                Real trading involves risk of loss and past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Confirm Portfolio Execution</h3>
              <p className="text-neutral-400 mb-4">
                You are about to invest <span className="font-bold text-primary-400">${parseFloat(investmentAmount).toLocaleString()}</span> across {portfolio.allocations?.length || 0} ETFs.
              </p>
              <div className="bg-dark-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-neutral-400 mb-2">This will place market orders for:</p>
                <ul className="text-sm text-neutral-300 space-y-1">
                  {portfolio.allocations?.slice(0, 5).map((alloc: PortfolioAllocation) => (
                    <li key={alloc.ticker}>
                      • <span className="font-semibold text-primary-400">{alloc.ticker}</span>: ${((alloc.weight / 100) * parseFloat(investmentAmount)).toFixed(2)}
                    </li>
                  ))}
                  {(portfolio.allocations?.length || 0) > 5 && (
                    <li className="text-neutral-500">...and {portfolio.allocations.length - 5} more</li>
                  )}
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-dark-700 text-neutral-300 rounded-xl font-semibold hover:bg-dark-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecutePortfolio}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                >
                  Execute Orders
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sell Modal */}
      <AnimatePresence>
        {showSellModal && selectedPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-4"
            onClick={() => setShowSellModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Sell {selectedPosition.symbol}</h3>
                <button
                  onClick={() => setShowSellModal(false)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Position Info */}
              <div className="bg-dark-800 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-400">Current Value</span>
                    <p className="text-lg font-bold text-white">${selectedPosition.market_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Shares Owned</span>
                    <p className="text-lg font-bold text-white">{selectedPosition.qty.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Current Price</span>
                    <p className="text-white">${selectedPosition.current_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">P/L</span>
                    <p className={`font-semibold ${selectedPosition.unrealized_pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedPosition.unrealized_pl >= 0 ? '+' : ''}${selectedPosition.unrealized_pl.toFixed(2)} ({selectedPosition.unrealized_plpc.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Sell Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setSellMode('amount'); setSellAmount(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    sellMode === 'amount'
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  Dollar Amount
                </button>
                <button
                  onClick={() => { setSellMode('percentage'); setSellAmount(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    sellMode === 'percentage'
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  Percentage
                </button>
              </div>

              {/* Sell Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {sellMode === 'amount' ? 'Amount to Sell ($)' : 'Percentage to Sell (%)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    min="0"
                    max={sellMode === 'percentage' ? 100 : selectedPosition.market_value}
                    step={sellMode === 'percentage' ? 1 : 0.01}
                    className="input-large w-full pr-12"
                    placeholder={sellMode === 'amount' ? '1000' : '50'}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
                    {sellMode === 'amount' ? '$' : '%'}
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {sellMode === 'percentage' ? (
                  <>
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setSellAmount(pct.toString())}
                        className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[100, 500, 1000, 2000].filter(amt => amt <= selectedPosition.market_value).map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setSellAmount(amt.toString())}
                        className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      onClick={() => setSellAmount(selectedPosition.market_value.toFixed(2))}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      Sell All
                    </button>
                  </>
                )}
              </div>

              {/* Sale Preview */}
              {parseFloat(sellAmount) > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                  <p className="text-sm text-amber-300">
                    You will sell approximately <span className="font-bold text-amber-400">{calculateSellQty().toFixed(4)} shares</span> for{' '}
                    <span className="font-bold text-amber-400">${getSellValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                </div>
              )}

              {/* Reinvest Option */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reinvestAfterSell}
                    onChange={(e) => setReinvestAfterSell(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-neutral-300">
                    Reinvest proceeds using portfolio weights
                  </span>
                </label>
                {reinvestAfterSell && parseFloat(sellAmount) > 0 && (
                  <p className="text-xs text-neutral-500 mt-2 ml-8">
                    ${getSellValue().toFixed(2)} will be distributed across your portfolio allocations
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSellModal(false)}
                  className="flex-1 py-3 bg-dark-700 text-neutral-300 rounded-xl font-semibold hover:bg-dark-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSellPosition}
                  disabled={isSelling || !parseFloat(sellAmount) || getSellValue() <= 0 || getSellValue() > selectedPosition.market_value}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    isSelling || !parseFloat(sellAmount) || getSellValue() <= 0 || getSellValue() > selectedPosition.market_value
                      ? 'bg-neutral-700 cursor-not-allowed text-neutral-500'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:shadow-lg hover:shadow-amber-500/20'
                  }`}
                >
                  {isSelling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                      Selling...
                    </>
                  ) : (
                    <>
                      <ArrowTrendingDownIcon className="h-5 w-5" />
                      Sell {selectedPosition.symbol}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
