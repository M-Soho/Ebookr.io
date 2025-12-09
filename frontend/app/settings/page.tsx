'use client'

import { useState, useEffect } from 'react'
import { getSubscription, Subscription } from '@/lib/api'
import { UpgradeButton } from '@/components/UpgradeButton'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function SettingsPage() {
  // TODO: Once real auth is wired (Supabase), use the actual user ID for getSubscription()
  // For now, the backend uses the fake auth user ID (1) from lib/auth.ts
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSubscription()
        setSubscription(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load subscription'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'trialing':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const shouldShowUpgradeButton =
    !subscription ||
    subscription.status === 'trialing' ||
    subscription.status === 'canceled' ||
    subscription.status === 'past_due'

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and subscription</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile (takes 1 column on desktop) */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue="John Doe"
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to change your name
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  defaultValue="user@example.com"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to change your email
                </p>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue="December 9, 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subscription (takes 2 columns on desktop) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Subscription
            </h2>

            {error && (
              <div className="mb-6 flex gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600 mt-2 text-sm">Loading...</p>
                </div>
              </div>
            ) : subscription ? (
              <div className="space-y-6">
                {/* Status Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current Status */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(subscription.status)}
                      <p className="text-sm text-gray-600">Current Status</p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        subscription.status
                      )}`}
                    >
                      {subscription.status.charAt(0).toUpperCase() +
                        subscription.status.slice(1)}
                    </span>
                  </div>

                  {/* Current Plan */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Current Plan</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {subscription.plan === 'monthly'
                        ? 'Monthly'
                        : 'Annual'}{' '}
                      Plan
                    </p>
                  </div>
                </div>

                {/* Trial Info (if applicable) */}
                {subscription.status === 'trialing' &&
                  subscription.trial_end_at && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            Free Trial Active
                          </h4>
                          <p className="text-sm text-blue-800 mt-1">
                            Your trial ends on{' '}
                            <strong>
                              {formatDate(subscription.trial_end_at)}
                            </strong>
                            . Upgrade anytime to continue using Ebookr after
                            your trial ends.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Billing Period */}
                {subscription.current_period_start &&
                  subscription.current_period_end && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Current Billing Period
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                            From
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(subscription.current_period_start)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                            To
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(subscription.current_period_end)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Upgrade Section */}
                {shouldShowUpgradeButton && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Upgrade Your Plan
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Unlock unlimited contacts, advanced automation, and
                      priority support.
                    </p>
                    <UpgradeButton />
                  </div>
                )}

                {/* Active Subscription Info */}
                {subscription.status === 'active' &&
                  !shouldShowUpgradeButton && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900">
                            Subscription Active
                          </h4>
                          <p className="text-sm text-green-800 mt-1">
                            Your subscription is active and up to date. Enjoy
                            all Pro features!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <p className="text-gray-600 mb-4">
                    You don't have an active subscription yet.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Start with a 14-day free trial and upgrade anytime.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Get Started with Pro
                  </h4>
                  <UpgradeButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data & Privacy */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Data & Privacy
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Your data is encrypted and stored securely. We never share your
            contact information with third parties.
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            View Privacy Policy
          </button>
        </div>

        {/* Help & Support */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Help & Support
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Need help? Check out our documentation or contact our support team.
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}
