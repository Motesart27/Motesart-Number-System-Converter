import { NextRequest, NextResponse } from 'next/server';
import { saveConversion, getUserConversions } from '@/lib/airtable';

// GET - Fetch recent conversions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const conversions = await getUserConversions(userId);
    return NextResponse.json({ conversions });
  } catch (error) {
    console.error('Airtable fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversions' },
      { status: 500 }
    );
  }
}

// POST - Save a conversion result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, inputText, outputJson, keyUsed, timeSignature } = body;

    if (!inputText || !outputJson || !keyUsed) {
      return NextResponse.json(
        { error: 'inputText, outputJson, and keyUsed are required' },
        { status: 400 }
      );
    }

    const record = await saveConversion({
      user_id: userId || 'anonymous',
      input_text: inputText,
      output_json: typeof outputJson === 'string' ? outputJson : JSON.stringify(outputJson),
      key_used: keyUsed,
      time_signature: timeSignature || '4/4',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Airtable save error:', error);
    return NextResponse.json(
      { error: 'Failed to save conversion' },
      { status: 500 }
    );
  }
}
