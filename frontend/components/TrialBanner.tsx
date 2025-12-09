'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface TrialBannerProps {
  trialEndsAt: string
}

export function TrialBanner({ trialEndsAt }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('trial-banner-dismissed')
    setIsDismissed(dismissed === 'true')
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('trial-banner-dismissed', 'true')
    setIsDismissed(true)
  }

  if (isDismissed) {
    return null
  }

  const trialEndDate = new Date(trialEndsAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <p className="text-sm text-blue-900">
          <strong>You're in a free trial.</strong> Your trial ends on{' '}
          <strong>{trialEndDate}</strong>. Add contacts and set up follow-ups
          now.
        </p>
        <button
          onClick={handleDismiss}
          className="ml-4 inline-flex text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Dismiss trial banner"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
