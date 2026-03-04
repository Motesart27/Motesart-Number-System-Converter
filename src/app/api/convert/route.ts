import { NextRequest, NextResponse } from 'next/server';
import { convertChordChart } from '@/lib/motesart-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, key, timeSignature } = body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    const options: { key?: string; timeSignature?: string } = {};
    if (key) options.key = key;
    if (timeSignature) options.timeSignature = timeSignature;

    const result = convertChordChart(input, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'Conversion failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
