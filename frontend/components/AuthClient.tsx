"use client"

import React, { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import dynamic from 'next/dynamic'
import Modal from '@/components/Modal'

const SignInForm = dynamic(() => import('@/components/SignInForm'), { ssr: false })

export default function AuthClient() {
  const [session, setSession] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const s = supabase.getSession()
    setSession(s.data.session)
  }, [])

  function handleSignIn() {
    setShowForm(true)
  }

  function onSignedIn() {
    const s = supabase.getSession()
    setSession(s.data.session)
    setShowForm(false)
  }

  function handleSignOut() {
    supabase.signOut()
    setSession(null)
    try { window.location.reload() } catch (e) {}
  }

  if (!session) {
    return (
      <div className="text-right">
        <button
          onClick={handleSignIn}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Sign in
        </button>

        <Modal open={showForm} onOpenChange={setShowForm}>
          <div className="px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sign In</h3>
            <SignInForm onSignedIn={onSignedIn} />
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className="text-right">
      <p className="text-sm font-medium text-gray-900">{session.user.email}</p>
      <button
        onClick={handleSignOut}
        className="text-xs text-gray-500 hover:underline"
      >
        Sign out
      </button>
    </div>
  )
}
