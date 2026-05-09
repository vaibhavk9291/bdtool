import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  try {
    const { id } = await params
    const { assignedToId } = await request.json()
    
    const lead = await prisma.lead.update({
      where: { id },
      data: { assignedToId: assignedToId || null }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'LEAD_REASSIGNED',
        entity: 'LEAD',
        entityId: id,
        metadata: JSON.stringify({ assignedToId })
      }
    })

    return NextResponse.json(lead)
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  try {
    const { id } = await params
    await prisma.lead.delete({
      where: { id }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'LEAD_DELETED',
        entity: 'LEAD',
        entityId: id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
