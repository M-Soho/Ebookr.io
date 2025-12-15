'use client'

import { useState, useEffect } from 'react'

interface ABTest {
  id: number
  name: string
  workflow_id: number
  workflow_name: string
  split_percentage: number
  variant_a_enrolled: number
  variant_b_enrolled: number
  variant_a_converted: number
  variant_b_converted: number
  variant_a_conversion_rate: number
  variant_b_conversion_rate: number
  winner: string
  is_active: boolean
}

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchABTests()
  }, [])

  const fetchABTests = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/workflows/ab-tests/', {
        credentials: 'include',
      })
      const data = await response.json()
      setTests(data.ab_tests)
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error)
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">A/B Test Results</h1>
          <p className="text-gray-600 mt-2">
            Compare variant performance and optimize your workflows
          </p>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500 mb-4">No A/B tests configured yet</div>
            <p className="text-sm text-gray-400">
              Create A/B tests in your workflows to compare different approaches
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{test.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Workflow: {test.workflow_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        test.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {test.is_active ? 'Active' : 'Ended'}
                    </span>
                    {test.winner !== 'Tie' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Winner: Variant {test.winner}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Variant A */}
                  <div className="border-2 border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Variant A
                      </h3>
                      {test.winner === 'A' && (
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Enrolled</div>
                        <div className="text-3xl font-bold text-gray-900">
                          {test.variant_a_enrolled}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Converted</div>
                        <div className="text-3xl font-bold text-green-600">
                          {test.variant_a_converted}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-2">
                          Conversion Rate
                        </div>
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{
                              width: `${Math.min(test.variant_a_conversion_rate, 100)}%`,
                            }}
                          >
                            {test.variant_a_conversion_rate > 10 &&
                              `${test.variant_a_conversion_rate.toFixed(1)}%`}
                          </div>
                        </div>
                        {test.variant_a_conversion_rate <= 10 && (
                          <div className="text-sm text-gray-600 mt-1">
                            {test.variant_a_conversion_rate.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Variant B */}
                  <div className="border-2 border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Variant B
                      </h3>
                      {test.winner === 'B' && (
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Enrolled</div>
                        <div className="text-3xl font-bold text-gray-900">
                          {test.variant_b_enrolled}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Converted</div>
                        <div className="text-3xl font-bold text-green-600">
                          {test.variant_b_converted}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-2">
                          Conversion Rate
                        </div>
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{
                              width: `${Math.min(test.variant_b_conversion_rate, 100)}%`,
                            }}
                          >
                            {test.variant_b_conversion_rate > 10 &&
                              `${test.variant_b_conversion_rate.toFixed(1)}%`}
                          </div>
                        </div>
                        {test.variant_b_conversion_rate <= 10 && (
                          <div className="text-sm text-gray-600 mt-1">
                            {test.variant_b_conversion_rate.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Split: {test.split_percentage}% / {100 - test.split_percentage}%
                    </div>
                    <div className="text-sm font-medium">
                      {test.winner === 'Tie' ? (
                        <span className="text-gray-600">No clear winner yet</span>
                      ) : (
                        <span className="text-green-600">
                          Variant {test.winner} winning by{' '}
                          {Math.abs(
                            test.variant_a_conversion_rate -
                              test.variant_b_conversion_rate
                          ).toFixed(1)}
                          %
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
