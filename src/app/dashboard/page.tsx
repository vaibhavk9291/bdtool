import { requireUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const session = await requireUser()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Fetch stats concurrently
  const [assignedCount, calledTodayCount, hotCount, convertedCount] = await Promise.all([
    prisma.lead.count({ where: { assignedToId: session.id } }),
    prisma.call.count({ 
      where: { 
        userId: session.id,
        calledAt: { gte: startOfToday }
      } 
    }),
    prisma.lead.count({ where: { assignedToId: session.id, status: 'HOT' } }),
    prisma.lead.count({ where: { assignedToId: session.id, status: 'CONVERTED' } }),
  ])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Leads</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</span>
          <span className="text-2xl font-bold mt-1">{assignedCount}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Called Today</span>
          <span className="text-2xl font-bold mt-1">{calledTodayCount}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Hot Leads</span>
          <span className="text-2xl font-bold mt-1">{hotCount}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Converted</span>
          <span className="text-2xl font-bold mt-1">{convertedCount}</span>
        </Card>
      </div>

      <DashboardClient />
    </div>
  )
}
