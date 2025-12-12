import type { Metadata } from 'next'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import dynamic from 'next/dynamic'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ebookr',
  description: 'Freelancer CRM and Follow-up Automation',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Once real auth is wired (Supabase), this will be replaced with actual user session
  const user = getCurrentUser()

  // Client-side auth UI (dynamic import to avoid server-only issues)
  const AuthClient = dynamic(() => import('@/components/AuthClient'), {
    ssr: false,
  })

  return (
    <html lang="en">
      <body className="bg-gray-50">

        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  Ebookr
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-8">
                <Link
                  href="/contacts"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Contacts
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Settings
                </Link>
                <Link
                  href="/reports"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/signin"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Admin
                </Link>
              </div>

              {/* User Info (Top Right) */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                <AuthClient />

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                  <button className="p-2 rounded-md text-gray-700 hover:bg-gray-100">
                    <Menu size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-600 text-sm">
              © 2025 Ebookr. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
