'use client'

import { useState } from 'react'

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'scores' | 'predictions' | 'recommendations'>('email')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Features</h1>
          <p className="text-gray-600 mt-2">
            AI-powered tools for email generation, contact scoring, and predictive analytics
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {(['email', 'scores', 'predictions', 'recommendations'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'email' && 'Email Generator'}
                {tab === 'scores' && 'Contact Scores'}
                {tab === 'predictions' && 'Predictions'}
                {tab === 'recommendations' && 'Recommendations'}
              </button>
            ))}
          </div>
        </div>

        {/* Email Generator */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">AI Email Generator</h2>
            <p className="text-gray-600 mb-6">
              Generate personalized emails using AI based on contact data and templates.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Introduction</option>
                  <option>Follow Up</option>
                  <option>Proposal</option>
                  <option>Thank You</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Casual</option>
                  <option>Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Add specific details or context..."
                />
              </div>

              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generate Email
              </button>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Preview</h3>
              <p className="text-sm text-gray-500">
                Generated email will appear here...
              </p>
            </div>
          </div>
        )}

        {/* Contact Scores */}
        {activeTab === 'scores' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Lead Scoring</h2>
            <p className="text-gray-600 mb-6">
              AI-powered lead scoring to prioritize your contacts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-gray-600">Hot Leads</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-gray-600">Warm Leads</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Cold Leads</div>
              </div>
            </div>

            <div className="text-center text-gray-500 py-8">
              No contact scores available. Calculate scores for your contacts to see insights.
            </div>
          </div>
        )}

        {/* Predictions */}
        {activeTab === 'predictions' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Predictive Analytics</h2>
            <p className="text-gray-600 mb-6">
              AI-powered predictions for contact growth, conversion rates, and engagement.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium">Contact Growth</div>
                  <div className="text-sm text-gray-500">30-day forecast</div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generate
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium">Conversion Rate</div>
                  <div className="text-sm text-gray-500">90-day forecast</div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generate
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium">Email Engagement</div>
                  <div className="text-sm text-gray-500">30-day forecast</div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Smart Recommendations</h2>
            <p className="text-gray-600 mb-6">
              AI-generated action items and suggestions to improve your workflow.
            </p>

            <div className="text-center text-gray-500 py-8">
              No recommendations available. The AI will analyze your data and provide suggestions.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
