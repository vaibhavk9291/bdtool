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
    <AppShell 
      user={session} 
      mainClassName="flex-1 overflow-auto max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 w-full"
      sidebar={<SidebarNav unreadCount={unreadCount} />}
    >
      {children}
      <InstallPrompt />
    </AppShell>
  )
}

