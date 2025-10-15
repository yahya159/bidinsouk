/**
 * AUCTION MONITORING CRON JOB API
 * 
 * This endpoint should be called periodically by:
 * - Vercel Cron
 * - External cron service (e.g., cron-job.org)
 * - Manual trigger
 * 
 * Recommended frequency: Every 1-5 minutes
 * 
 * Setup Vercel Cron in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/monitor-auctions",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitorAuctions } from '@/lib/services/auction-monitor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time: 60 seconds

// ============================================================================
// GET - Monitor Auctions
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[CRON] Auction monitoring triggered');

    // Verify authorization (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, validate it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized monitoring attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run monitoring
    const result = await monitorAuctions();
    
    const duration = Date.now() - startTime;
    
    console.log(`[CRON] Monitoring completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Auction monitoring completed',
      result,
      duration: `${duration}ms`
    });

  } catch (error: any) {
    console.error('[CRON] Monitoring error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

