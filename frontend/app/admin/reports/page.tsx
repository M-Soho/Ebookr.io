'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, Users, Mail, BarChart3 } from 'lucide-react';

interface AdminReport {
  signup_trends_30days: Array<{ date: string; count: number }>;
  tier_distribution: Record<string, number>;
  contact_statistics: {
    total: number;
    by_type: Record<string, number>;
  };
  campaign_statistics: {
    total: number;
    by_status: Record<string, number>;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    fetchReport();
  }, [router]);

  const fetchReport = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/admin/reports/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data: AdminReport = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/signin');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="animate-spin">
          <div className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-primary-600 transition hover:text-primary-700">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-neutral-900">Admin Reports</h1>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger-800">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-8">
            {/* 30-Day Signup Trends */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-6 w-6 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-900">30-Day Signup Trends</h2>
              </div>

              <div className="overflow-x-auto">
                <div className="min-h-64 flex items-end justify-around gap-2 p-4 bg-neutral-50 rounded-lg">
                  {report.signup_trends_30days.map((day, idx) => {
                    const maxCount = Math.max(...report.signup_trends_30days.map((d) => d.count)) || 1;
                    const height = ((day.count / maxCount) * 100) || 5;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-2"
                        title={`${day.date}: ${day.count} signups`}
                      >
                        <div
                          className="w-6 rounded-t-sm bg-primary-600 transition hover:bg-primary-700"
                          style={{ height: `${Math.max(height, 5)}px` }}
                        ></div>
                        <span className="text-xs text-neutral-600 whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Tier Distribution */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-accent-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">Tier Distribution</h2>
                </div>

                <div className="space-y-4">
                  {Object.entries(report.tier_distribution).map(([tier, count]) => {
                    const total = Object.values(report.tier_distribution).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={tier}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-700 capitalize">
                            {tier}
                          </span>
                          <span className="text-sm font-semibold text-neutral-900">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-200">
                          <div
                            className="h-full rounded-full bg-accent-600"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Statistics */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="h-6 w-6 text-success-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">Contact Statistics</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg bg-primary-50 p-4">
                    <p className="text-sm text-primary-700">Total Contacts</p>
                    <p className="text-3xl font-bold text-primary-900 mt-2">
                      {report.contact_statistics.total}
                    </p>
                  </div>

                  {Object.entries(report.contact_statistics.by_type).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-3">By Type</p>
                      <div className="space-y-2">
                        {Object.entries(report.contact_statistics.by_type).map(
                          ([type, count]) => (
                            <div
                              key={type}
                              className="flex items-center justify-between p-2 rounded bg-neutral-50"
                            >
                              <span className="text-sm text-neutral-600 capitalize">{type}</span>
                              <span className="text-sm font-semibold text-neutral-900">
                                {count}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign Statistics */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-6 w-6 text-warning-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Campaign Statistics</h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg bg-warning-50 p-4">
                  <p className="text-sm text-warning-700">Total Campaigns</p>
                  <p className="text-3xl font-bold text-warning-900 mt-2">
                    {report.campaign_statistics.total}
                  </p>
                </div>

                {Object.entries(report.campaign_statistics.by_status).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-lg p-4"
                    style={{
                      backgroundColor:
                        status === 'active'
                          ? 'rgb(240, 253, 244)'
                          : status === 'draft'
                            ? 'rgb(249, 250, 251)'
                            : 'rgb(254, 242, 242)',
                    }}
                  >
                    <p
                      className="text-sm capitalize"
                      style={{
                        color:
                          status === 'active'
                            ? 'rgb(20, 83, 45)'
                            : status === 'draft'
                              ? 'rgb(55, 65, 81)'
                              : 'rgb(127, 29, 29)',
                      }}
                    >
                      {status} Campaigns
                    </p>
                    <p
                      className="text-2xl font-bold mt-2"
                      style={{
                        color:
                          status === 'active'
                            ? 'rgb(5, 46, 22)'
                            : status === 'draft'
                              ? 'rgb(17, 24, 39)'
                              : 'rgb(71, 5, 5)',
                      }}
                    >
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Export Reports</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Download comprehensive reports in CSV format for further analysis.
              </p>
              <button
                className="btn-primary"
                onClick={() => alert('Export feature coming soon!')}
              >
                Export as CSV
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
