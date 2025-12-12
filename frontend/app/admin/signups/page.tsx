'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Mail, Calendar } from 'lucide-react';

interface Signup {
  id: number;
  name: string;
  email: string;
  tier: string;
  created_at: string;
}

interface SignupsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Signup[];
}

export default function SignupsPage() {
  const router = useRouter();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/signin');
      return;
    }

    const fetchSignups = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/admin/signups/?limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch signups');
        }

        const data: SignupsResponse = await response.json();
        setSignups(data.results);
        setTotal(data.count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchSignups();
  }, [limit, offset, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const pages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

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
              <h1 className="text-2xl font-bold text-neutral-900">Signups Management</h1>
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

        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                    Signed Up
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {signups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-neutral-600">
                      No signups yet
                    </td>
                  </tr>
                ) : (
                  signups.map((signup) => (
                    <tr key={signup.id} className="transition hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                        {signup.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Mail className="h-4 w-4" />
                          {signup.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            signup.tier === 'pro'
                              ? 'bg-accent-50 text-accent-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {signup.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(signup.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                Page {currentPage} of {pages} • Total: {total} signups
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={currentPage >= pages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
