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

    // Check if the BD Executive has finished calling all their leads (pending count is now 0)
    try {
      const pendingCount = await prisma.lead.count({
        where: {
          assignedToId: session.id,
          callCount: 0
        }
      })

      if (pendingCount === 0) {
        // Fetch user's displayName and total leads count
        const userDetails = await prisma.user.findUnique({
          where: { id: session.id },
          select: {
            displayName: true,
            _count: {
              select: { leads: true }
            }
          }
        })

        if (userDetails && userDetails._count.leads > 0) {
          // Avoid spamming duplicate notifications within a short window (15 seconds)
          const recentNotif = await prisma.notification.findFirst({
            where: {
              userId: session.id,
              createdAt: {
                gt: new Date(Date.now() - 15000)
              }
            }
          })

          if (!recentNotif) {
            // Write a persistent notification record to the database
            await prisma.notification.create({
              data: {
                userId: session.id,
                displayName: userDetails.displayName,
                leadsCount: userDetails._count.leads
              }
            })

            // Automatically prune database to maintain exactly the 10 most recent history entries
            const allNotifs = await prisma.notification.findMany({
              orderBy: { createdAt: 'desc' }
            })
            if (allNotifs.length > 10) {
              const idsToDelete = allNotifs.slice(10).map(n => n.id)
              await prisma.notification.deleteMany({
                where: {
                  id: { in: idsToDelete }
                }
              })
            }
          }
        }
      }
    } catch (notifErr) {
      // Log errors safely so that the actual call response is never blocked or compromised
      logger.error('failed.to.log.completion.notification', { error: notifErr })
    }

    return NextResponse.json({ 
      callId: call.id,
      callCount: lead.callCount, 
      lastCalledAt: lead.lastCalledAt 
    })
  } catch (error) {
    return handleApiError(error)
  }
}
