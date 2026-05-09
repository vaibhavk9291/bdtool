import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { env } from '@/lib/env'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { ApiError, handleApiError } from '@/lib/api-error'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
})

export async function POST(request: Request) {
  try {
    const key = rateLimitKey(request, 'login')
    const limit = checkRateLimit(key, 10)
    if (!limit.ok) {
      throw new ApiError(429, 'Too many login attempts', { retryAfter: limit.retryAfter })
    }

    const body = await request.json()
    const { username } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.active) {
      logger.warn('user.login.failed', { username })
      throw new ApiError(401, 'Invalid or inactive user')
    }

    logger.info('user.login', { userId: user.id, role: user.role })
    const response = NextResponse.json({ role: user.role })
    
    // Set cookie
    response.cookies.set({
      name: env.SESSION_COOKIE_NAME,
      value: user.username,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
