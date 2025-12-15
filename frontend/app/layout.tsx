import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  Workflow, 
  CheckSquare, 
  Tag, 
  FileText, 
  Link2, 
  BarChart3,
  Settings,
  Sparkles,
  Shield,
  Calendar
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import dynamic from 'next/dynamic'
import DarkModeToggle from '@/components/DarkModeToggle'
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
      <body className="bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen overflow-hidden">
          {/* Left Sidebar */}
          <aside className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              {/* Logo */}
              <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Ebookr
                </Link>
                <DarkModeToggle />
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <LayoutDashboard size={20} />
                  <span className="font-medium">Dashboard</span>
                </Link>

                <Link
                  href="/contacts"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Users size={20} />
                  <span className="font-medium">Contacts</span>
                </Link>

                <Link
                  href="/workflows"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Workflow size={20} />
                  <span className="font-medium">Workflows</span>
                </Link>

                <Link
                  href="/tasks"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <CheckSquare size={20} />
                  <span className="font-medium">Tasks</span>
                </Link>

                <Link
                  href="/tags"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Tag size={20} />
                  <span className="font-medium">Tags</span>
                </Link>

                <Link
                  href="/templates"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <FileText size={20} />
                  <span className="font-medium">Templates</span>
                </Link>

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Features
                  </p>

                  <Link
                    href="/ai"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Sparkles size={20} />
                    <span className="font-medium">AI Features</span>
                  </Link>

                  <Link
                    href="/teams"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Users size={20} />
                    <span className="font-medium">Teams</span>
                  </Link>

                  <Link
                    href="/integrations-crm"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Link2 size={20} />
                    <span className="font-medium">Integrations</span>
                  </Link>

                  <Link
                    href="/reports"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <BarChart3 size={20} />
                    <span className="font-medium">Reports</span>
                  </Link>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Shield size={20} />
                    <span className="font-medium">Admin</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                  </Link>
                </div>
              </nav>

              {/* User Info at Bottom */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top Bar (Mobile) */}
            <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between h-16 px-4">
                <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Ebookr
                </Link>
                <div className="flex items-center gap-2">
                  <DarkModeToggle />
                  <AuthClient />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div className="py-6 px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
