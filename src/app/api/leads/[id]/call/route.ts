import { NextResponse } from 'next/server'
import { requireAuth, assertOwnsLead } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { ApiError, handleApiError } from '@/lib/api-error'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const key = rateLimitKey(request, 'call')
    const limit = checkRateLimit(key, 60)
    if (!limit.ok) {
      throw new ApiError(429, 'Too many requests', { retryAfter: limit.retryAfter })
    }

    const { id } = await params
    await assertOwnsLead(id, session.id)
    
    let note = ''
    try {
      const body = await request.json()
      note = body.note || ''
    } catch {
      // Body is optional
    }

    const now = new Date()

    const [call, lead] = await prisma.$transaction([
      prisma.call.create({
        data: {
          leadId: id,
          userId: session.id,
          calledAt: now,
          notes: note || null
        }
      }),
      prisma.lead.update({
        where: { id },
        data: {
          callCount: { increment: 1 },
          lastCalledAt: now
        }
      }),
      prisma.activityLog.create({
        data: {
          userId: session.id,
          action: 'CALL',
          entity: 'LEAD',
          entityId: id
        }
      })
    ])

    logger.info('call.logged', { leadId: id, userId: session.id })

    return NextResponse.json({ 
      callId: call.id,
      callCount: lead.callCount, 
      lastCalledAt: lead.lastCalledAt 
    })
  } catch (error) {
    return handleApiError(error)
  }
}
