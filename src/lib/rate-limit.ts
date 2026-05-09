import { LRUCache } from 'lru-cache'

const buckets = new LRUCache<string, number[]>({
  max: 5000,
  ttl: 60_000, // 1 minute window
})

export function checkRateLimit(key: string, limit: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const windowStart = now - 60_000
  const hits = (buckets.get(key) ?? []).filter(t => t > windowStart)
  if (hits.length >= limit) {
    return { ok: false, retryAfter: Math.ceil((hits[0] + 60_000 - now) / 1000) }
  }
  hits.push(now)
  buckets.set(key, hits)
  return { ok: true, retryAfter: 0 }
}

export function rateLimitKey(req: Request, scope: string): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  return `${scope}:${ip}`
}
