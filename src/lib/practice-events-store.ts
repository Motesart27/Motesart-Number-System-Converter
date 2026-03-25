// Practice Events Store — In-memory MVP (Airtable migration planned)
// Schema locked per Day 1 spec

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
  created_at: string;
}

const events: PracticeEvent[] = [];
const seenClientIds = new Set<string>();

export function addEvent(event: PracticeEvent): { created: boolean; event: PracticeEvent } {
  // Duplicate protection: check client_event_id before any write
  if (seenClientIds.has(event.client_event_id)) {
    const existing = events.find(e => e.client_event_id === event.client_event_id);
    return { created: false, event: existing! };
  }

  seenClientIds.add(event.client_event_id);
  events.push(event);
  return { created: true, event };
}

export function getEventsByStudentConcept(
  studentInstrumentId: string,
  conceptId: string
): PracticeEvent[] {
  return events.filter(
    e => e.student_instrument_id === studentInstrumentId && e.concept_id === conceptId
  );
}

export function getAllEvents(): PracticeEvent[] {
  return [...events];
}
