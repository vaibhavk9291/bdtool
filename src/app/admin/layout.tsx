import { requireAdmin } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'
import { InstallPrompt } from '@/components/InstallPrompt'
import { SidebarNav } from './SidebarNav'
import prisma from '@/lib/prisma'
import { getActivitySeenAt } from '@/lib/activitySeen'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdmin()
  const seenAt = await getActivitySeenAt()
  const unreadCount = await prisma.activityLog.count({
    where: { createdAt: { gt: seenAt } }
  })

  return (
    <AppShell user={session} mainClassName="flex-1 flex w-full">
      <aside className="w-56 border-r border-gray-200 bg-white flex-shrink-0">
        <SidebarNav unreadCount={unreadCount} />
      </aside>
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
      <InstallPrompt />
    </AppShell>
  )
}

