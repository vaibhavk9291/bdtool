import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Quick DB connectivity check
    await prisma.user.count()
    return NextResponse.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: 'Database unreachable' },
      { status: 503 }
    )
  }
}
