import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, type RateLimitConfig } from './rate-limiter'

/**
 * Higher-order function that wraps an API route handler with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Extract identifier from request
    const identifier = getIdentifier(req)
    
    // Check rate limit
    const result = rateLimiter.check(identifier, config)
    
    if (!result.allowed) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000))
          }
        }
      )
    }
    
    // Call the handler
    const response = await handler(req, ...args)
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.floor(result.resetTime / 1000)))
    
    return response
  }
}

/**
 * Extract identifier from request (IP address or forwarded IP)
 */
function getIdentifier(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Last resort: use a generic identifier
  // In production with proper proxy configuration, one of the above headers should be set
  // For development/testing, this fallback ensures the rate limiter still works
  return 'unknown'
}
