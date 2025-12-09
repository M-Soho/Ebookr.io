import Link from 'next/link'
import { UpgradeButton } from '@/components/UpgradeButton'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-12 text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to Ebookr</h1>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl">
          A powerful CRM and follow-up automation platform for freelancers.
          Manage contacts, schedule follow-ups, and track your pipeline.
        </p>
        <div className="flex gap-4">
          <Link
            href="/contacts"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/settings"
            className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Contact Management
          </h2>
          <p className="text-gray-600">
            Organize and track all your contacts in one place with rich notes
            and custom fields.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">⏰</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Automated Follow-ups
          </h2>
          <p className="text-gray-600">
            Set up rules to automatically schedule follow-up emails based on
            your contact patterns.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">💳</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Stripe Integration
          </h2>
          <p className="text-gray-600">
            Manage subscriptions and billing with seamless Stripe integration
            and trial tracking.
          </p>
        </div>
      </div>

      {/* Upgrade CTA Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Scale Your Freelance Business?
          </h2>
          <p className="text-gray-600 mb-6">
            Upgrade to Pro and unlock unlimited contacts, advanced automation,
            and priority support. Start with a 14-day free trial.
          </p>
          <UpgradeButton />
        </div>
      </div>

      {/* Status Indicator */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          🚀 Dashboard Coming Soon
        </h3>
        <p className="text-yellow-800">
          The dashboard is under construction. Navigate to{' '}
          <Link href="/contacts" className="font-semibold hover:underline">
            Contacts
          </Link>{' '}
          to get started managing your contacts.
        </p>
      </div>
    </div>
  )
}
