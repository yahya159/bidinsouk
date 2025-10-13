import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, amountMAD } = body;

    // Validation
    if (!productId || !amountMAD || typeof amountMAD !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Verify user authentication
    // 2. Check if auction is still active
    // 3. Validate bid amount against current bid + minimum increment
    // 4. Check if user is not the seller
    // 5. Save bid to database
    // 6. Update product's current bid
    // 7. Send notifications

    // Mock validation
    if (amountMAD < 290) { // Assuming current bid is 280 + 10 min increment
      return NextResponse.json(
        { error: 'Bid amount too low', minRequired: 290 },
        { status: 400 }
      );
    }

    // Simulate successful bid placement
    const newBid = {
      id: Date.now().toString(),
      bidder: {
        id: 'current-user',
        displayName: 'Vous',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
      },
      amountMAD,
      placedAtISO: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      bid: newBid,
      newCurrentBid: amountMAD
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}