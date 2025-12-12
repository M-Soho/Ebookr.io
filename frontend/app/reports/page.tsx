import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports - Ebookr',
  description: 'Reports and analytics',
}

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <p className="text-sm text-gray-600">Available reports</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/reports/drip"
          className="block p-4 border rounded hover:shadow-sm"
        >
          <h2 className="font-medium">Drip Campaigns</h2>
          <p className="text-sm text-gray-500">Overview of drip campaign activity</p>
        </Link>
      </div>
    </div>
  )
}
