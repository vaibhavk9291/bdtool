import { NextResponse } from 'next/server'
import { requireAuth, assertOwnsLead } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const { id } = await params
  
  try {
    await assertOwnsLead(id, session.id)

    const followUps = await prisma.followUp.findMany({
      where: { leadId: id },
      orderBy: { slot: 'asc' }
    })

    return NextResponse.json({ slots: followUps })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
