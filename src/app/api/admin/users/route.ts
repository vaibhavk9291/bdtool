import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').regex(/^[a-z0-9_]+$/, 'Must be lowercase, alphanumeric, and underscores only'),
  displayName: z.string().min(1, 'Display name is required'),
  role: z.enum(['ADMIN', 'USER']),
})

export async function GET() {
  await requireAdmin()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  try {
    const body = await request.json()
    const data = createUserSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { username: data.username }
    })

    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }

    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        role: data.role,
        active: true,
      }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'USER_CREATED',
        entity: 'USER',
        entityId: newUser.id,
        metadata: JSON.stringify({ username: newUser.username })
      }
    })

    return NextResponse.json(newUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
