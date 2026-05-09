import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { LeadsClient } from './LeadsClient'

export default async function LeadsPage() {
  await requireAdmin()
  
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, displayName: true, username: true }
  })

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads Management</h1>
        <p className="text-gray-500">View, filter, and assign leads.</p>
      </div>
      <LeadsClient users={users} />
    </div>
  )
}
