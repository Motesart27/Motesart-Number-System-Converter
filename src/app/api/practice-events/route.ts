import { NextRequest, NextResponse } from 'next/server';
import { addEvent } from '@/lib/practice-events-store';
import type { PracticeEvent } from '@/lib/practice-events-store';

function generateEventId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ['client_event_id', 'student_instrument_id', 'concept_id', 'chapter', 'result'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: 'Missing required field: ' + field },
          { status: 400 }
        );
      }
    }

    const event: PracticeEvent = {
      event_id: generateEventId(),
      client_event_id: body.client_event_id,
      student_instrument_id: body.student_instrument_id,
      concept_id: body.concept_id,
      chapter: body.chapter,
      result: body.result,
      found_pairs: body.found_pairs || [],
      wrong_taps: body.wrong_taps || [],
      attempt_count: body.attempt_count || 1,
      hint_used: body.hint_used || false,
      tempo_factor: body.tempo_factor || 1.0,
      created_at: new Date().toISOString(),
    };

    // Duplicate protection on client_event_id
    const { created, event: savedEvent } = addEvent(event);

    if (!created) {
      return NextResponse.json(
        { duplicate: true, event: savedEvent },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { created: true, event: savedEvent },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
