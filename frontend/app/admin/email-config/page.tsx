'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Mail } from 'lucide-react';

interface EmailConfig {
  id: number;
  provider: string;
  is_active: boolean;
  sendgrid_api_key?: string;
  mailgun_domain?: string;
  mailgun_api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_use_tls?: boolean;
}

const PROVIDERS = ['sendgrid', 'mailgun', 'smtp'];

export default function EmailConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeProvider, setActiveProvider] = useState('sendgrid');

  // Form state
  const [sendgridKey, setSendgridKey] = useState('');
  const [mailgunDomain, setMailgunDomain] = useState('');
  const [mailgunKey, setMailgunKey] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpUseTls, setSmtpUseTls] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    fetchConfig();
  }, [router]);

  const fetchConfig = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/admin/email-config/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email config');
      }

      const data: EmailConfig = await response.json();
      setConfig(data);
      setActiveProvider(data.provider || 'sendgrid');

      // Populate form fields
      if (data.sendgrid_api_key) setSendgridKey(data.sendgrid_api_key);
      if (data.mailgun_domain) setMailgunDomain(data.mailgun_domain);
      if (data.mailgun_api_key) setMailgunKey(data.mailgun_api_key);
      if (data.smtp_host) setSmtpHost(data.smtp_host);
      if (data.smtp_port) setSmtpPort(data.smtp_port.toString());
      if (data.smtp_user) setSmtpUser(data.smtp_user);
      if (data.smtp_use_tls !== undefined) setSmtpUseTls(data.smtp_use_tls);
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
      const payload: Record<string, any> = {
        provider: activeProvider,
      };

      if (activeProvider === 'sendgrid') {
        if (!sendgridKey) throw new Error('SendGrid API key is required');
        payload.sendgrid_api_key = sendgridKey;
      } else if (activeProvider === 'mailgun') {
        if (!mailgunDomain || !mailgunKey) {
          throw new Error('Mailgun domain and API key are required');
        }
        payload.mailgun_domain = mailgunDomain;
        payload.mailgun_api_key = mailgunKey;
      } else if (activeProvider === 'smtp') {
        if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
          throw new Error('All SMTP fields are required');
        }
        payload.smtp_host = smtpHost;
        payload.smtp_port = parseInt(smtpPort);
        payload.smtp_user = smtpUser;
        payload.smtp_password = smtpPassword;
        payload.smtp_use_tls = smtpUseTls;
      }

      const response = await fetch('http://localhost:8000/api/admin/email-config/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save email config');
      }

      setError('');
      await fetchConfig();
      alert('Email configuration saved successfully!');
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
              <h1 className="text-2xl font-bold text-neutral-900">Email Configuration</h1>
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
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Configure Email Provider</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Email Provider
              </label>
              <div className="space-y-2">
                {PROVIDERS.map((provider) => (
                  <label
                    key={provider}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-neutral-200 transition hover:bg-neutral-50"
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={provider}
                      checked={activeProvider === provider}
                      onChange={(e) => setActiveProvider(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-neutral-900 capitalize">
                      {provider === 'sendgrid' && 'SendGrid'}
                      {provider === 'mailgun' && 'Mailgun'}
                      {provider === 'smtp' && 'SMTP'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* SendGrid Configuration */}
            {activeProvider === 'sendgrid' && (
              <div>
                <label htmlFor="sendgrid" className="block text-sm font-medium text-neutral-700">
                  SendGrid API Key
                </label>
                <input
                  id="sendgrid"
                  type="password"
                  value={sendgridKey}
                  onChange={(e) => setSendgridKey(e.target.value)}
                  placeholder="SG.xxxxxxxxxxxxx"
                  className="input mt-2"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Get your API key from SendGrid dashboard.
                </p>
              </div>
            )}

            {/* Mailgun Configuration */}
            {activeProvider === 'mailgun' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="mailgun-domain" className="block text-sm font-medium text-neutral-700">
                    Mailgun Domain
                  </label>
                  <input
                    id="mailgun-domain"
                    type="text"
                    value={mailgunDomain}
                    onChange={(e) => setMailgunDomain(e.target.value)}
                    placeholder="mg.example.com"
                    className="input mt-2"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="mailgun-key" className="block text-sm font-medium text-neutral-700">
                    Mailgun API Key
                  </label>
                  <input
                    id="mailgun-key"
                    type="password"
                    value={mailgunKey}
                    onChange={(e) => setMailgunKey(e.target.value)}
                    placeholder="key-xxxxxxxxxxxxx"
                    className="input mt-2"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            {/* SMTP Configuration */}
            {activeProvider === 'smtp' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="smtp-host" className="block text-sm font-medium text-neutral-700">
                    SMTP Host
                  </label>
                  <input
                    id="smtp-host"
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="input mt-2"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="smtp-port" className="block text-sm font-medium text-neutral-700">
                      SMTP Port
                    </label>
                    <input
                      id="smtp-port"
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="input mt-2"
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smtpUseTls}
                        onChange={(e) => setSmtpUseTls(e.target.checked)}
                        className="h-4 w-4"
                        disabled={submitting}
                      />
                      <span className="text-sm text-neutral-700">Use TLS</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="smtp-user" className="block text-sm font-medium text-neutral-700">
                    SMTP User
                  </label>
                  <input
                    id="smtp-user"
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="input mt-2"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="smtp-pass" className="block text-sm font-medium text-neutral-700">
                    SMTP Password
                  </label>
                  <input
                    id="smtp-pass"
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="Your password or app password"
                    className="input mt-2"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t border-neutral-200 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Saving...' : 'Save Configuration'}
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
