import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { LeadsClient } from './LeadsClient'

export default async function LeadsPage() {
  await requireAdmin()
  
  const [users, unassignedCount, totalLeadsCount, pendingGroups, totalPendingCount] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { 
        id: true, 
        displayName: true, 
        username: true,
        avatar: true,
        _count: {
          select: { leads: true }
        }
      }
    }),
    prisma.lead.count({
      where: { assignedToId: null }
    }),
    prisma.lead.count(),
    prisma.lead.groupBy({
      by: ['assignedToId'],
      where: { callCount: 0 },
      _count: { _all: true }
    }),
    prisma.lead.count({
      where: { callCount: 0 }
    })
  ])

  const pendingMap = new Map<string | null, number>()
  pendingGroups.forEach(g => {
    pendingMap.set(g.assignedToId, g._count._all)
  })

  const usersWithPending = users.map(u => ({
    ...u,
    pendingLeadsCount: pendingMap.get(u.id) || 0
  }))

  const unassignedPendingCount = pendingMap.get(null) || 0

  return (
    <div className="space-y-6 w-full">
      <LeadsClient 
        users={usersWithPending} 
        unassignedCount={unassignedCount}
        unassignedPendingCount={unassignedPendingCount}
        totalLeadsCount={totalLeadsCount}
        totalPendingCount={totalPendingCount}
      />
    </div>
  )
}
