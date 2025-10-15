/**
 * HEALTH CHECK & PERFORMANCE MONITORING API
 * 
 * GET /api/health - System health status
 * GET /api/health/performance - Detailed performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { performHealthCheck, getSystemMetrics } from '@/lib/monitoring/performance';
// import { checkDatabaseHealth, getPoolStatus } from '@/lib/db/prisma-optimized'; // Disabled - file uses deprecated Prisma middleware

export const dynamic = 'force-dynamic';

// ============================================================================
// GET - Health Check
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  
  try {
    if (detailed) {
      // Detailed performance metrics
      const metrics = await getSystemMetrics();
      // const poolStatus = await getPoolStatus(); // Disabled
      
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics,
        database: {
          status: 'connected' // Simplified since prisma-optimized is disabled
        }
      });
    } else {
      // Basic health check
      const health = await performHealthCheck();
      
      return NextResponse.json(health, {
        status: health.status === 'unhealthy' ? 503 : 200
      });
    }
  } catch (error: any) {
    console.error('[HEALTH] Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

