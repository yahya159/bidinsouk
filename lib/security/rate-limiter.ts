interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

interface RateLimitStore {
  [key: string]: RateLimitRecord
}

class RateLimiter {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout | null = null
  
  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }
  
  /**
   * Check if a request is allowed based on rate limit configuration
   */
  check(identifier: string, config: RateLimitConfig): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const record = this.store[identifier]
    
    // Clean up expired record
    if (record && now > record.resetTime) {
      delete this.store[identifier]
    }
    
    // Initialize or get current record
    const current = this.store[identifier] || {
      count: 0,
      resetTime: now + config.windowMs
    }
    
    // Check limit
    if (current.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      }
    }
    
    // Increment and store
    current.count++
    this.store[identifier] = current
    
    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    }
  }
  
  /**
   * Clean up expired rate limit records
   */
  private cleanup(): void {
    const now = Date.now()
    const keys = Object.keys(this.store)
    
    for (const key of keys) {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    }
  }
  
  /**
   * Clear all rate limit records (useful for testing)
   */
  reset(): void {
    this.store = {}
  }
  
  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Rate limit configurations
export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5              // 5 attempts
  },
  api: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100            // 100 requests
  },
  strict: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10             // 10 requests (for sensitive operations)
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()

// Export types
export type { RateLimitConfig }
