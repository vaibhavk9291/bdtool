import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  await requireAdmin()
  const { searchParams } = new URL(request.url)
  const since = searchParams.get('since')
  const leadId = searchParams.get('leadId')

  const where: Prisma.ActivityLogWhereInput = {}
  if (since) {
    where.createdAt = { gt: new Date(since) }
  }
  if (leadId) {
    where.entity = 'LEAD'
    where.entityId = leadId
  }

  try {
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { displayName: true } }
      }
    })

    const leadIds = logs.filter(l => l.entity === 'LEAD' && l.entityId).map(l => l.entityId as string)
    const uniqueLeadIds = [...new Set(leadIds)]
    
    let leadsMap: Record<string, string> = {}
    if (uniqueLeadIds.length > 0) {
      const leads = await prisma.lead.findMany({
        where: { id: { in: uniqueLeadIds } },
        select: { id: true, name: true }
      })
      leadsMap = leads.reduce((acc, l) => ({ ...acc, [l.id]: l.name }), {})
    }

    const enriched = logs.map(log => ({
      ...log,
      leadName: log.entity === 'LEAD' && log.entityId ? leadsMap[log.entityId] : null
    }))

    return NextResponse.json({ logs: enriched })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
