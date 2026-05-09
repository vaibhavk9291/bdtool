import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { toCsv } from '@/lib/csv'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(request.url)
  
  const statusesParam = searchParams.get('statuses')
  const statuses = statusesParam ? statusesParam.split(',') : ['HOT', 'WARM', 'CONVERTED']
  const isCount = searchParams.get('count') === 'true'

  const where = {
    assignedToId: user.id,
    status: { in: statuses }
  }

  if (isCount) {
    const count = await prisma.lead.count({ where })
    return NextResponse.json({ count })
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: {
      calls: { orderBy: { calledAt: 'desc' }, take: 1, select: { notes: true, calledAt: true } },
      followUps: {
        where: { completed: false, scheduledAt: { not: null } },
        orderBy: { scheduledAt: 'asc' },
        take: 1,
        select: { scheduledAt: true, note: true },
      },
    },
  })

  // Cap at 50,000 to defend against accidental massive exports
  if (leads.length > 50000) {
    return NextResponse.json({ error: 'Too many rows; please add filters' }, { status: 413 })
  }

  const headers = [
    'Name', 'Contact', 'Has Website', 'Status', 'First Interest',
    'Calls Made', 'Last Called', 'Last Call Note',
    'Latest Follow-up Date', 'Latest Follow-up Notes',
    'Next Follow-up Date', 'Next Follow-up Notes', 'Outcome', 'Action Items'
  ]

  const rows = leads.map(lead => {
    const lastCall = lead.calls[0]
    const nextFollowUp = lead.followUps[0]
    
    return [
      lead.name,
      lead.contact,
      lead.hasWebsite ? 'Yes' : 'No',
      lead.status,
      lead.firstInterest || '',
      lead.callCount,
      lead.lastCalledAt ? new Date(lead.lastCalledAt).toISOString().split('T')[0] : '',
      lastCall?.notes || '',
      nextFollowUp?.scheduledAt ? new Date(nextFollowUp.scheduledAt).toISOString().split('T')[0] : '',
      nextFollowUp?.note || '',
      '', // Next Follow-up Date
      '', // Next Follow-up Notes
      '', // Outcome
      ''  // Action Items
    ]
  })

  const csv = toCsv(headers, rows)
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `interested-leads_${user.username}_${dateStr}.csv`

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'LEADS_EXPORTED',
      entity: 'LEAD',
      metadata: JSON.stringify({ count: leads.length, statuses, scope: 'user' })
    }
  })

  logger.info('lead.exported', { count: leads.length, scope: 'user', userId: user.id })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
