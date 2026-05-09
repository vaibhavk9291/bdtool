import { NextResponse } from 'next/server'
import { requireAuth, assertOwnsLead } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['NEW', 'HOT', 'WARM', 'COLD', 'NOT_INTERESTED', 'CONVERTED', 'DO_NOT_CALL']).optional(),
  firstInterest: z.string().nullable().optional()
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const { id } = await params
  
  try {
    const lead = await assertOwnsLead(id, session.id)
    const body = await request.json()
    const parsed = patchSchema.parse(body)

    const updated = await prisma.lead.update({
      where: { id },
      data: parsed
    })

    if (parsed.status && parsed.status !== lead.status) {
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          action: 'STATUS_CHANGE',
          entity: 'LEAD',
          entityId: id,
          metadata: JSON.stringify({ from: lead.status, to: parsed.status })
        }
      })
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
