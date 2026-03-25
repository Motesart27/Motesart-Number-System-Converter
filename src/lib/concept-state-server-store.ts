import { findRecords, upsertRecord } from './airtable-client';

const TABLE_NAME = 'Concept_State';

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

export async function getState(
  studentInstrumentId: string,
  conceptId: string
): Promise<ConceptState | null> {
  const formula = 'AND({student_instrument_id} = "' + studentInstrumentId + '", {concept_id} = "' + conceptId + '")';
  const records = await findRecords(TABLE_NAME, formula, 1);
  if (records.length === 0) return null;
  return fieldsToConceptState(records[0].fields);
}

export async function setState(state: ConceptState): Promise<void> {
  const formula = 'AND({student_instrument_id} = "' + state.student_instrument_id + '", {concept_id} = "' + state.concept_id + '")';
  await upsertRecord(TABLE_NAME, {
    student_instrument_id: state.student_instrument_id,
    concept_id: state.concept_id,
    confidence: state.confidence,
    trend: state.trend,
    mastery_ready: state.mastery_ready,
    mistake_pattern: state.mistake_pattern,
    recommended_strategy: state.recommended_strategy,
    next_action: state.next_action,
    evidence_summary: state.evidence_summary,
    last_3_confidences: JSON.stringify(state.last_3_confidences),
    updated_at: state.updated_at,
  }, formula);
}

function fieldsToConceptState(fields: Record<string, unknown>): ConceptState {
  return {
    student_instrument_id: (fields.student_instrument_id as string) || '',
    concept_id: (fields.concept_id as string) || '',
    confidence: (fields.confidence as number) || 0,
    trend: (fields.trend as string) || 'stable',
    mastery_ready: (fields.mastery_ready as boolean) || false,
    mistake_pattern: (fields.mistake_pattern as string) || '',
    recommended_strategy: (fields.recommended_strategy as string) || '',
    next_action: (fields.next_action as string) || '',
    evidence_summary: (fields.evidence_summary as string) || '',
    last_3_confidences: safeJsonParse(fields.last_3_confidences as string, []),
    updated_at: (fields.updated_at as string) || '',
  };
}

function safeJsonParse(str: string, fallback: number[]): number[] {
  try {
    return JSON.parse(str);
  } catch (err) {
    return fallback;
  }
}
