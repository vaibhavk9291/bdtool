import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { LeadsClient } from '@/app/admin/leads/LeadsClient'
import Link from 'next/link'

export default async function UserDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const params = await props.params
  
  const user = await prisma.user.findUnique({
    where: { id: params.id }
  })

  if (!user) return notFound()

  // We need to pass the list of all users to LeadsClient since it uses it for reassigning
  const allUsers = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, displayName: true }
  })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-black mb-2 inline-block">
          &larr; Back to Users
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{user.displayName}&apos;s Leads</h1>
        <p className="text-gray-500">Here is a dedicated view of {user.displayName}&apos;s leads.</p>
      </div>

      <LeadsClient users={allUsers} initialAssigneeFilter={user.id} />
    </div>
  )
}
