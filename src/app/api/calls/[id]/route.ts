import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const { id } = await params
  
  try {
    const call = await prisma.call.findUnique({ where: { id } })
    if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // User must own the call
    if (session.role !== 'ADMIN' && call.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { note } = await request.json()

    const updated = await prisma.call.update({
      where: { id },
      data: { notes: note }
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
