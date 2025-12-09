"use client"

import React, { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { createContact } from '@/lib/api'

export default function DemoRunner() {
  const [logs, setLogs] = useState<string[]>([])
  const [running, setRunning] = useState(false)

  function log(line: string) {
    setLogs((s) => [...s, line])
  }

  async function run() {
    setRunning(true)
    log('Starting demo...')
    try {
      log('Signing in (mock supabase)')
      await supabase.signIn('demo@example.com', 'password')
      const { data } = supabase.getSession()
      log(`Signed in, token=${data?.session?.access_token}`)

      log('Creating demo contact...')
      const contact = await createContact({
        first_name: 'Auto',
        last_name: 'Demo',
        email: `auto+${Date.now()}@example.com`,
      } as any)
      log(`Created contact id=${contact.id} ${contact.first_name} ${contact.last_name}`)
    } catch (e: any) {
      log(`Error: ${e?.message || String(e)}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <h3 className="font-semibold mb-2">End-to-end Demo</h3>
      <p className="text-sm text-gray-600 mb-3">Signs in, creates a contact, and shows logs.</p>
      <div className="flex gap-2 mb-3">
        <button
          onClick={run}
          disabled={running}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          {running ? 'Running...' : 'Run Demo'}
        </button>
      </div>
      <div className="text-xs font-mono bg-gray-50 p-2 rounded h-40 overflow-auto">
        {logs.length === 0 ? <div className="text-gray-400">No logs yet</div> : logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
