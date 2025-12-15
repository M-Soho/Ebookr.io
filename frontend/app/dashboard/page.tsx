'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardSummary {
  summary: {
    total_contacts: number
    new_contacts_today: number
    new_contacts_week: number
    new_contacts_month: number
    activities_today: number
    activities_week: number
    emails_sent_week: number
    emails_opened_week: number
    email_open_rate: number
    total_tasks: number
    completed_tasks: number
    overdue_tasks: number
    active_campaigns: number
    avg_lead_score: number
  }
  leads_by_status: Array<{ status: string; count: number }>
  top_contacts: Array<{
    id: number
    name: string
    email: string
    lead_score: number
    status: string
  }>
  recent_activities: Array<{
    id: number
    type: string
    title: string
    contact_name: string
    contact_id: number
    created_at: string
  }>
}

interface ContactsOverTime {
  period_days: number
  daily_counts: Array<{ date: string; count: number }>
  cumulative: Array<{ date: string; total: number }>
}

interface ActivityBreakdown {
  period_days: number
  activities: Array<{ activity_type: string; count: number }>
}

interface ConversionFunnel {
  period_days: number
  funnel: Array<{
    stage: string
    count: number
    conversion_rate: number
  }>
  overall_conversion_rate: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [contactsData, setContactsData] = useState<ContactsOverTime | null>(null)
  const [activityData, setActivityData] = useState<ActivityBreakdown | null>(null)
  const [funnelData, setFunnelData] = useState<ConversionFunnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchDashboardData()
  }, [period])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all analytics data in parallel
      const [summaryRes, contactsRes, activityRes, funnelRes] = await Promise.all([
        fetch('http://localhost:8000/api/analytics/dashboard/', {
          credentials: 'include',
        }),
        fetch(`http://localhost:8000/api/analytics/contacts-over-time/?period=${period}`, {
          credentials: 'include',
        }),
        fetch(`http://localhost:8000/api/analytics/activity-breakdown/?period=${period}`, {
          credentials: 'include',
        }),
        fetch(`http://localhost:8000/api/analytics/conversion-funnel/?period=${period}`, {
          credentials: 'include',
        }),
      ])

      const summaryData = await summaryRes.json()
      const contactsData = await contactsRes.json()
      const activityData = await activityRes.json()
      const funnelData = await funnelRes.json()

      setSummary(summaryData)
      setContactsData(contactsData)
      setActivityData(activityData)
      setFunnelData(funnelData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !summary || !contactsData || !activityData || !funnelData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Contacts"
            value={summary.summary.total_contacts}
            subtitle={`+${summary.summary.new_contacts_week} this week`}
            color="blue"
          />
          <MetricCard
            title="Activities"
            value={summary.summary.activities_week}
            subtitle="this week"
            color="green"
          />
          <MetricCard
            title="Email Open Rate"
            value={`${summary.summary.email_open_rate}%`}
            subtitle={`${summary.summary.emails_sent_week} sent`}
            color="purple"
          />
          <MetricCard
            title="Avg Lead Score"
            value={Math.round(summary.summary.avg_lead_score)}
            subtitle="out of 100"
            color="yellow"
          />
        </div>

        {/* Tasks Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Tasks Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{summary.summary.total_tasks}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{summary.summary.completed_tasks}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{summary.summary.overdue_tasks}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        </div>

        {/* Contact Growth */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Contact Growth</h2>
          <div className="h-64">
            <SimpleLineChart data={contactsData.cumulative} />
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
          <div className="space-y-4">
            {funnelData.funnel.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{stage.stage}</span>
                  <span className="text-sm text-gray-600">
                    {stage.count} contacts ({stage.conversion_rate.toFixed(1)}%)
                  </span>
                </div>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                    style={{
                      width: `${stage.conversion_rate}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Overall Conversion Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {funnelData.overall_conversion_rate.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Leads by Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Leads by Status</h2>
            <div className="space-y-3">
              {summary.leads_by_status.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                    <span className="capitalize">{item.status}</span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Activity Breakdown</h2>
            <div className="space-y-3">
              {activityData.activities.slice(0, 8).map((item) => (
                <div key={item.activity_type} className="flex items-center justify-between">
                  <span className="capitalize">{item.activity_type.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Contacts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Contacts by Lead Score</h2>
          <div className="space-y-3">
            {summary.top_contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => router.push(`/contacts/${contact.id}`)}
              >
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-gray-600">{contact.email}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{contact.lead_score}</div>
                  <div className="text-sm text-gray-600 capitalize">{contact.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {summary.recent_activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => router.push(`/contacts/${activity.contact_id}`)}
              >
                <div className={`mt-1 w-2 h-2 rounded-full ${getActivityColor(activity.type)}`} />
                <div className="flex-1">
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-gray-600">{activity.contact_name}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string
  value: string | number
  subtitle: string
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  }[color]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
  )
}

function SimpleLineChart({ data }: { data: Array<{ date: string; total: number }> }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500">No data available</div>
  }

  const maxValue = Math.max(...data.map((d) => d.total))
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.total / maxValue) * 80 - 10,
  }))

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          d={pathData}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3B82F6" />
        ))}
      </svg>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    lead: 'bg-gray-400',
    contacted: 'bg-blue-400',
    qualified: 'bg-green-400',
    proposal: 'bg-yellow-400',
    negotiation: 'bg-orange-400',
    customer: 'bg-green-600',
    lost: 'bg-red-400',
  }
  return colors[status] || 'bg-gray-400'
}

function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    email_sent: 'bg-blue-400',
    email_opened: 'bg-green-400',
    call_made: 'bg-purple-400',
    meeting: 'bg-yellow-400',
    note: 'bg-gray-400',
  }
  return colors[type] || 'bg-gray-400'
}
