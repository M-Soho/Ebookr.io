import Link from 'next/link'
import { Check } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-16 text-white">
        <h1 className="text-5xl font-bold mb-4">Ebookr</h1>
        <p className="text-2xl text-blue-100 mb-8 max-w-2xl">
          Powerful CRM and follow-up automation for freelancers
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="#pricing"
            className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Contact Management
            </h3>
            <p className="text-gray-600">
              Organize and track all your contacts in one place with rich notes
              and custom fields.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⏰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Automated Follow-ups
            </h3>
            <p className="text-gray-600">
              Set up drip campaigns to automatically send follow-up emails
              based on your schedule.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reports & Analytics
            </h3>
            <p className="text-gray-600">
              Track campaign performance and contact engagement with detailed
              reports and insights.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 text-lg">One plan with everything you need</p>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-8 text-white shadow-lg border-2 border-blue-600 relative">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
              Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
            <p className="text-blue-100 mb-6">Everything you need to scale</p>
            <div className="text-4xl font-bold mb-6">
              $16.99<span className="text-lg text-blue-100 font-normal">/month</span>
            </div>
            <Link
              href="/signup"
              className="block w-full bg-white text-blue-600 py-3 rounded-lg font-semibold text-center hover:bg-blue-50 transition-colors mb-8"
            >
              Get Started Now
            </Link>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>Unlimited contacts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>Complete contact management</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>Automated drip campaigns</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>Advanced automation & workflows</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>AI-powered email generation</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>AI contact insights & scoring</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>Advanced analytics & reports</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>Team collaboration</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>CRM integrations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-300 flex-shrink-0 mt-1" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to scale your freelance business?
        </h2>
        <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
          Join hundreds of freelancers using Ebookr to manage their contacts and automate follow-ups.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Get Started Now - $16.99/month
        </Link>
      </div>
    </div>
  )
}
