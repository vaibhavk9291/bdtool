import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UploadClient } from './UploadClient'

export default async function UploadPage() {
  await requireAdmin()
  
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, displayName: true, username: true }
  })

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Leads</h1>
        <p className="text-gray-500">Upload a spreadsheet of leads to import them into the system.</p>
      </div>
      <UploadClient users={users} />
    </div>
  )
}
