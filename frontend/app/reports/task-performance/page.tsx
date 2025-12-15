'use client'

import { useState, useEffect } from 'react'

interface TaskPerformance {
  period_days: number
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  by_status: Array<{ status: string; count: number }>
  by_priority: Array<{ priority: string; count: number }>
}

export default function TaskPerformancePage() {
  const [performance, setPerformance] = useState<TaskPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchTaskPerformance()
  }, [period])

  const fetchTaskPerformance = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `http://localhost:8000/api/analytics/task-performance/?period=${period}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      setPerformance(data)
    } catch (error) {
      console.error('Failed to fetch task performance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !performance) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Task Performance</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Total Tasks</div>
            <div className="text-3xl font-bold text-gray-900">{performance.total_tasks}</div>
            <div className="text-sm text-gray-500">created in period</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Completed Tasks</div>
            <div className="text-3xl font-bold text-green-600">{performance.completed_tasks}</div>
            <div className="text-sm text-gray-500">
              {performance.total_tasks > 0
                ? `${((performance.completed_tasks / performance.total_tasks) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Completion Rate</div>
            <div className="text-3xl font-bold text-blue-600">
              {performance.completion_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">average completion</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks by Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Tasks by Status</h2>
            <div className="space-y-4">
              {performance.by_status.map((item) => {
                const percentage =
                  performance.total_tasks > 0
                    ? (item.count / performance.total_tasks) * 100
                    : 0
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{item.status.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-gray-600">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${getStatusColor(
                          item.status
                        )}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tasks by Priority */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Tasks by Priority</h2>
            <div className="space-y-4">
              {performance.by_priority.map((item) => {
                const percentage =
                  performance.total_tasks > 0
                    ? (item.count / performance.total_tasks) * 100
                    : 0
                return (
                  <div key={item.priority}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{item.priority}</span>
                      <span className="text-sm text-gray-600">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${getPriorityColor(
                          item.priority
                        )}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Completion Rate Visualization */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Overall Completion Progress</h2>
          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ width: `${performance.completion_rate}%` }}
            >
              {performance.completion_rate > 10 && `${performance.completion_rate.toFixed(1)}%`}
            </div>
          </div>
          <div className="mt-4 text-center text-gray-600">
            <span className="font-semibold text-gray-900">{performance.completed_tasks}</span> out of{' '}
            <span className="font-semibold text-gray-900">{performance.total_tasks}</span> tasks completed
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-gray-500',
  }
  return colors[status] || 'bg-gray-500'
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-400',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-600',
  }
  return colors[priority] || 'bg-gray-500'
}
