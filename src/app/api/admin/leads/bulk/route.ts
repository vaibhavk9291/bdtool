import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  try {
    const { ids, assignedToId } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const result = await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data: { assignedToId: assignedToId || null }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'LEADS_BULK_REASSIGN',
        entity: 'LEAD',
        metadata: JSON.stringify({ count: result.count, assignedToId })
      }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdmin()
  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const result = await prisma.lead.deleteMany({
      where: { id: { in: ids } }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'LEADS_BULK_DELETE',
        entity: 'LEAD',
        metadata: JSON.stringify({ count: result.count })
      }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
