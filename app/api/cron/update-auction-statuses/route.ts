import { NextRequest, NextResponse } from 'next/server';
import { updateAuctionStatuses } from '@/lib/services/auction-monitor';

export async function GET(request: NextRequest) {
  try {
    // Check for cron authentication (in production, use proper auth)
    const authHeader = request.headers.get('authorization');
    const cronAuth = process.env.CRON_AUTH_TOKEN;
    
    if (cronAuth && authHeader !== `Bearer ${cronAuth}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await updateAuctionStatuses();
    
    return NextResponse.json({
      message: 'Auction statuses updated successfully',
      result
    });
  } catch (error: any) {
    console.error('Error updating auction statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update auction statuses' },
      { status: 500 }
    );
  }
}
