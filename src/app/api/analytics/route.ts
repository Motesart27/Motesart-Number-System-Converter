import { NextRequest, NextResponse } from 'next/server';
import { logAnalyticsEvent } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, userId, metadata } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    await logAnalyticsEvent({
      event_type: eventType,
      user_id: userId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}
