'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Key, Check, X } from 'lucide-react';

interface APIConfig {
  id: number;
  service: string;
  api_key_masked: string;
  is_active: boolean;
}

interface APIConfigResponse {
  results: APIConfig[];
}

const SERVICES = ['stripe', 'sendgrid', 'mailgun', 'twilio', 'anthropic'];
const SERVICE_LABELS: Record<string, string> = {
  stripe: 'Stripe (Payments)',
  sendgrid: 'SendGrid (Email)',
  mailgun: 'Mailgun (Email)',
  twilio: 'Twilio (SMS)',
  anthropic: 'Anthropic (AI)',
};

export default function APIConfigPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    fetchConfigs();
  }, [router]);

  const fetchConfigs = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/admin/api-config/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API configs');
      }

      const data: APIConfigResponse = await response.json();
      setConfigs(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !apiKey) {
      setError('Please select a service and enter an API key');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/admin/api-config/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: selectedService,
          api_key: apiKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save API config');
      }

      setSelectedService('');
      setApiKey('');
      setShowForm(false);
      setError('');
      await fetchConfigs();
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
              <h1 className="text-2xl font-bold text-neutral-900">API Configuration</h1>
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

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mb-6 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add API Configuration
          </button>
        )}

        {showForm && (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Add API Configuration</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-neutral-700">
                  Service
                </label>
                <select
                  id="service"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="input mt-1"
                  disabled={submitting}
                >
                  <option value="">Select a service</option>
                  {SERVICES.map((service) => (
                    <option key={service} value={service}>
                      {SERVICE_LABELS[service]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-700">
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="input mt-1"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Your API key will be encrypted and stored securely.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedService('');
                    setApiKey('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Active Configurations</h2>
          {configs.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
              <Key className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <p className="text-neutral-600">No API configurations set up yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Key className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {SERVICE_LABELS[config.service] || config.service}
                        </h3>
                        <p className="text-sm text-neutral-600 font-mono mt-1">
                          {config.api_key_masked}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {config.is_active ? (
                        <div className="flex items-center gap-1 text-success-600">
                          <Check className="h-5 w-5" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-neutral-500">
                          <X className="h-5 w-5" />
                          <span className="text-sm font-medium">Inactive</span>
                        </div>
                      )}
                      <button className="text-danger-600 transition hover:text-danger-700">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
