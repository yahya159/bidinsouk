import { NextRequest, NextResponse } from 'next/server';
import { getBidsSince } from '@/lib/services/bids-enhanced';

/**
 * GET /api/auctions/[id]/bids-since?since=<timestamp>
 * Get bids placed after a specific timestamp (for catching up after reconnection)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    if (!since) {
      return NextResponse.json(
        { error: 'Missing "since" parameter' },
        { status: 400 }
      );
    }

    const auctionId = parseInt(id);
    if (isNaN(auctionId)) {
      return NextResponse.json(
        { error: 'Invalid auction ID' },
        { status: 400 }
      );
    }

    const bids = await getBidsSince(auctionId, since);

    return NextResponse.json(bids);
  } catch (error) {
    console.error('Error fetching bids since:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}
