'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, CheckCircle, AlertCircle, Save } from 'lucide-react'

interface NotificationPreference {
  id: number
  notification_type: string
  in_app_enabled: boolean
  email_enabled: boolean
}

interface NotificationTypeConfig {
  type: string
  label: string
  description: string
  icon: React.ReactNode
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const notificationTypes: NotificationTypeConfig[] = [
    {
      type: 'task_assigned',
      label: 'Task Assigned',
      description: 'When a task is assigned to you',
      icon: <CheckCircle className="h-5 w-5 text-blue-600" />
    },
    {
      type: 'task_due',
      label: 'Task Due Soon',
      description: 'Reminders for upcoming task deadlines',
      icon: <AlertCircle className="h-5 w-5 text-orange-600" />
    },
    {
      type: 'task_overdue',
      label: 'Task Overdue',
      description: 'When a task becomes overdue',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />
    },
    {
      type: 'email_received',
      label: 'Email Received',
      description: 'When you receive an email from a contact',
      icon: <Mail className="h-5 w-5 text-purple-600" />
    },
    {
      type: 'contact_updated',
      label: 'Contact Updated',
      description: 'When contact information changes',
      icon: <Bell className="h-5 w-5 text-green-600" />
    },
    {
      type: 'mention',
      label: 'Mentions',
      description: 'When someone mentions you in a note or comment',
      icon: <MessageSquare className="h-5 w-5 text-indigo-600" />
    }
  ]

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/notifications/preferences/')
      const data = await response.json()
      setPreferences(data.preferences || [])
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      setMessage({ type: 'error', text: 'Failed to load preferences' })
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (type: string, field: 'in_app_enabled' | 'email_enabled', value: boolean) => {
    setPreferences(prev => {
      const existing = prev.find(p => p.notification_type === type)
      if (existing) {
        return prev.map(p => 
          p.notification_type === type 
            ? { ...p, [field]: value }
            : p
        )
      } else {
        return [...prev, {
          id: 0,
          notification_type: type,
          in_app_enabled: field === 'in_app_enabled' ? value : true,
          email_enabled: field === 'email_enabled' ? value : false
        }]
      }
    })
  }

  const savePreferences = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('http://localhost:8000/api/notifications/preferences/bulk-update/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences' })
    } finally {
      setSaving(false)
    }
  }

  const getPreference = (type: string): NotificationPreference => {
    return preferences.find(p => p.notification_type === type) || {
      id: 0,
      notification_type: type,
      in_app_enabled: true,
      email_enabled: false
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-gray-700" />
          <div>
            <h2 className="text-xl font-semibold">Notification Preferences</h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose how you want to be notified about different events
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Preferences List */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading preferences...</div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 pb-3 border-b text-sm font-medium text-gray-600">
              <div className="col-span-6">Notification Type</div>
              <div className="col-span-3 text-center">In-App</div>
              <div className="col-span-3 text-center">Email</div>
            </div>

            {/* Preference Rows */}
            {notificationTypes.map(config => {
              const pref = getPreference(config.type)
              return (
                <div key={config.type} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0">
                  {/* Type Info */}
                  <div className="col-span-6 flex items-start gap-3">
                    <div className="mt-1">{config.icon}</div>
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-sm text-gray-500">{config.description}</div>
                    </div>
                  </div>

                  {/* In-App Toggle */}
                  <div className="col-span-3 flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.in_app_enabled}
                        onChange={(e) => updatePreference(config.type, 'in_app_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email Toggle */}
                  <div className="col-span-3 flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.email_enabled}
                        onChange={(e) => updatePreference(config.type, 'email_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Changes are saved immediately when you toggle settings
        </p>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
