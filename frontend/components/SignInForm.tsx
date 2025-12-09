"use client"

import React, { useState } from 'react'
import supabase from '@/lib/supabase'

export default function SignInForm({ onSignedIn }: { onSignedIn?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function doSignIn() {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const res = await supabase.signIn(email, password)
      if (res && res.data && res.data.session) {
        setMessage('Signed in successfully')
        if (onSignedIn) onSignedIn()
        else try { window.location.href = '/' } catch (e) {}
      } else {
        setError('Sign in failed')
      }
    } catch (e: any) {
      setError(e?.message || 'Sign in error')
    } finally {
      setLoading(false)
    }
  }

  async function doSignUp() {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const res = await supabase.signUp(email, password)
      if (res && res.data && res.data.session) {
        setMessage('Account created and signed in')
        if (onSignedIn) onSignedIn()
        else try { window.location.href = '/' } catch (e) {}
      } else {
        setError('Sign up failed')
      }
    } catch (e: any) {
      setError(e?.message || 'Sign up error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Sign In / Sign Up</h2>

      {message && (
        <div className="mb-3 text-sm text-green-700 bg-green-50 p-2 rounded">{message}</div>
      )}
      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>
      )}

      <label className="block text-sm font-medium text-gray-700">Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1 mb-3 block w-full border rounded px-3 py-2"
        type="email"
        placeholder="you@example.com"
      />

      <label className="block text-sm font-medium text-gray-700">Password</label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1 mb-4 block w-full border rounded px-3 py-2"
        type="password"
        placeholder="password"
      />

      <div className="flex gap-3">
        <button
          onClick={doSignIn}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <button
          onClick={doSignUp}
          disabled={loading}
          className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
        >
          {loading ? 'Working...' : 'Sign Up'}
        </button>
      </div>
    </div>
  )
}
