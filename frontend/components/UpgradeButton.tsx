'use client'

import { useState } from 'react'
import { createCheckoutSession } from '@/lib/api'
import { AlertCircle, Loader } from 'lucide-react'

export function UpgradeButton() {
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (plan: 'monthly' | 'annual') => {
    try {
      setLoadingPlan(plan)
      setError(null)

      const { checkout_url } = await createCheckoutSession(plan)

      if (checkout_url) {
        window.location.href = checkout_url
      } else {
        setError('Failed to create checkout session. Please try again.')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create checkout session'
      setError(errorMessage)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Button Group */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleUpgrade('monthly')}
          disabled={loadingPlan !== null}
          className="flex-1 relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingPlan === 'monthly' && (
            <Loader className="w-4 h-4 animate-spin" />
          )}
          Go Pro Monthly
        </button>

        <button
          onClick={() => handleUpgrade('annual')}
          disabled={loadingPlan !== null}
          className="flex-1 relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingPlan === 'annual' && (
            <Loader className="w-4 h-4 animate-spin" />
          )}
          Go Pro Annual
        </button>
      </div>

      {/* Subtext */}
      <p className="text-sm text-gray-600 text-center">
        Secure checkout powered by Stripe
      </p>
    </div>
  )
}
