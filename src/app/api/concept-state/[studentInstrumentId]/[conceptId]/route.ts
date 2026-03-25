import { NextRequest, NextResponse } from 'next/server';
import { getState } from '@/lib/concept-state-server-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentInstrumentId: string; conceptId: string }> }
) {
  const { studentInstrumentId, conceptId } = await params;
  const state = getState(studentInstrumentId, conceptId);

  if (!state) {
    return NextResponse.json(
      {
        found: false,
        student_instrument_id: studentInstrumentId,
        concept_id: conceptId,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ found: true, state }, { status: 200 });
}
