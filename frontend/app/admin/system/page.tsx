'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, AlertCircle, CheckCircle, XCircle, Clock, 
  Database, Mail, Cpu, HardDrive, Users, Zap,
  TrendingUp, Bell, Server
} from 'lucide-react'

interface SystemHealth {
  overall_status: string
  timestamp: string
  services: {
    [key: string]: {
      status: string
      message?: string
      error?: string
      workers?: number
      worker_names?: string[]
    }
  }
}

interface SystemMetrics {
  cpu: {
    percent: number
    count: number
    load_average: number[] | null
  }
  memory: {
    total: number
    used: number
    available: number
    percent: number
    total_gb: number
    available_gb: number
  }
  disk: {
    total: number
    used: number
    free: number
    percent: number
    total_gb: number
    free_gb: number
  }
  process: {
    cpu_percent: number
    memory_mb: number
    num_threads: number
  }
}

interface DashboardData {
  users: {
    total: number
    active: number
    new_today: number
    new_this_week: number
  }
  contacts: {
    total: number
    new_today: number
    new_this_week: number
  }
  tasks: {
    total: number
    todo: number
    in_progress: number
    completed: number
    overdue: number
  }
  activities: {
    total: number
    today: number
    this_week: number
  }
  notifications: {
    total: number
    unread: number
    today: number
  }
  subscriptions: {
    total: number
    active: number
    trialing: number
    past_due: number
  }
}

export default function SystemMonitorPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      const [healthRes, metricsRes, dashboardRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/health/'),
        fetch('http://localhost:8000/api/admin/metrics/'),
        fetch('http://localhost:8000/api/admin/dashboard/')
      ])

      const [healthData, metricsData, dashboardData] = await Promise.all([
        healthRes.json(),
        metricsRes.json(),
        dashboardRes.json()
      ])

      setHealth(healthData)
      if (metricsData.success) setMetrics(metricsData.metrics)
      if (dashboardData.success) setDashboard(dashboardData.dashboard)
    } catch (error) {
      console.error('Error fetching system data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy':
      case 'not_configured':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return 'bg-green-100 border-green-300'
      case 'degraded':
        return 'bg-yellow-100 border-yellow-300'
      case 'unhealthy':
      case 'not_configured':
        return 'bg-red-100 border-red-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitor</h1>
          <p className="text-gray-600 mt-1">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      {health && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          health.overall_status === 'healthy' ? 'bg-green-50 border-green-300' :
          health.overall_status === 'degraded' ? 'bg-yellow-50 border-yellow-300' :
          'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(health.overall_status)}
            <div>
              <h2 className="font-semibold text-lg">
                System Status: {health.overall_status.toUpperCase()}
              </h2>
              <p className="text-sm text-gray-600">
                Last updated: {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Service Health Cards */}
      {health && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Service Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(health.services).map(([service, data]) => (
              <div key={service} className={`p-4 rounded-lg border-2 ${getStatusColor(data.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(data.status)}
                      <h3 className="font-semibold capitalize">
                        {service.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700">
                      Status: <span className="font-medium">{data.status}</span>
                    </p>
                    {data.message && (
                      <p className="text-sm text-gray-600 mt-1">{data.message}</p>
                    )}
                    {data.error && (
                      <p className="text-sm text-red-600 mt-1">{data.error}</p>
                    )}
                    {data.workers !== undefined && (
                      <p className="text-sm text-gray-600 mt-1">
                        Workers: {data.workers}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics */}
      {metrics && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">System Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CPU */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold">CPU Usage</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usage:</span>
                  <span className="font-semibold">{metrics.cpu.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metrics.cpu.percent > 80 ? 'bg-red-600' :
                      metrics.cpu.percent > 60 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${metrics.cpu.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Cores:</span>
                  <span>{metrics.cpu.count}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Process:</span>
                  <span>{metrics.process.cpu_percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold">Memory Usage</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usage:</span>
                  <span className="font-semibold">{metrics.memory.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metrics.memory.percent > 80 ? 'bg-red-600' :
                      metrics.memory.percent > 60 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${metrics.memory.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total:</span>
                  <span>{metrics.memory.total_gb} GB</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Available:</span>
                  <span>{metrics.memory.available_gb} GB</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Process:</span>
                  <span>{metrics.process.memory_mb} MB</span>
                </div>
              </div>
            </div>

            {/* Disk */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="h-6 w-6 text-orange-600" />
                <h3 className="font-semibold">Disk Usage</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usage:</span>
                  <span className="font-semibold">{metrics.disk.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metrics.disk.percent > 80 ? 'bg-red-600' :
                      metrics.disk.percent > 60 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${metrics.disk.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total:</span>
                  <span>{metrics.disk.total_gb} GB</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Free:</span>
                  <span>{metrics.disk.free_gb} GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Statistics */}
      {dashboard && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Users */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold">Users</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-xl">{dashboard.users.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span>{dashboard.users.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New today:</span>
                  <span className="text-green-600">+{dashboard.users.new_today}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New this week:</span>
                  <span className="text-green-600">+{dashboard.users.new_this_week}</span>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold">Contacts</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-xl">{dashboard.contacts.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New today:</span>
                  <span className="text-green-600">+{dashboard.contacts.new_today}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New this week:</span>
                  <span className="text-green-600">+{dashboard.contacts.new_this_week}</span>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold">Tasks</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-xl">{dashboard.tasks.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To Do:</span>
                  <span>{dashboard.tasks.todo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">In Progress:</span>
                  <span>{dashboard.tasks.in_progress}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overdue:</span>
                  <span className="text-red-600">{dashboard.tasks.overdue}</span>
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-indigo-600" />
                <h3 className="font-semibold">Activities</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-xl">{dashboard.activities.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Today:</span>
                  <span>{dashboard.activities.today}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This week:</span>
                  <span>{dashboard.activities.this_week}</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-6 w-6 text-yellow-600" />
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-xl">{dashboard.notifications.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unread:</span>
                  <span className="text-red-600">{dashboard.notifications.unread}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Today:</span>
                  <span>{dashboard.notifications.today}</span>
                </div>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold">Subscriptions</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold text-xl">{dashboard.subscriptions.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="text-green-600">{dashboard.subscriptions.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trialing:</span>
                  <span>{dashboard.subscriptions.trialing}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Past Due:</span>
                  <span className="text-red-600">{dashboard.subscriptions.past_due}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
