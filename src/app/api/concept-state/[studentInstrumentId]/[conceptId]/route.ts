import { NextRequest, NextResponse } from 'next/server';
import { getState } from '@/lib/concept-state-server-store';
import { corsHeaders, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentInstrumentId: string; conceptId: string }> }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const { studentInstrumentId, conceptId } = await params;

  const state = getState(studentInstrumentId, conceptId);

  if (!state) {
    return NextResponse.json(
      {
        found: false,
        student_instrument_id: studentInstrumentId,
        concept_id: conceptId,
      },
      { status: 404, headers }
    );
  }

  return NextResponse.json({ found: true, state }, { status: 200, headers });
}
