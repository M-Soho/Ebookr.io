'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, Activity, Mail, Zap, Database, 
  Settings, AlertCircle, BarChart, Bell, Server, FileText
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'System Monitor', href: '/admin/system', icon: Server },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Activity Logs', href: '/admin/logs', icon: Activity },
  { name: 'Celery Tasks', href: '/admin/celery', icon: Zap },
  { name: 'Email Queue', href: '/admin/email', icon: Mail },
  { name: 'Database', href: '/admin/database', icon: Database },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Error Logs', href: '/admin/errors', icon: AlertCircle },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ebookr.io Admin Panel</h1>
                <p className="text-xs text-gray-500">System Administration & Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to App
              </Link>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm min-h-screen border-r">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* System Status Indicator */}
          <div className="p-4 border-t mt-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-800">All Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="p-4 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h3>
            <div className="space-y-1">
              <a href="/admin/" className="block text-sm text-blue-600 hover:text-blue-800">
                Django Admin
              </a>
              <a href="/api/admin/health/" target="_blank" className="block text-sm text-blue-600 hover:text-blue-800">
                Health Check API
              </a>
              <a href="/api/admin/dashboard/" target="_blank" className="block text-sm text-blue-600 hover:text-blue-800">
                Dashboard API
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
