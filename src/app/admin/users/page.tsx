import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserListClient } from './UserListClient'

export default async function UsersPage() {
  await requireAdmin()
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-gray-500">Manage business developers and admins.</p>
        </div>
      </div>
      <UserListClient initialUsers={users} />
    </div>
  )
}
