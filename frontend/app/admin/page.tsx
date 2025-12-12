'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Users, TrendingUp, Settings } from 'lucide-react';

interface DashboardMetrics {
  total_signups: number;
  tier_breakdown: Record<string, number>;
  signups_7days: number;
  total_contacts: number;
  active_campaigns: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/admin/dashboard/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard metrics');
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [router]);

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
            <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-neutral-200 bg-white px-4 py-8 md:block">
          <nav className="space-y-2">
            <Link
              href="/admin"
              className="block rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/signups"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Signups
            </Link>
            <Link
              href="/admin/api-config"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              API Configuration
            </Link>
            <Link
              href="/admin/email-config"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Email Configuration
            </Link>
            <Link
              href="/admin/settings"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Settings
            </Link>
            <Link
              href="/admin/reports"
              className="block rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Reports
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger-800">
              {error}
            </div>
          )}

          {metrics && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Signups */}
                <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Signups</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-900">
                        {metrics.total_signups}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                </div>

                {/* 7-Day Signups */}
                <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Last 7 Days</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-900">
                        {metrics.signups_7days}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-accent-600" />
                  </div>
                </div>

                {/* Total Contacts */}
                <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Contacts</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-900">
                        {metrics.total_contacts}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-success-600" />
                  </div>
                </div>

                {/* Active Campaigns */}
                <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Active Campaigns</p>
                      <p className="mt-2 text-3xl font-bold text-neutral-900">
                        {metrics.active_campaigns}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-warning-600" />
                  </div>
                </div>
              </div>

              {/* Tier Breakdown */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900">Signup Breakdown by Tier</h2>
                <div className="mt-6 space-y-4">
                  {Object.entries(metrics.tier_breakdown).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 capitalize">
                        {tier}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-32 rounded-full bg-neutral-200">
                          <div
                            className="h-full rounded-full bg-primary-600"
                            style={{
                              width: `${((count / metrics.total_signups) * 100) || 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-neutral-900 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/admin/signups"
                    className="btn-primary block text-center"
                  >
                    Manage Signups
                  </Link>
                  <Link
                    href="/admin/api-config"
                    className="btn-primary block text-center"
                  >
                    Configure APIs
                  </Link>
                  <Link
                    href="/admin/email-config"
                    className="btn-primary block text-center"
                  >
                    Email Settings
                  </Link>
                  <Link
                    href="/admin/reports"
                    className="btn-primary block text-center"
                  >
                    View Reports
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
