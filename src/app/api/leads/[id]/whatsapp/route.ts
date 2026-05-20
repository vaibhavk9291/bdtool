import { NextResponse } from 'next/server'
import { requireAuth, assertOwnsLead } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { ApiError, handleApiError } from '@/lib/api-error'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const key = rateLimitKey(request, 'whatsapp')
    const limit = checkRateLimit(key, 60)
    if (!limit.ok) {
      throw new ApiError(429, 'Too many requests', { retryAfter: limit.retryAfter })
    }

    const { id } = await params
    await assertOwnsLead(id, session.id)

    const now = new Date()

    const log = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { whatsappSentAt: now }
      }),
      prisma.activityLog.create({
        data: {
          userId: session.id,
          action: 'WHATSAPP_SENT',
          entity: 'LEAD',
          entityId: id,
          createdAt: now
        }
      })
    ])

    logger.info('whatsapp.logged', { leadId: id, userId: session.id })

    return NextResponse.json({ success: true, logId: log[1].id })
  } catch (error) {
    return handleApiError(error)
  }
}
