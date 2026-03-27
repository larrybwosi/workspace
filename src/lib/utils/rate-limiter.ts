interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// In-memory rate limit store (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Rate limiter for API requests
 * Uses sliding window algorithm
 */
export async function checkRateLimit(
  apiKeyId: string,
  limit = 1000,
  windowMs: number = 60 * 60 * 1000, // 1 hour default
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `rate_limit:${apiKeyId}`

  let entry = rateLimitStore.get(key)

  // Reset if window expired
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    rateLimitStore.set(key, entry)
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetAt,
      retryAfter,
    }
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  }

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString()
  }

  return headers
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 10 * 60 * 1000)
}
