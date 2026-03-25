// Concept State Store — Server-side in-memory MVP (Airtable migration planned)
// Locked fields: only these for v1

export interface ConceptState {
  student_instrument_id: string;
  concept_id: string;
  confidence: number;
  trend: string;
  mastery_ready: boolean;
  mistake_pattern: string;
  recommended_strategy: string;
  next_action: string;
  evidence_summary: string;
  last_3_confidences: number[];
  updated_at: string;
}

// Key: student_instrument_id::concept_id
const states = new Map<string, ConceptState>();

function stateKey(studentInstrumentId: string, conceptId: string): string {
  return studentInstrumentId + '::' + conceptId;
}

export function getState(
  studentInstrumentId: string,
  conceptId: string
): ConceptState | null {
  return states.get(stateKey(studentInstrumentId, conceptId)) || null;
}

export function setState(state: ConceptState): ConceptState {
  states.set(stateKey(state.student_instrument_id, state.concept_id), state);
  return state;
}

export function getAllStates(): ConceptState[] {
  return Array.from(states.values());
}
