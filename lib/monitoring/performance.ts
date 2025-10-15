/**
 * PERFORMANCE MONITORING & ALERTING
 * 
 * Tracks:
 * - Database query performance
 * - API response times
 * - Cache hit rates
 * - Slow query detection
 * - Memory usage
 * - Error rates
 */

import { prisma } from '@/lib/db/prisma';
// import { getCacheStats } from '@/lib/cache/redis'; // Redis disabled - dependency not installed

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  stackTrace?: string;
}

// ============================================================================
// QUERY PERFORMANCE TRACKING
// ============================================================================

const slowQueries: SlowQuery[] = [];
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Track query performance
 */
export async function trackQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`[PERF] Slow query detected: ${queryName} took ${duration}ms`);
      
      slowQueries.push({
        query: queryName,
        duration,
        timestamp: new Date(),
        stackTrace: new Error().stack
      });
      
      // Keep only last 100 slow queries
      if (slowQueries.length > 100) {
        slowQueries.shift();
      }
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${queryName}: ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PERF] Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}

/**
 * Get slow queries
 */
export function getSlowQueries(limit: number = 10): SlowQuery[] {
  return slowQueries
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

// ============================================================================
// API PERFORMANCE TRACKING
// ============================================================================

interface ApiMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

const apiMetrics: ApiMetric[] = [];
const API_METRICS_MAX = 1000;

/**
 * Track API request performance
 */
export function trackApiRequest(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) {
  apiMetrics.push({
    endpoint,
    method,
    duration,
    statusCode,
    timestamp: new Date()
  });
  
  // Keep only last N metrics
  if (apiMetrics.length > API_METRICS_MAX) {
    apiMetrics.shift();
  }
  
  // Alert on slow API calls
  if (duration > 2000) {
    console.warn(`[PERF] Slow API call: ${method} ${endpoint} took ${duration}ms`);
  }
}

/**
 * Get API performance stats
 */
export function getApiStats() {
  if (apiMetrics.length === 0) {
    return null;
  }
  
  const durations = apiMetrics.map(m => m.duration);
  const sorted = durations.sort((a, b) => a - b);
  
  return {
    totalRequests: apiMetrics.length,
    avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    slowest: sorted[sorted.length - 1],
    fastest: sorted[0],
    errorRate: (apiMetrics.filter(m => m.statusCode >= 500).length / apiMetrics.length) * 100
  };
}

// ============================================================================
// DATABASE PERFORMANCE
// ============================================================================

/**
 * Get database performance metrics
 */
export async function getDatabaseMetrics() {
  try {
    // Get connection pool status
    const poolStatus = await prisma.$queryRaw<any[]>`
      SHOW STATUS WHERE Variable_name IN (
        'Threads_connected',
        'Max_used_connections',
        'Slow_queries',
        'Queries',
        'Questions'
      )
    `;
    
    const metrics: Record<string, number> = {};
    poolStatus.forEach((row: any) => {
      metrics[row.Variable_name] = parseInt(row.Value);
    });
    
    return {
      connectionsActive: metrics.Threads_connected || 0,
      connectionsMax: metrics.Max_used_connections || 0,
      slowQueries: metrics.Slow_queries || 0,
      totalQueries: metrics.Queries || 0
    };
  } catch (error) {
    console.error('[PERF] Error getting database metrics:', error);
    return null;
  }
}

// ============================================================================
// SYSTEM METRICS
// ============================================================================

/**
 * Get system performance metrics
 */
export async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  // const cacheStats = await getCacheStats(); // Redis disabled
  const cacheStats = { connected: false, hitRate: 0, totalKeys: 0 }; // Fallback
  const apiStats = getApiStats();
  const dbMetrics = await getDatabaseMetrics();
  
  return {
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024) // MB
    },
    cache: cacheStats,
    api: apiStats,
    database: dbMetrics,
    slowQueries: getSlowQueries(5)
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    redis: boolean;
    api: boolean;
  };
  metrics: any;
  timestamp: Date;
}

/**
 * Perform health check
 */
export async function performHealthCheck(): Promise<HealthCheck> {
  const checks = {
    database: false,
    redis: false,
    api: false
  };
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('[HEALTH] Database check failed:', error);
  }
  
  // Check Redis
  try {
    // const cacheStats = await getCacheStats(); // Redis disabled
    checks.redis = false; // Redis not configured
  } catch (error) {
    console.error('[HEALTH] Redis check failed:', error);
  }
  
  // Check API health
  const apiStats = getApiStats();
  if (apiStats) {
    checks.api = apiStats.errorRate < 10; // Less than 10% error rate
  } else {
    checks.api = true; // No data yet = healthy
  }
  
  // Determine overall status
  const healthyCount = Object.values(checks).filter(Boolean).length;
  let status: 'healthy' | 'degraded' | 'unhealthy';
  
  if (healthyCount === 3) {
    status = 'healthy';
  } else if (healthyCount >= 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  const metrics = await getSystemMetrics();
  
  return {
    status,
    checks,
    metrics,
    timestamp: new Date()
  };
}

// ============================================================================
// MIDDLEWARE FOR AUTOMATIC TRACKING
// ============================================================================

/**
 * Express/Next.js middleware to automatically track API performance
 */
export function createPerformanceMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Capture the original end function
    const originalEnd = res.end;
    
    // Override res.end to capture response time
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      trackApiRequest(
        req.url || req.path,
        req.method,
        duration,
        res.statusCode
      );
      
      // Call the original end function
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

// ============================================================================
// EXPORT
// ============================================================================

const performanceMonitor = {
  trackQuery,
  getSlowQueries,
  trackApiRequest,
  getApiStats,
  getDatabaseMetrics,
  getSystemMetrics,
  performHealthCheck,
  createPerformanceMiddleware
};

export default performanceMonitor;

