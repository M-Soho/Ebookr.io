import { getContacts } from '@/lib/api'
import { ContactsPageClient } from './contacts-page-client'

export const metadata = {
  title: 'Contacts - Ebookr',
  description: 'Manage your contacts and follow-ups',
}

export default async function ContactsPage() {
  // TODO: Once real auth is wired (Supabase), pass the actual user ID to getContacts()
  // For now, the backend uses the fake auth user ID (1) from lib/auth.ts
  let contacts = []
  let error: string | null = null

  try {
    contacts = await getContacts()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load contacts'
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        <h2 className="text-lg font-semibold mb-2">Error Loading Contacts</h2>
        <p>{error}</p>
        <p className="text-sm mt-4">
          Make sure the Django backend is running at{' '}
          <code className="bg-red-100 px-2 py-1 rounded">
            {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}
          </code>
        </p>
      </div>
    )
  }

  return <ContactsPageClient initialContacts={contacts} />
}
