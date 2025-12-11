"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateContact, Contact } from '@/lib/api'
import { X } from 'lucide-react'
import Modal from './Modal'

interface EditContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact
}

export function EditContactModal({ open, onOpenChange, contact }: EditContactModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    company: contact.company,
    source: contact.source,
    status: contact.status as Contact['status'],
    contact_type: contact.contact_type as Contact['contact_type'],
    contact_cadence: contact.contact_cadence as Contact['contact_cadence'],
    contact_pref: contact.contact_pref as Contact['contact_pref'],
    drip_campaign_enabled: contact.drip_campaign_enabled,
    drip_campaign_config: contact.drip_campaign_config
      ? JSON.stringify(contact.drip_campaign_config)
      : null as any,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.first_name.trim()) {
      setError('First name is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    startTransition(async () => {
      try {
        await updateContact(contact.id, {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
          source: formData.source.trim(),
          status: formData.status,
          contact_type: formData.contact_type,
          contact_cadence: formData.contact_cadence,
          contact_pref: formData.contact_pref,
          drip_campaign_enabled: formData.drip_campaign_enabled,
          drip_campaign_config: formData.drip_campaign_enabled
            ? (() => {
                try {
                  return JSON.parse(formData.drip_campaign_config || 'null')
                } catch (e) {
                  return formData.drip_campaign_config
                }
              })()
            : null,
        })

        // Close modal
        onOpenChange(false)

        // Refresh contacts list and detail page
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update contact')
      }
    })
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h3 className="text-xl font-semibold text-gray-900">Edit Contact</h3>
        <button
          onClick={() => onOpenChange(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={isPending}
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="John"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            disabled={isPending}
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="Doe"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            required
            disabled={isPending}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="john@example.com"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input
            type="text"
            disabled={isPending}
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="Acme Inc"
          />
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <input
            type="text"
            disabled={isPending}
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            placeholder="Website, Referral, LinkedIn, etc."
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            disabled={isPending}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Contact['status'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Contact Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            disabled={isPending}
            value={formData.contact_type}
            onChange={(e) => setFormData({ ...formData, contact_type: e.target.value as Contact['contact_type'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="contact">Contact</option>
            <option value="company">Company</option>
          </select>
        </div>

        {/* Cadence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Cadence</label>
          <select
            disabled={isPending}
            value={formData.contact_cadence}
            onChange={(e) => setFormData({ ...formData, contact_cadence: e.target.value as Contact['contact_cadence'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        {/* Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Preference</label>
          <select
            disabled={isPending}
            value={formData.contact_pref}
            onChange={(e) => setFormData({ ...formData, contact_pref: e.target.value as Contact['contact_pref'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="sms">SMS</option>
            <option value="none">None</option>
          </select>
        </div>

        {/* Drip Campaign Toggle */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Drip Campaign</label>
          <label className="inline-flex items-center gap-2 ml-2">
            <input
              type="checkbox"
              checked={formData.drip_campaign_enabled}
              onChange={(e) => setFormData({ ...formData, drip_campaign_enabled: e.target.checked })}
            />
            <span className="text-sm text-gray-600">Enabled</span>
          </label>
        </div>

        {formData.drip_campaign_enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drip Config (JSON)</label>
            <textarea
              disabled={isPending}
              value={formData.drip_campaign_config || ''}
              onChange={(e) => setFormData({ ...formData, drip_campaign_config: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder='{"sequence":[{"delay_days":0,"template":"Welcome"}]}'
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 pt-4 mt-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && (
              <svg
                className="w-4 h-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
