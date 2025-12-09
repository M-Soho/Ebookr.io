'use client'

import { useState } from 'react'
import { Contact } from '@/lib/api'
import { NewContactModal } from '@/components/NewContactModal'
import CreateContactDemo from '@/components/CreateContactDemo'
import { Plus, Mail, Building2 } from 'lucide-react'

interface ContactsPageClientProps {
  initialContacts: Contact[]
}

export function ContactsPageClient({
  initialContacts,
}: ContactsPageClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-1">
              Manage your contacts and schedule follow-ups
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateContactDemo
              onCreated={(c) => setContacts((s) => [c, ...s])}
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} />
              New Contact
            </button>
          </div>
        </div>

        {/* Contacts Table or Empty State */}
        {contacts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No contacts yet
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              No contacts yet. Add your first contact to start getting follow-up
              reminders.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Next Follow-Up
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Last Contacted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {contact.company || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            contact.status
                          )}`}
                        >
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {formatDate(contact.next_follow_up_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {formatDate(contact.last_contacted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(
                        contact.status
                      )}`}
                    >
                      {contact.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {contact.company && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 size={16} />
                        {contact.company}
                      </div>
                    )}
                    {contact.next_follow_up_at && (
                      <div className="text-gray-600">
                        <strong>Next Follow-Up:</strong>{' '}
                        {formatDate(contact.next_follow_up_at)}
                      </div>
                    )}
                    {contact.last_contacted_at && (
                      <div className="text-gray-600">
                        <strong>Last Contacted:</strong>{' '}
                        {formatDate(contact.last_contacted_at)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      <NewContactModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
