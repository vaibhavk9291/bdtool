import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  const session = await requireAuth()
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get('page') || '1')
  const q = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || 'ALL'
  const calledFilter = searchParams.get('called') || 'ALL'
  const websiteFilter = searchParams.get('website') || 'ALL'

  const where: Prisma.LeadWhereInput = {
    assignedToId: session.id
  }

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { contact: { contains: q } }
    ]
  }

  if (statusFilter !== 'ALL') {
    where.status = statusFilter
  }

  if (calledFilter === 'CALLED') {
    where.callCount = { gt: 0 }
  } else if (calledFilter === 'NOT_CALLED') {
    where.callCount = 0
  }

  if (websiteFilter === 'YES') {
    where.hasWebsite = true
  } else if (websiteFilter === 'NO') {
    where.hasWebsite = false
  }

  try {
    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 25,
        take: 25,
        include: {
          followUps: {
            where: { completed: false }
          }
        }
      })
    ])

    const rows = leads.map(l => ({
      ...l,
      activeFollowUps: l.followUps.length
    }))

    return NextResponse.json({ rows, total })
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
