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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trading dashboard...</p>
        </div>
      </div>
    )
  }

  // Not configured state
  if (!tradingStatus?.configured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center"
          >
            <Cog6ToothIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Setup Required</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              To start paper trading, you need to configure your Alpaca API keys.
              Alpaca offers free paper trading with $100,000 virtual money!
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5" />
                How to get Alpaca API Keys
              </h3>
              <ol className="text-blue-800 space-y-2 text-sm">
                <li><span className="font-bold">1.</span> Go to <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer" className="underline">alpaca.markets</a> and sign up for free</li>
                <li><span className="font-bold">2.</span> Navigate to Paper Trading in your dashboard</li>
                <li><span className="font-bold">3.</span> Generate API keys (View → Generate New Keys)</li>
                <li><span className="font-bold">4.</span> Add to your backend <code className="bg-blue-100 px-1 rounded">.env</code> file:</li>
              </ol>
              <pre className="bg-blue-100 rounded-lg p-3 mt-3 text-xs overflow-x-auto">
{`ALPACA_API_KEY=your_api_key_here
ALPACA_SECRET_KEY=your_secret_key_here`}
              </pre>
            </div>

            <button
              onClick={() => router.push('/portfolio')}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center"
          >
            <ChartBarIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Portfolio Found</h1>
            <p className="text-gray-600 mb-8">
              You need to generate a portfolio before you can start trading.
            </p>
            <button
              onClick={() => router.push('/assessment')}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Take Assessment
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Paper Trading</h1>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
              Simulated
            </span>
          </div>
          <p className="text-gray-600">Execute your portfolio with virtual money - no real risk!</p>
        </motion.div>

        {/* Account Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Portfolio Value</span>
              <BanknotesIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${(tradingStatus.portfolio_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Buying Power</span>
              <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${(tradingStatus.buying_power || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Cash</span>
              <BanknotesIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${(tradingStatus.cash || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Positions</span>
              <ChartBarIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {positions.length}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['execute', 'positions', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
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
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <RocketLaunchIcon className="h-6 w-6 text-primary-600" />
                  Execute Your Portfolio
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Amount ($)
                  </label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    min="1"
                    max={tradingStatus.buying_power || 100000}
                    className="w-full px-4 py-3 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-colors"
                    placeholder="1000"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Available: ${(tradingStatus.buying_power || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[1000, 5000, 10000, 25000, 50000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setInvestmentAmount(amount.toString())}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      ${amount.toLocaleString()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isExecuting || !parseFloat(investmentAmount) || parseFloat(investmentAmount) > (tradingStatus.buying_power || 0)}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    isExecuting || !parseFloat(investmentAmount) || parseFloat(investmentAmount) > (tradingStatus.buying_power || 0)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Allocation Preview</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {portfolio.allocations?.map((alloc: PortfolioAllocation) => {
                    const amount = (alloc.weight / 100) * parseFloat(investmentAmount || '0')
                    return (
                      <div
                        key={alloc.ticker}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <span className="font-bold text-primary-600">{alloc.ticker}</span>
                          <span className="text-gray-500 text-sm ml-2">{alloc.weight.toFixed(1)}%</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">
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
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Current Positions</h3>
                <div className="flex gap-2">
                  <button
                    onClick={fetchPositions}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  {positions.length > 0 && (
                    <button
                      onClick={handleCloseAllPositions}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <StopIcon className="h-4 w-4" />
                      Close All
                    </button>
                  )}
                </div>
              </div>

              {positions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No open positions</p>
                  <p className="text-sm mt-2">Execute your portfolio to start trading!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Symbol</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Current</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Market Value</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">P/L</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">P/L %</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => (
                        <tr key={pos.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 font-bold text-primary-600">{pos.symbol}</td>
                          <td className="py-4 px-4 text-right">{pos.qty.toFixed(4)}</td>
                          <td className="py-4 px-4 text-right">${pos.avg_entry_price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right">${pos.current_price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-semibold">
                            ${pos.market_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold ${pos.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pos.unrealized_pl >= 0 ? '+' : ''}${pos.unrealized_pl.toFixed(2)}
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold ${pos.unrealized_plpc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pos.unrealized_plpc >= 0 ? '+' : ''}{pos.unrealized_plpc.toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleClosePosition(pos.symbol)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              Close
                            </button>
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
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Order History</h3>
                <button
                  onClick={fetchOrders}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClockIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Symbol</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Side</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Filled</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 font-bold text-primary-600">{order.symbol}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              order.side === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {order.side === 'buy' ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                              {order.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {order.qty?.toFixed(4) || (order.notional && `$${order.notional.toFixed(2)}`)}
                          </td>
                          <td className="py-4 px-4 text-right">{order.filled_qty.toFixed(4)}</td>
                          <td className="py-4 px-4 text-right">
                            {order.filled_avg_price ? `$${order.filled_avg_price.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'filled' ? 'bg-green-100 text-green-700' :
                              order.status === 'canceled' || order.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                              order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status === 'filled' && <CheckCircleIcon className="h-3 w-3" />}
                              {order.status === 'rejected' && <XCircleIcon className="h-3 w-3" />}
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-500">
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
          className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-amber-800 mb-1">Paper Trading Disclaimer</h4>
              <p className="text-sm text-amber-700">
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Portfolio Execution</h3>
              <p className="text-gray-600 mb-4">
                You are about to invest <span className="font-bold text-primary-600">${parseFloat(investmentAmount).toLocaleString()}</span> across {portfolio.allocations?.length || 0} ETFs.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">This will place market orders for:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {portfolio.allocations?.slice(0, 5).map((alloc: PortfolioAllocation) => (
                    <li key={alloc.ticker}>
                      • <span className="font-semibold">{alloc.ticker}</span>: ${((alloc.weight / 100) * parseFloat(investmentAmount)).toFixed(2)}
                    </li>
                  ))}
                  {(portfolio.allocations?.length || 0) > 5 && (
                    <li className="text-gray-500">...and {portfolio.allocations.length - 5} more</li>
                  )}
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecutePortfolio}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Execute Orders
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
