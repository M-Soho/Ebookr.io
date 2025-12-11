import { notFound, redirect } from 'next/navigation'
import { getContact, deleteContact } from '@/lib/api'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

async function fetchContact(id: string) {
  try {
    // Get the auth token from cookies (mock-token-1 in this case)
    const response = await fetch(
      `http://localhost:8000/api/contacts/${id}/`,
      {
        headers: {
          'Authorization': 'Bearer mock-token-1',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        notFound()
      }
      throw new Error('Failed to fetch contact')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching contact:', error)
    notFound()
  }
}

export const metadata = {
  title: 'Contact Details',
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'lead':
      return 'bg-blue-100 text-blue-800'
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'lost':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function ContactDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const contact = await fetchContact(params.id)

  if (!contact) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Contacts</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {contact.first_name} {contact.last_name}
              </h1>
              <p className="text-lg text-gray-600">{contact.email}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                contact.status
              )}`}
            >
              {contact.status}
            </span>
          </div>

          {/* Contact Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Company
              </h3>
              <p className="text-lg text-gray-900">{contact.company || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Source
              </h3>
              <p className="text-lg text-gray-900">{contact.source || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Type
              </h3>
              <p className="text-lg text-gray-900">{contact.contact_type || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Contact Cadence
              </h3>
              <p className="text-lg text-gray-900">
                {contact.contact_cadence || '-'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Preference
              </h3>
              <p className="text-lg text-gray-900">{contact.contact_pref || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Drip Campaign
              </h3>
              <p className="text-lg text-gray-900">
                {contact.drip_campaign_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Next Follow-Up
              </h3>
              <p className="text-lg text-gray-900">
                {formatDate(contact.next_follow_up_at)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Last Contacted
              </h3>
              <p className="text-lg text-gray-900">
                {formatDate(contact.last_contacted_at)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Created
              </h3>
              <p className="text-lg text-gray-900">{formatDate(contact.created_at)}</p>
            </div>
          </div>

          {/* Drip Campaign Config */}
          {contact.drip_campaign_config && (
            <div className="mb-8 pb-6 border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Drip Campaign Configuration
              </h2>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto text-sm text-gray-700">
                {JSON.stringify(contact.drip_campaign_config, null, 2)}
              </pre>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="mb-8 pb-6 border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 border-t border-gray-200 pt-6">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
