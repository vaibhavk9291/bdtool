import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  active: z.boolean().optional(),
  avatar: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    if (data.active === false && id === session.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })
    }

    if (data.active === false) {
      const targetUser = await prisma.user.findUnique({ where: { id } })
      if (targetUser?.role === 'ADMIN') {
        const activeAdmins = await prisma.user.count({
          where: { role: 'ADMIN', active: true, id: { not: id } }
        })
        if (activeAdmins === 0) {
          return NextResponse.json({ error: 'Cannot deactivate the last active admin' }, { status: 400 })
        }
      }
    }

    const updateData: any = {}
    if (data.active !== undefined) updateData.active = data.active
    if (data.avatar !== undefined) updateData.avatar = data.avatar

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'USER_UPDATED',
        entity: 'USER',
        entityId: updatedUser.id,
        metadata: JSON.stringify(updateData)
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
