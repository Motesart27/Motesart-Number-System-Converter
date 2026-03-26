import { createRecord, findRecords } from './airtable-client';

const TABLE_NAME = 'Practice_Events';

export interface PracticeEvent {
  event_id: string;
  client_event_id: string;
  student_instrument_id: string;
  concept_id: string;
  chapter: string;
  result: string;
  found_pairs: string[];
  wrong_taps: string[];
  attempt_count: number;
  hint_used: boolean;
  tempo_factor: number;
  home_key?: string;
  stalled_on_note?: string;
  created_at: string;
}

export async function addEvent(event: PracticeEvent): Promise<{ created: boolean; event: PracticeEvent }> {
  // Duplicate protection: check if client_event_id already exists
  const existing = await findRecords(
    TABLE_NAME,
    '{client_event_id} = "' + event.client_event_id + '"',
    1
  );

  if (existing.length > 0) {
    const rec = existing[0].fields;
    return {
      created: false,
      event: fieldsToPracticeEvent(rec),
    };
  }

  await createRecord(TABLE_NAME, {
    event_id: event.event_id,
    client_event_id: event.client_event_id,
    student_instrument_id: event.student_instrument_id,
    concept_id: event.concept_id,
    chapter: event.chapter,
    result: event.result,
    found_pairs: JSON.stringify(event.found_pairs),
    wrong_taps: JSON.stringify(event.wrong_taps),
    attempt_count: event.attempt_count,
    hint_used: event.hint_used,
    tempo_factor: event.tempo_factor,
    home_key: event.home_key || '',
    stalled_on_note: event.stalled_on_note || '',
    created_at: event.created_at,
  });

  return { created: true, event };
}

export async function getEventsByStudentConcept(
  studentInstrumentId: string,
  conceptId: string
): Promise<PracticeEvent[]> {
  const formula = 'AND({student_instrument_id} = "' + studentInstrumentId + '", {concept_id} = "' + conceptId + '")';
  const records = await findRecords(TABLE_NAME, formula);
  return records.map((r: { fields: Record<string, unknown> }) => fieldsToPracticeEvent(r.fields));
}

function fieldsToPracticeEvent(fields: Record<string, unknown>): PracticeEvent {
  return {
    event_id: (fields.event_id as string) || '',
    client_event_id: (fields.client_event_id as string) || '',
    student_instrument_id: (fields.student_instrument_id as string) || '',
    concept_id: (fields.concept_id as string) || '',
    chapter: (fields.chapter as string) || '',
    result: (fields.result as string) || '',
    found_pairs: safeJsonParse(fields.found_pairs as string, []),
    wrong_taps: safeJsonParse(fields.wrong_taps as string, []),
    attempt_count: (fields.attempt_count as number) || 0,
    hint_used: (fields.hint_used as boolean) || false,
    tempo_factor: (fields.tempo_factor as number) || 1.0,
    home_key: (fields.home_key as string) || '',
    stalled_on_note: (fields.stalled_on_note as string) || '',
    created_at: (fields.created_at as string) || '',
  };
}

function safeJsonParse(str: string, fallback: string[]): string[] {
  try {
    return JSON.parse(str);
  } catch (err) {
    return fallback;
  }
}
