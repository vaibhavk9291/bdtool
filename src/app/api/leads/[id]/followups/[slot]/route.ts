import { NextResponse } from 'next/server'
import { requireAuth, assertOwnsLead } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string, slot: string }> }
) {
  const session = await requireAuth()
  const { id, slot } = await params
  
  const slotNum = parseInt(slot)
  if (isNaN(slotNum) || slotNum < 1 || slotNum > 4) {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  try {
    await assertOwnsLead(id, session.id)
    const { scheduledAt, note, completed } = await request.json()

    const upserted = await prisma.followUp.upsert({
      where: {
        leadId_slot: {
          leadId: id,
          slot: slotNum
        }
      },
      update: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        note: note || null,
        completed: !!completed
      },
      create: {
        leadId: id,
        slot: slotNum,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        note: note || null,
        completed: !!completed
      }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'FOLLOWUP_SET',
        entity: 'LEAD',
        entityId: id,
        metadata: JSON.stringify({ slot: slotNum, completed: !!completed })
      }
    })

    return NextResponse.json(upserted)
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
