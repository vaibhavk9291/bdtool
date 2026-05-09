import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  response.cookies.delete(env.SESSION_COOKIE_NAME)
  
  return response
}
