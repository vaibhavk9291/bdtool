import { NextResponse } from 'next/server'
import { requireAuth, assertOwnsLead } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await assertOwnsLead(id, session.id)

    const meetings = await prisma.meeting.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ meetings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await assertOwnsLead(id, session.id)

    const body = await request.json()
    const { type, scheduledAt, note } = body

    if (!['ONLINE', 'OFFLINE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid meeting type' }, { status: 400 })
    }

    const meeting = await prisma.meeting.create({
      data: {
        leadId: id,
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        note
      }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'MEETING_SET',
        entity: 'LEAD',
        entityId: id,
        metadata: JSON.stringify({ type, scheduledAt })
      }
    })

    return NextResponse.json({ success: true, meeting })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
