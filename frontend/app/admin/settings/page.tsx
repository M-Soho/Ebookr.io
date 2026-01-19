'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Settings } from 'lucide-react';

interface AdminSettings {
  id: number;
  enable_drip_campaigns: boolean;
  enable_ai_features: boolean;
  enable_reports: boolean;
  rate_limit_requests_per_minute: number;
  welcome_email_enabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [dripCampaignsEnabled, setDripCampaignsEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [reportsEnabled, setReportsEnabled] = useState(true);
  const [rateLimit, setRateLimit] = useState('1000');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/admin/settings/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data: AdminSettings = await response.json();
      setSettings(data);
      setDripCampaignsEnabled(data.enable_drip_campaigns);
      setAiEnabled(data.enable_ai_features);
      setReportsEnabled(data.enable_reports);
      setRateLimit(data.rate_limit_requests_per_minute.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/admin/settings/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enable_drip_campaigns: dripCampaignsEnabled,
          enable_ai_features: aiEnabled,
          enable_reports: reportsEnabled,
          rate_limit_requests_per_minute: parseInt(rateLimit),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setError('');
      await fetchSettings();
      alert('Settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
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
              <h1 className="text-2xl font-bold text-neutral-900">Admin Settings</h1>
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

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger-800">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Feature Flags */}
            <div className="border-b border-neutral-200 pb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Feature Flags</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg border border-neutral-200 transition hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-900">Drip Campaigns</p>
                    <p className="text-sm text-neutral-600">
                      Enable/disable drip campaign functionality
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={dripCampaignsEnabled}
                    onChange={(e) => setDripCampaignsEnabled(e.target.checked)}
                    className="h-5 w-5"
                    disabled={submitting}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg border border-neutral-200 transition hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-900">AI Features</p>
                    <p className="text-sm text-neutral-600">
                      Enable/disable AI-powered features
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="h-5 w-5"
                    disabled={submitting}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg border border-neutral-200 transition hover:bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-900">Reports</p>
                    <p className="text-sm text-neutral-600">
                      Enable/disable reporting features
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reportsEnabled}
                    onChange={(e) => setReportsEnabled(e.target.checked)}
                    className="h-5 w-5"
                    disabled={submitting}
                  />
                </label>
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="border-b border-neutral-200 pb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Rate Limiting</h2>
              <div>
                <label htmlFor="rate-limit" className="block text-sm font-medium text-neutral-700">
                  Requests per hour
                </label>
                <input
                  id="rate-limit"
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  className="input mt-2"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Maximum API requests per user per hour.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Saving...' : 'Save Settings'}
              </button>
              <Link href="/admin" className="btn-secondary">
                Back
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
