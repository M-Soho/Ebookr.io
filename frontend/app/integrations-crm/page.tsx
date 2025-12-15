'use client'

import { useState } from 'react'

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'connections' | 'calendar' | 'webhooks' | 'api-keys'>('connections')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect your CRM with external services, calendars, and automation tools
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {(['connections', 'calendar', 'webhooks', 'api-keys'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Connections */}
        {activeTab === 'connections' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Google Calendar */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Google Calendar</h3>
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Sync meetings and events with Google Calendar
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Connect
                </button>
              </div>

              {/* Salesforce */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">☁️</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Salesforce</h3>
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Sync contacts and deals with Salesforce
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Connect
                </button>
              </div>

              {/* HubSpot */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">HubSpot</h3>
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Integrate with HubSpot CRM
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Connect
                </button>
              </div>

              {/* Zapier */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Zapier</h3>
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect to 5000+ apps via Zapier
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Connect
                </button>
              </div>

              {/* Slack */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Slack</h3>
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Get notifications in Slack
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Connect
                </button>
              </div>

              {/* Custom Webhook */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold">Custom</h3>
                    <span className="text-xs text-gray-500">Flexible</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Create a custom webhook integration
                </p>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Calendar Events</h2>
            <p className="text-gray-600 mb-6">
              View and manage synced calendar events
            </p>

            <div className="text-center text-gray-500 py-12">
              Connect a calendar integration to see your events here
            </div>
          </div>
        )}

        {/* Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Webhooks</h2>
                <p className="text-gray-600 mt-1">
                  Send real-time notifications to external services
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                + New Webhook
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sample Webhook</div>
                    <div className="text-sm text-gray-500">https://example.com/webhook</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
                    <button className="text-gray-600 hover:text-gray-900">⚙️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Keys */}
        {activeTab === 'api-keys' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">API Keys</h2>
                <p className="text-gray-600 mt-1">
                  Manage API keys for external access
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                + Generate Key
              </button>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <strong>Security Notice:</strong> API keys provide access to your account. 
                  Keep them secure and never share them publicly.
                </div>
              </div>
            </div>

            <div className="text-center text-gray-500 py-8">
              No API keys created yet. Generate a key to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
