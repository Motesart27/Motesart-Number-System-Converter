import { NextRequest, NextResponse } from 'next/server';
import { findRecords } from '@/lib/airtable-client';
import { corsHeaders, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const envPresent = {
    AIRTABLE_API_KEY: Boolean(process.env.AIRTABLE_API_KEY?.trim()),
    AIRTABLE_BASE_ID: Boolean(process.env.AIRTABLE_BASE_ID?.trim()),
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY?.trim()),
  };

  let airtableRead = false;
  try {
    await findRecords('Concept_State', 'TRUE()', 1);
    airtableRead = true;
  } catch {
    airtableRead = false;
  }

  const overallStatus = airtableRead && Object.values(envPresent).every(Boolean)
    ? 'GREEN'
    : 'RED';

  return NextResponse.json(
    {
      functions_alive: true,
      env_present: envPresent,
      airtable_read: airtableRead,
      concept_state_route: true,
      practice_events_route: true,
      overall_status: overallStatus,
      deploy_commit: process.env.COMMIT_REF?.trim() || null,
    },
    { status: 200, headers }
  );
}
