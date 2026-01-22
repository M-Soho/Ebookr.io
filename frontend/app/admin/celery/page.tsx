'use client'

import { useState, useEffect } from 'react'
import { Zap, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface CeleryTaskStatus {
  active_tasks: {
    count: number
    by_worker: Record<string, number>
  }
  scheduled_tasks: {
    count: number
    by_worker: Record<string, number>
  }
  reserved_tasks: {
    count: number
    by_worker: Record<string, number>
  }
  workers: string[]
  worker_stats: Record<string, any>
}

export default function CeleryMonitorPage() {
  const [taskStatus, setTaskStatus] = useState<CeleryTaskStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchTaskStatus()
    
    if (autoRefresh) {
      const interval = setInterval(fetchTaskStatus, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchTaskStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/celery/status/')
      const data = await response.json()
      if (data.success) {
        setTaskStatus(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching Celery task status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Celery status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Celery Task Monitor</h1>
          <p className="text-gray-600 mt-1">Background task queue monitoring and management</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh (10s)</span>
          </label>
          <button
            onClick={fetchTaskStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {taskStatus && (
        <>
          {/* Workers Status */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Workers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskStatus.workers.length > 0 ? (
                taskStatus.workers.map(worker => (
                  <div key={worker} className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Worker Active</h3>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{worker}</p>
                    {taskStatus.worker_stats[worker] && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div>Pool: {taskStatus.worker_stats[worker].pool?.implementation || 'N/A'}</div>
                        <div>Max concurrency: {taskStatus.worker_stats[worker].pool?.['max-concurrency'] || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">No Workers Active</h3>
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    No Celery workers are currently running. Background tasks will not be processed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Task Queues */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Task Queues</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Active Tasks */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Loader className="h-6 w-6 text-blue-600 animate-spin" />
                  <h3 className="font-semibold">Active Tasks</h3>
                </div>
                <p className="text-3xl font-bold mb-4">{taskStatus.active_tasks.count}</p>
                {Object.entries(taskStatus.active_tasks.by_worker).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 font-medium">By Worker:</p>
                    {Object.entries(taskStatus.active_tasks.by_worker).map(([worker, count]) => (
                      <div key={worker} className="text-xs text-gray-600 flex justify-between">
                        <span className="truncate max-w-[150px]">{worker.split('@')[1] || worker}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduled Tasks */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                  <h3 className="font-semibold">Scheduled Tasks</h3>
                </div>
                <p className="text-3xl font-bold mb-4">{taskStatus.scheduled_tasks.count}</p>
                {Object.entries(taskStatus.scheduled_tasks.by_worker).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 font-medium">By Worker:</p>
                    {Object.entries(taskStatus.scheduled_tasks.by_worker).map(([worker, count]) => (
                      <div key={worker} className="text-xs text-gray-600 flex justify-between">
                        <span className="truncate max-w-[150px]">{worker.split('@')[1] || worker}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reserved Tasks */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                  <h3 className="font-semibold">Reserved Tasks</h3>
                </div>
                <p className="text-3xl font-bold mb-4">{taskStatus.reserved_tasks.count}</p>
                {Object.entries(taskStatus.reserved_tasks.by_worker).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 font-medium">By Worker:</p>
                    {Object.entries(taskStatus.reserved_tasks.by_worker).map(([worker, count]) => (
                      <div key={worker} className="text-xs text-gray-600 flex justify-between">
                        <span className="truncate max-w-[150px]">{worker.split('@')[1] || worker}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scheduled Beat Tasks Info */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Celery Beat Scheduled Tasks</h3>
                <p className="text-sm text-blue-800">
                  The following tasks are scheduled to run automatically:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>• <strong>Task Reminders:</strong> Every 15 minutes</li>
                  <li>• <strong>Overdue Notifications:</strong> Daily at 9:00 AM</li>
                  <li>• <strong>Daily Digest:</strong> Daily at 8:00 AM</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2">
                  Make sure Celery Beat is running to process scheduled tasks
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Troubleshooting</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>No workers active?</strong> Start Celery worker with: <code className="bg-gray-200 px-2 py-1 rounded">celery -A config worker -l info</code></p>
              <p><strong>Tasks not running?</strong> Ensure Redis is running and accessible</p>
              <p><strong>Scheduled tasks not executing?</strong> Start Celery Beat with: <code className="bg-gray-200 px-2 py-1 rounded">celery -A config beat -l info</code></p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
