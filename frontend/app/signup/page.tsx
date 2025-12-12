'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Zap } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier') || 'starter'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required')
      setLoading(false)
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }
    if (!formData.password) {
      setError('Password is required')
      setLoading(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // For now, just store the signup info in localStorage and redirect to dashboard
      const signupData = {
        name: formData.name,
        email: formData.email,
        tier: tier,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('user_signup', JSON.stringify(signupData))
      localStorage.setItem('mock_session', JSON.stringify({
        access_token: 'mock-token-1',
      }))

      // Redirect to contacts page
      router.push('/contacts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
      setLoading(false)
    }
  }

  const tierInfo = tier === 'pro' ? {
    name: 'Pro',
    price: '$29/month',
    features: ['Automated drip campaigns', 'AI-powered features', 'Advanced analytics'],
    color: 'blue',
  } : {
    name: 'Starter',
    price: 'Free',
    features: ['Unlimited contacts', 'Basic management', 'Manual scheduling'],
    color: 'gray',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Left side - Sign up form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600 mb-6">
            Start managing your contacts today
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Confirm password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Sign in link */}
            <p className="text-center text-gray-600 text-sm">
              Already have an account?{' '}
              <Link href="/signin" className="text-blue-600 hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* Right side - Plan summary */}
        <div className="hidden md:flex flex-col justify-center">
          <div className={`bg-gradient-to-br ${tierInfo.color === 'pro' ? 'from-blue-600 to-purple-600' : 'from-gray-100 to-gray-200'} rounded-lg p-8 ${tierInfo.color === 'pro' ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex items-center gap-2 mb-6">
              <Zap size={24} />
              <h2 className="text-2xl font-bold">{tierInfo.name}</h2>
            </div>

            <div className={`text-4xl font-bold mb-6`}>
              {tierInfo.price}
            </div>

            <p className={`mb-8 ${tierInfo.color === 'pro' ? 'text-blue-100' : 'text-gray-600'}`}>
              {tier === 'pro' ? 'Everything you need to scale' : 'Perfect for getting started'}
            </p>

            <div className="space-y-4">
              {tierInfo.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tierInfo.color === 'pro' ? 'bg-green-400 text-white' : 'bg-green-200 text-green-700'
                  }`}>
                    ✓
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {tier === 'pro' && (
              <div className={`mt-8 p-4 rounded-lg ${tierInfo.color === 'pro' ? 'bg-blue-700' : 'bg-gray-300'}`}>
                <p className="text-sm font-semibold mb-1">14-day free trial</p>
                <p className={`text-sm ${tierInfo.color === 'pro' ? 'text-blue-100' : 'text-gray-600'}`}>
                  No credit card required. Cancel anytime.
                </p>
              </div>
            )}
          </div>

          <div className={`mt-8 p-6 rounded-lg ${tierInfo.color === 'pro' ? 'bg-blue-50' : 'bg-white'} border ${tierInfo.color === 'pro' ? 'border-blue-200' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-gray-900 mb-3">What's included</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Secure contact database</li>
              <li>✓ Follow-up automation</li>
              <li>✓ Real-time reports</li>
              {tier === 'pro' && <li>✓ AI-powered tools</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
