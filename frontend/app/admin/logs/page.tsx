'use client'

import { useState, useEffect } from 'react'
import { Activity, Filter, Clock, User, Mail, CheckCircle } from 'lucide-react'

interface ActivityLog {
  id: number
  type: string
  title: string
  description: string
  created_at: string
  user: {
    id: number
    username: string
  } | null
  contact_id: number | null
}

interface ActivityStats {
  total: number
  by_type: Array<{
    activity_type: string
    count: number
  }>
}

export default function ActivityLogsPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(24)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchActivityLogs()
  }, [hours])

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/logs/activity/?hours=${hours}`
      )
      const data = await response.json()
      if (data.success) {
        setActivities(data.activities)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => 
    filterType === 'all' || activity.type === filterType
  )

  const activityTypes = stats?.by_type.map(t => t.activity_type) || []
  const uniqueTypes = ['all', ...new Set(activityTypes)]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
      case 'email_opened':
      case 'email_clicked':
        return <Mail className="h-5 w-5 text-blue-600" />
      case 'task_created':
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'note_added':
        return <Activity className="h-5 w-5 text-purple-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600 mt-1">System-wide activity monitoring and audit trail</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          {stats.by_type.slice(0, 3).map(item => (
            <div key={item.activity_type} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                {getActivityIcon(item.activity_type)}
                <div>
                  <p className="text-sm text-gray-600 capitalize">
                    {item.activity_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold">{item.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={72}>Last 3 Days</option>
              <option value={168}>Last Week</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Activity Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchActivityLogs}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
          
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activities found for the selected filters
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map(activity => (
                <div key={activity.id} className="flex gap-4 p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{activity.title}</h3>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.created_at).toLocaleString()}
                          </div>
                          {activity.user && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.user.username}
                            </div>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {activity.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination info */}
        <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-600 text-center">
          Showing {filteredActivities.length} activities from the last {hours} hours
        </div>
      </div>
    </div>
  )
}
