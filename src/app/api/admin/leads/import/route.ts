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
  csvName: z.string().optional().nullable(),
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

    // Query database for any matching contacts from the requested rows
    const allContacts = data.rows.map(r => r.contact.trim())
    const existingLeads = await prisma.lead.findMany({
      where: {
        contact: {
          in: allContacts
        }
      },
      select: {
        contact: true
      }
    })
    const existingContactsInDb = new Set(existingLeads.map(l => l.contact.trim().toLowerCase()))

    const seenContacts = new Set<string>()
    const uniqueLeadsData = []

    for (const r of data.rows) {
      if (r.hasWebsite) {
        continue
      }
      const normalizedContact = r.contact.trim().toLowerCase()
      if (existingContactsInDb.has(normalizedContact) || seenContacts.has(normalizedContact)) {
        continue
      }
      seenContacts.add(normalizedContact)
      uniqueLeadsData.push({
        name: r.name,
        contact: r.contact.trim(),
        hasWebsite: r.hasWebsite,
        assignedToId: data.assignedToId || null,
        status: 'NEW',
        csvName: data.csvName || null,
      })
    }

    let count = 0
    if (uniqueLeadsData.length > 0) {
      const result = await prisma.lead.createMany({
        data: uniqueLeadsData,
      })
      count = result.count
    }

    if (count > 0 && data.assignedToId) {
      await prisma.csvAssignment.create({
        data: {
          csvName: data.csvName || 'Direct Import',
          assignedToId: data.assignedToId,
        }
      })
    }

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'LEADS_UPLOADED',
        entity: 'LEAD',
        metadata: JSON.stringify({ count, assignedToId: data.assignedToId })
      }
    })

    logger.info('lead.imported', { count, adminId: session.id })

    return NextResponse.json({ count })
  } catch (error) {
    return handleApiError(error)
  }
}
