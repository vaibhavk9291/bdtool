import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    const completedUsers = notifications.map(notif => ({
      id: notif.id,
      userId: notif.userId,
      displayName: notif.displayName,
      _count: {
        leads: notif.leadsCount
      }
    }))

    return NextResponse.json(completedUsers)
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
