import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message)
  }
}

export function handleApiError(err: unknown): NextResponse {
  // ApiError — known/intentional
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.message, details: err.details },
      { status: err.status }
    )
  }
  
  // Zod validation
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: err.flatten().fieldErrors },
      { status: 400 }
    )
  }
  
  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate value' }, { status: 409 })
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
  
  // Unknown — log and return generic 500
  console.error('[unhandled-api-error]', err)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
