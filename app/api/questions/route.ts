import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, message } = body;

    // Validation
    if (!productId || !message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Verify user authentication
    // 2. Check if product exists
    // 3. Save question to database
    // 4. Send notification to seller
    // 5. Return success response

    // Simulate successful question submission
    const question = {
      id: Date.now().toString(),
      productId,
      message: message.trim(),
      askedBy: 'current-user',
      askedAt: new Date().toISOString(),
      answered: false
    };

    return NextResponse.json({
      success: true,
      question
    });

  } catch (error) {
    console.error('Error submitting question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
