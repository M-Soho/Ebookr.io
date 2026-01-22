'use client'

import { useState, useEffect } from 'react'
import { Zap, Plus, Play, Settings, TrendingUp, Clock, Target } from 'lucide-react'

interface AutomationRule {
  id: number
  name: string
  description: string
  trigger_type: string
  task_priority: string
  delay_hours: number
  is_active: boolean
  times_triggered: number
  tasks_created: number
}

interface AutomationStats {
  total_rules: number
  active_rules: number
  inactive_rules: number
  total_tasks_created: number
  recent_batches_30days: number
  rules_by_trigger_type: Record<string, number>
}

export default function TaskAutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [stats, setStats] = useState<AutomationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'activity',
    task_title_template: '',
    task_description_template: '',
    task_priority: 'medium',
    delay_hours: 24,
    reminder_offset_hours: 1,
    is_active: true,
  })

  useEffect(() => {
    fetchRules()
    fetchStats()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/task-automation/rules/', {
        credentials: 'include',
      })
      const data = await response.json()
      setRules(data.rules || [])
    } catch (error) {
      console.error('Failed to fetch rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/task-automation/stats/', {
        credentials: 'include',
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:8000/api/task-automation/rules/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({
          name: '',
          description: '',
          trigger_type: 'activity',
          task_title_template: '',
          task_description_template: '',
          task_priority: 'medium',
          delay_hours: 24,
          reminder_offset_hours: 1,
          is_active: true,
        })
        fetchRules()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  const toggleRule = async (ruleId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:8000/api/task-automation/rules/${ruleId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        fetchRules()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      activity: '⚡ Activity',
      status_change: '🔄 Status Change',
      new_contact: '👤 New Contact',
      cadence: '📅 Cadence',
      overdue_followup: '⏰ Overdue',
      time_based: '🕐 Time-based',
    }
    return labels[triggerType] || triggerType
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    }
    return colors[priority] || colors.medium
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="text-blue-600" size={32} />
                Task Automation
              </h1>
              <p className="text-gray-600 mt-2">
                Automatically create and schedule tasks based on triggers
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              New Rule
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Rules</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_rules}</p>
                </div>
                <Settings className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Rules</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active_rules}</p>
                </div>
                <Play className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tasks Created</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.total_tasks_created}</p>
                </div>
                <Target className="text-purple-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Recent Batches</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.recent_batches_30days}</p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
                <Clock className="text-orange-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Automation Rules</h2>
          </div>

          {rules.length === 0 ? (
            <div className="p-12 text-center">
              <Zap className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 mb-4">No automation rules yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Rule
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <div key={rule.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                          {getTriggerLabel(rule.trigger_type)}
                        </span>
                        <span className={`px-3 py-1 text-xs rounded-full border ${getPriorityColor(rule.task_priority)}`}>
                          {rule.task_priority}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            rule.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {rule.is_active ? '✓ Active' : '○ Inactive'}
                        </span>
                      </div>

                      {rule.description && (
                        <p className="text-gray-600 mb-3">{rule.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>⏱️ Delay: {rule.delay_hours}h</span>
                        <span>🎯 Triggered: {rule.times_triggered}x</span>
                        <span>✅ Tasks Created: {rule.tasks_created}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleRule(rule.id, rule.is_active)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          rule.is_active
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {rule.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create Automation Rule</h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Type
                    </label>
                    <select
                      value={formData.trigger_type}
                      onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="activity">Activity Trigger</option>
                      <option value="status_change">Status Change</option>
                      <option value="new_contact">New Contact</option>
                      <option value="cadence">Contact Cadence</option>
                      <option value="overdue_followup">Overdue Follow-up</option>
                      <option value="time_based">Time-based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Priority
                    </label>
                    <select
                      value={formData.task_priority}
                      onChange={(e) => setFormData({ ...formData, task_priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title Template *
                  </label>
                  <input
                    type="text"
                    value={formData.task_title_template}
                    onChange={(e) => setFormData({ ...formData, task_title_template: e.target.value })}
                    placeholder="e.g., Follow up with {{contact_name}}"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {"{{contact_name}}"}, {"{{activity_type}}"}, etc.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Description Template
                  </label>
                  <textarea
                    value={formData.task_description_template}
                    onChange={(e) => setFormData({ ...formData, task_description_template: e.target.value })}
                    placeholder="Automated task description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.delay_hours}
                      onChange={(e) => setFormData({ ...formData, delay_hours: parseInt(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reminder Offset (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.reminder_offset_hours}
                      onChange={(e) => setFormData({ ...formData, reminder_offset_hours: parseInt(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Activate immediately
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
