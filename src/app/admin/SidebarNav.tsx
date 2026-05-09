"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, FileSpreadsheet, Upload, LayoutDashboard, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname()

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/leads', label: 'Leads', icon: FileSpreadsheet },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/upload', label: 'Upload', icon: Upload },
    { href: '/admin/activity', label: 'Activity', icon: Activity, badge: unreadCount },
  ]

  return (
    <nav className="flex flex-col gap-1 p-4">
      {links.map(({ href, label, icon: Icon, badge }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 border-l-4",
              isActive
                ? "bg-gray-100 text-gray-900 border-gray-900"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

