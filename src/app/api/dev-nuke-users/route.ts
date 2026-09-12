import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    let admin = users.find(u => u.username === 'admin')

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          username: 'admin',
          displayName: 'Admin',
          role: 'ADMIN'
        }
      })
    }

    const nonAdminUserIds = users.filter(u => u.id !== admin!.id).map(u => u.id)
    
    if (nonAdminUserIds.length === 0) {
      return NextResponse.json({ message: 'No non-admin users to delete.' })
    }

    // Unassign leads
    await prisma.lead.updateMany({
      where: { assignedToId: { in: nonAdminUserIds } },
      data: { assignedToId: null }
    })

    // Delete associated records due to restrict constraints
    await prisma.call.deleteMany({
      where: { userId: { in: nonAdminUserIds } }
    })
    
    await prisma.activityLog.deleteMany({
      where: { userId: { in: nonAdminUserIds } }
    })

    // Finally delete the users
    const result = await prisma.user.deleteMany({
      where: { id: { in: nonAdminUserIds } }
    })

    return NextResponse.json({ 
      message: `Successfully deleted ${result.count} users.`,
      adminId: admin.id
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
