import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { ApiError, handleApiError } from '@/lib/api-error'

const importSchema = z.object({
  rows: z.array(z.object({
    name: z.string().min(1),
    contact: z.string().min(1),
    hasWebsite: z.boolean(),
  })).min(1, 'No rows to import'),
  assignedToId: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const key = rateLimitKey(request, 'import')
    const limit = checkRateLimit(key, 5)
    if (!limit.ok) {
      throw new ApiError(429, 'Too many import requests', { retryAfter: limit.retryAfter })
    }

    const body = await request.json()
    const data = importSchema.parse(body)

    const leadsData = data.rows.map(r => ({
      name: r.name,
      contact: r.contact,
      hasWebsite: r.hasWebsite,
      assignedToId: data.assignedToId || null,
      status: 'NEW',
    }))

    const result = await prisma.lead.createMany({
      data: leadsData,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'LEADS_UPLOADED',
        entity: 'LEAD',
        metadata: JSON.stringify({ count: result.count, assignedToId: data.assignedToId })
      }
    })

    logger.info('lead.imported', { count: result.count, adminId: session.id })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    return handleApiError(error)
  }
}
