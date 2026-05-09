import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const params = await context.params
  const id = params.id

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { displayName: true } }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const [rawFollowUps, calls, statusChanges] = await Promise.all([
      prisma.followUp.findMany({
        where: { leadId: id },
        orderBy: { slot: 'asc' }
      }),
      prisma.call.findMany({
        where: { leadId: id },
        orderBy: { calledAt: 'desc' },
        take: 20,
        include: { user: { select: { displayName: true } } }
      }),
      prisma.activityLog.findMany({
        where: { entity: 'LEAD', entityId: id, action: 'STATUS_CHANGE' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { displayName: true } } }
      })
    ])

    // Format follow-ups to always be an array of exactly 4 items (slots 1-4)
    const followUps = [1, 2, 3, 4].map(slot => {
      const found = rawFollowUps.find(f => f.slot === slot)
      if (found) {
        return {
          slot: found.slot,
          scheduledAt: found.scheduledAt,
          note: found.note,
          completed: found.completed,
          updatedAt: found.updatedAt
        }
      }
      return null
    })

    return NextResponse.json({
      lead,
      followUps,
      calls: calls.map(c => ({
        id: c.id,
        calledAt: c.calledAt,
        notes: c.notes,
        user: c.user
      })),
      statusChanges: statusChanges.map(sc => ({
        createdAt: sc.createdAt,
        metadata: sc.metadata,
        user: sc.user
      }))
    })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
