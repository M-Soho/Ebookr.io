'use client'

import { useState, useEffect } from 'react'

interface LeadSource {
  source: string
  total_leads: number
  qualified_leads: number
  converted_leads: number
  avg_lead_score: number
  conversion_rate: number
}

export default function LeadSourcesPage() {
  const [sources, setSources] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchLeadSources()
  }, [period])

  const fetchLeadSources = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `http://localhost:8000/api/analytics/lead-sources/?period=${period}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      setSources(data.sources)
    } catch (error) {
      console.error('Failed to fetch lead sources:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Lead Source Analytics</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {sources.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500 mb-4">No lead source data available</div>
            <p className="text-sm text-gray-400">
              Make sure your contacts have source information to see analytics
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qualified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Converted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sources.map((source, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{source.source}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{source.total_leads}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{source.qualified_leads}</div>
                      <div className="text-xs text-gray-500">
                        {source.total_leads > 0
                          ? `${((source.qualified_leads / source.total_leads) * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{source.converted_leads}</div>
                      <div className="text-xs text-gray-500">
                        {source.total_leads > 0
                          ? `${((source.converted_leads / source.total_leads) * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-gray-900">{source.avg_lead_score}</div>
                        <div
                          className="ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden"
                        >
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${source.avg_lead_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            source.conversion_rate >= 20
                              ? 'bg-green-100 text-green-800'
                              : source.conversion_rate >= 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {source.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Cards */}
        {sources.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-2">Best Performing Source</div>
              <div className="text-2xl font-bold text-gray-900">
                {sources[0]?.source || 'N/A'}
              </div>
              <div className="text-sm text-gray-500">
                {sources[0]?.conversion_rate.toFixed(1)}% conversion rate
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-2">Total Lead Sources</div>
              <div className="text-2xl font-bold text-gray-900">{sources.length}</div>
              <div className="text-sm text-gray-500">active sources</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-2">Total Leads</div>
              <div className="text-2xl font-bold text-gray-900">
                {sources.reduce((sum, s) => sum + s.total_leads, 0)}
              </div>
              <div className="text-sm text-gray-500">across all sources</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
