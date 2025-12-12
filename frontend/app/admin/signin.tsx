'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminSignIn() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For development, we're using a simple password check
      // In production, implement proper OAuth or JWT-based authentication
      const adminToken = 'admin-token-secret'; // This should be verified against backend
      if (password === 'admin123') { // Default dev password - change in production!
        localStorage.setItem('admin_token', adminToken);
        router.push('/admin');
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">Admin Login</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Enter your admin password to access the dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your admin password"
                className="input mt-1"
                disabled={loading}
                autoFocus
              />
              <p className="mt-1 text-xs text-neutral-500">
                Dev password: admin123 (Change in production!)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-200 pt-6">
            <p className="text-sm text-neutral-600">
              Need help? Contact support or check the documentation.
            </p>
          </div>

          <Link
            href="/"
            className="mt-4 block text-center text-sm text-primary-600 transition hover:text-primary-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
