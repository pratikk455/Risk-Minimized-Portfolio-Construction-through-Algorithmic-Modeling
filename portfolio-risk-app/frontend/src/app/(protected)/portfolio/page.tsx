'use client'

import { useState } from 'react'
import { Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
)

export default function PortfolioPage() {
  const [portfolio] = useState({
    allocations: [
      { asset: 'US Stocks', percentage: 35, etf: 'VTI' },
      { asset: 'International Stocks', percentage: 25, etf: 'VXUS' },
      { asset: 'Bonds', percentage: 20, etf: 'BND' },
      { asset: 'Real Estate', percentage: 10, etf: 'VNQ' },
      { asset: 'Commodities', percentage: 10, etf: 'DBC' },
    ],
    metrics: {
      expectedReturn: 7.2,
      volatility: 12.5,
      sharpeRatio: 0.58,
      maxDrawdown: -18.3,
    },
    riskProfile: 'Moderate',
  })

  const pieData = {
    labels: portfolio.allocations.map(a => a.asset),
    datasets: [
      {
        data: portfolio.allocations.map(a => a.percentage),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [100000, 102000, 105000, 103000, 107000, 110000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'S&P 500',
        data: [100000, 101000, 104000, 105000, 106000, 108000],
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Portfolio</h1>
          <p className="text-gray-600">Optimized allocation based on your risk profile</p>
        </div>

        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Risk Profile: {portfolio.riskProfile}</h2>
              <p className="opacity-90">Your portfolio is optimized for balanced growth with controlled risk</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{portfolio.metrics.expectedReturn}%</div>
              <div className="text-sm opacity-90">Expected Annual Return</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Asset Allocation</h3>
            <div className="h-64">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Allocation Details</h3>
            <div className="space-y-3">
              {portfolio.allocations.map((allocation, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3" style={{
                      backgroundColor: pieData.datasets[0].backgroundColor[index]
                    }} />
                    <div>
                      <div className="font-medium">{allocation.asset}</div>
                      <div className="text-sm text-gray-500">ETF: {allocation.etf}</div>
                    </div>
                  </div>
                  <div className="font-semibold">{allocation.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Expected Return</div>
            <div className="text-2xl font-bold text-green-600">{portfolio.metrics.expectedReturn}%</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Volatility</div>
            <div className="text-2xl font-bold text-yellow-600">{portfolio.metrics.volatility}%</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Sharpe Ratio</div>
            <div className="text-2xl font-bold text-blue-600">{portfolio.metrics.sharpeRatio}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-600">{portfolio.metrics.maxDrawdown}%</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Simulated Performance</h3>
          <div className="h-64">
            <Line
              data={performanceData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toLocaleString()
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Review your portfolio allocation and ETF recommendations</li>
            <li>• Consider setting up automatic rebalancing alerts</li>
            <li>• Monitor your portfolio performance monthly</li>
            <li>• Reassess your risk profile annually or after major life changes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}