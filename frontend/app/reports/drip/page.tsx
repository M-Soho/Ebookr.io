import { getDripCampaignsReport } from '@/lib/api'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Drip Campaigns Report - Ebookr',
  description: 'Drip campaign statistics',
}

const mockReport = {
  total_campaigns: 3,
  counts_by_status: { active: 2, completed: 1 },
  campaigns: [
    {
      campaign_id: 101,
      contact_id: 1,
      contact_email: 'alice@example.com',
      status: 'active',
      steps_total: 3,
      steps_sent: 1,
      started_at: '2025-11-01T10:00:00Z',
      completed_at: null,
      last_step_sent_at: '2025-11-02T10:00:00Z',
      created_at: '2025-11-01T09:59:00Z',
      updated_at: '2025-11-02T10:00:00Z',
    },
    {
      campaign_id: 102,
      contact_id: 2,
      contact_email: 'bob@example.com',
      status: 'completed',
      steps_total: 2,
      steps_sent: 2,
      started_at: '2025-10-01T10:00:00Z',
      completed_at: '2025-10-10T12:00:00Z',
      last_step_sent_at: '2025-10-10T12:00:00Z',
      created_at: '2025-10-01T09:59:00Z',
      updated_at: '2025-10-10T12:00:00Z',
    },
    {
      campaign_id: 103,
      contact_id: 3,
      contact_email: 'carol@example.com',
      status: 'active',
      steps_total: 4,
      steps_sent: 0,
      started_at: null,
      completed_at: null,
      last_step_sent_at: null,
      created_at: '2025-12-01T09:59:00Z',
      updated_at: '2025-12-01T09:59:00Z',
    },
  ],
}

export default async function DripReportPage() {
  let report: any = null
  let error: string | null = null

  try {
    report = await getDripCampaignsReport()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load report'
    report = mockReport
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Drip Campaigns</h1>

      {error ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <strong className="block">Using mock data</strong>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total campaigns</div>
          <div className="text-2xl font-bold">{report.total_campaigns}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">By status</div>
          <div className="mt-2">
            {Object.entries(report.counts_by_status as Record<string, number>).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="capitalize">{k}</span>
                <span>{v as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-medium mb-2">Campaigns</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2 border-b">ID</th>
                <th className="p-2 border-b">Contact</th>
                <th className="p-2 border-b">Status</th>
                <th className="p-2 border-b">Steps</th>
                <th className="p-2 border-b">Sent</th>
                <th className="p-2 border-b">Last Sent</th>
              </tr>
            </thead>
            <tbody>
              {report.campaigns.map((c: any) => (
                <tr key={c.campaign_id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">{c.campaign_id}</td>
                  <td className="p-2 border-b">{c.contact_email}</td>
                  <td className="p-2 border-b capitalize">{c.status}</td>
                  <td className="p-2 border-b">{c.steps_total}</td>
                  <td className="p-2 border-b">{c.steps_sent}</td>
                  <td className="p-2 border-b">{c.last_step_sent_at || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
