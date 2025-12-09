"use client"

import React, { useState } from 'react'
import { createContact } from '@/lib/api'

export default function CreateContactDemo({ onCreated }: { onCreated?: (c: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const payload = {
        first_name: 'Demo',
        last_name: 'User',
        email: `demo+${Date.now()}@example.com`,
        company: 'Demo Co',
        source: 'Demo',
      }
      const contact = await createContact(payload)
      setMessage('Contact created')
      if (onCreated) onCreated(contact)
    } catch (e: any) {
      setError(e?.message || 'Failed to create contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Creating...' : 'Create Contact (Demo)'}
      </button>
      {message && <div className="text-sm text-green-700">{message}</div>}
      {error && <div className="text-sm text-red-700">{error}</div>}
    </div>
  )
}
