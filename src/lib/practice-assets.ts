/**
 * practice-assets.ts
 *
 * Practice Assets layer for the Motesart Number System Converter.
 * Airtable-backed persistence — assets survive across serverless invocations.
 *
 * Architecture:
 * Converter output (XML) -> Practice Asset record (Airtable) -> Practice page consumes
 * -> Concept_State updates from practice sessions
 *
 * Tables:
 * - Practice_Assets: Stores converted XML + handoff metadata
 * - Practice_Sessions: Stores individual student practice records
 */

import {
  airtableFetch,
  type AirtableRecord,
} from './airtable';

// ============================================================
// PILOT CONCEPTS — hard-locked to 5
// ============================================================

export const PILOT_CONCEPTS = [
  'T_HALF_STEP',
  'T_WHOLE_STEP',
  'T_MAJOR_SCALE_PATTERN',
  'T_SCALE_DEGREES_MAJOR',
  'T_MAJOR_3RD',
] as const;

export type PilotConceptId = (typeof PILOT_CONCEPTS)[number];

// ============================================================
// PRACTICE ASSET TYPES
// ============================================================

/** Status lifecycle of a practice asset */
export type AssetStatus = 'draft' | 'ready' | 'assigned' | 'archived';

/** The handoff contract between converter and practice app */
export interface ConverterHandoff {
  source_type: 'musicxml' | 'pdf' | 'image' | 'manual';
  title: string;
  detected_key: string;
  number_home: string;
  tempo_bpm: number;
  measure_count: number;
  total_notes: number;
  total_chords: number;
  scale_map: string[];
  motesart_annotations: number;
  concept_candidates: string[];
  /** Only pilot concepts — non-pilot are flagged but not graded */
  active_concepts: PilotConceptId[];
  conversion_confidence: number;
  special_cases: string[];
  converter_mode: string;
}

/** A stored practice asset */
export interface PracticeAsset {
  id: string;
  airtable_id?: string;
  created_at: string;
  updated_at: string;
  status: AssetStatus;
  /** The converted MusicXML string with SOM annotations */
  output_xml: string;
  /** Handoff metadata from the converter */
  handoff: ConverterHandoff;
  /** Teacher-facing fields */
  assigned_to?: string[];
  assigned_by?: string;
  assigned_at?: string;
  /** Practice tracking */
  practice_count: number;
  last_practiced?: string;
  avg_accuracy?: number;
}

/** What the practice page needs to render and track */
export interface PracticeSession {
  session_id?: string;
  airtable_id?: string;
  asset_id: string;
  student_id: string;
  started_at: string;
  completed_at?: string;
  tempo_factor: number;
  accuracy: number;
  mistakes: Array<{
    measure: number;
    beat: number;
    expected: string;
    played: string;
    concept_id?: PilotConceptId;
  }>;
  concepts_practiced: PilotConceptId[];
}

// ============================================================
// AIRTABLE FIELD INTERFACES
// ============================================================

interface PracticeAssetFields {
  asset_id: string;
  title: string;
  status: string;
  source_type: string;
  detected_key: string;
  number_home: string;
  tempo_bpm: number;
  measure_count: number;
  total_notes: number;
  total_chords: number;
  scale_map: string;
  active_concepts: string;
  flagged_non_pilot: string;
  concept_candidates: string;
  conversion_confidence: number;
  converter_mode: string;
  special_cases: string;
  motesart_annotations: number;
  output_xml: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  practice_count: number;
  avg_accuracy: number;
  last_practiced: string;
  created_at: string;
  updated_at: string;
}

interface PracticeSessionFields {
  session_id: string;
  asset_id: string;
  student_id: string;
  started_at: string;
  completed_at: string;
  tempo_factor: number;
  accuracy: number;
  mistakes: string;
  concepts_practiced: string;
}

// ============================================================
// HELPERS
// ============================================================

function safeJsonParse<T>(str: string | undefined | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function generateId(): string {
  return 'pa_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

function generateSessionId(): string {
  return 'ps_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

/** Convert Airtable record to PracticeAsset */
function recordToAsset(rec: AirtableRecord<PracticeAssetFields>): PracticeAsset {
  const f = rec.fields;
  return {
    id: f.asset_id,
    airtable_id: rec.id,
    created_at: f.created_at || rec.createdTime,
    updated_at: f.updated_at || rec.createdTime,
    status: (f.status || 'ready') as AssetStatus,
    output_xml: f.output_xml || '',
    handoff: {
      source_type: (f.source_type || 'musicxml') as ConverterHandoff['source_type'],
      title: f.title || 'Untitled',
      detected_key: f.detected_key || '',
      number_home: f.number_home || '',
      tempo_bpm: f.tempo_bpm || 0,
      measure_count: f.measure_count || 0,
      total_notes: f.total_notes || 0,
      total_chords: f.total_chords || 0,
      scale_map: safeJsonParse<string[]>(f.scale_map, []),
      motesart_annotations: f.motesart_annotations || 0,
      concept_candidates: safeJsonParse<string[]>(f.concept_candidates, []),
      active_concepts: safeJsonParse<PilotConceptId[]>(f.active_concepts, []),
      conversion_confidence: f.conversion_confidence || 0,
      special_cases: safeJsonParse<string[]>(f.special_cases, []),
      converter_mode: f.converter_mode || '',
    },
    assigned_to: safeJsonParse<string[] | undefined>(f.assigned_to, undefined),
    assigned_by: f.assigned_by || undefined,
    assigned_at: f.assigned_at || undefined,
    practice_count: f.practice_count || 0,
    last_practiced: f.last_practiced || undefined,
    avg_accuracy: f.avg_accuracy || undefined,
  };
}

/** Convert Airtable record to PracticeSession */
function recordToSession(rec: AirtableRecord<PracticeSessionFields>): PracticeSession {
  const f = rec.fields;
  return {
    session_id: f.session_id,
    airtable_id: rec.id,
    asset_id: f.asset_id,
    student_id: f.student_id,
    started_at: f.started_at,
    completed_at: f.completed_at || undefined,
    tempo_factor: f.tempo_factor || 1.0,
    accuracy: f.accuracy || 0,
    mistakes: safeJsonParse(f.mistakes, []),
    concepts_practiced: safeJsonParse<PilotConceptId[]>(f.concepts_practiced, []),
  };
}

// ============================================================
// CONCEPT FILTERING — only pilot concepts pass through
// ============================================================

/**
 * Filter concept candidates from converter output to only pilot concepts.
 * Non-pilot concepts are logged but not included in active grading.
 */
export function filterToPilotConcepts(candidates: string[]): {
  active: PilotConceptId[];
  flagged_non_pilot: string[];
} {
  const active: PilotConceptId[] = [];
  const flagged: string[] = [];

  for (const c of candidates) {
    if ((PILOT_CONCEPTS as readonly string[]).includes(c)) {
      active.push(c as PilotConceptId);
    } else {
      flagged.push(c);
    }
  }

  return { active, flagged_non_pilot: flagged };
}

// ============================================================
// AIRTABLE CRUD OPERATIONS
// ============================================================

const ASSETS_TABLE = 'Practice_Assets';
const SESSIONS_TABLE = 'Practice_Sessions';

/**
 * Create a practice asset from converter output.
 * Writes directly to Airtable for persistence.
 */
export async function createPracticeAsset(
  outputXml: string,
  metadata: {
    detected_key: string;
    number_home: string;
    scale_map: string[];
    conversion_mode: string;
    motesart_concepts_detected: string[];
    tempo_bpm: number;
    measure_count: number;
    total_notes: number;
    total_chords: number;
    conversion_confidence: number;
  },
  title?: string
): Promise<PracticeAsset> {
  const { active, flagged_non_pilot } = filterToPilotConcepts(
    metadata.motesart_concepts_detected || []
  );

  if (flagged_non_pilot.length > 0) {
    console.info(
      '[PracticeAssets] Non-pilot concepts flagged (not graded):',
      flagged_non_pilot
    );
  }

  const now = new Date().toISOString();
  const assetId = generateId();

  const fields: PracticeAssetFields = {
    asset_id: assetId,
    title: title || 'Untitled Piece',
    status: 'ready',
    source_type: 'musicxml',
    detected_key: metadata.detected_key,
    number_home: metadata.number_home,
    tempo_bpm: metadata.tempo_bpm,
    measure_count: metadata.measure_count,
    total_notes: metadata.total_notes,
    total_chords: metadata.total_chords,
    scale_map: JSON.stringify(metadata.scale_map),
    active_concepts: JSON.stringify(active),
    flagged_non_pilot: JSON.stringify(flagged_non_pilot),
    concept_candidates: JSON.stringify(metadata.motesart_concepts_detected),
    conversion_confidence: metadata.conversion_confidence,
    converter_mode: metadata.conversion_mode,
    special_cases: JSON.stringify([]),
    motesart_annotations: metadata.total_notes,
    output_xml: outputXml,
    assigned_to: '',
    assigned_by: '',
    assigned_at: '',
    practice_count: 0,
    avg_accuracy: 0,
    last_practiced: '',
    created_at: now,
    updated_at: now,
  };

  const data = await airtableFetch<PracticeAssetFields>(ASSETS_TABLE, {
    method: 'POST',
    body: { records: [{ fields }] },
  });

  return recordToAsset(data.records[0]);
}

/**
 * Get a practice asset by its asset_id.
 */
export async function getPracticeAsset(id: string): Promise<PracticeAsset | null> {
  try {
    const data = await airtableFetch<PracticeAssetFields>(ASSETS_TABLE, {
      params: {
        filterByFormula: `{asset_id} = "${id}"`,
        maxRecords: '1',
      },
    });
    if (data.records.length === 0) return null;
    return recordToAsset(data.records[0]);
  } catch (err) {
    console.error('[PracticeAssets] getPracticeAsset error:', err);
    return null;
  }
}

/**
 * List all practice assets, optionally filtered by status or concept.
 */
export async function listPracticeAssets(
  filter?: { status?: AssetStatus; concept?: PilotConceptId }
): Promise<PracticeAsset[]> {
  const params: Record<string, string> = {
    sort: JSON.stringify([{ field: 'created_at', direction: 'desc' }]),
  };

  // Build filter formula
  const conditions: string[] = [];
  if (filter?.status) {
    conditions.push(`{status} = "${filter.status}"`);
  }
  if (conditions.length > 0) {
    params.filterByFormula = conditions.length === 1
      ? conditions[0]
      : `AND(${conditions.join(', ')})`;
  }

  const data = await airtableFetch<PracticeAssetFields>(ASSETS_TABLE, { params });
  let results = data.records.map(recordToAsset);

  // Client-side filter for concept (JSON field, can't filter in Airtable formula easily)
  if (filter?.concept) {
    results = results.filter(a =>
      a.handoff.active_concepts.includes(filter.concept!)
    );
  }

  return results;
}

/**
 * Assign a practice asset to students.
 */
export async function assignAsset(
  assetId: string,
  studentIds: string[],
  teacherId: string
): Promise<PracticeAsset | null> {
  // First find the Airtable record
  const asset = await getPracticeAsset(assetId);
  if (!asset || !asset.airtable_id) return null;

  const now = new Date().toISOString();

  await airtableFetch(ASSETS_TABLE, {
    method: 'PATCH',
    body: {
      records: [
        {
          id: asset.airtable_id,
          fields: {
            status: 'assigned',
            assigned_to: JSON.stringify(studentIds),
            assigned_by: teacherId,
            assigned_at: now,
            updated_at: now,
          },
        },
      ],
    },
  });

  // Return updated asset
  return getPracticeAsset(assetId);
}

/**
 * Record a practice session result.
 * Creates session in Airtable and updates the parent asset's practice stats.
 */
export async function recordPracticeSession(session: PracticeSession): Promise<void> {
  const sessionId = session.session_id || generateSessionId();

  // 1. Write session to Practice_Sessions table
  const sessionFields: PracticeSessionFields = {
    session_id: sessionId,
    asset_id: session.asset_id,
    student_id: session.student_id,
    started_at: session.started_at,
    completed_at: session.completed_at || '',
    tempo_factor: session.tempo_factor,
    accuracy: session.accuracy,
    mistakes: JSON.stringify(session.mistakes || []),
    concepts_practiced: JSON.stringify(session.concepts_practiced || []),
  };

  await airtableFetch<PracticeSessionFields>(SESSIONS_TABLE, {
    method: 'POST',
    body: { records: [{ fields: sessionFields }] },
  });

  // 2. Update parent asset practice stats
  const asset = await getPracticeAsset(session.asset_id);
  if (asset && asset.airtable_id) {
    // Get all sessions for this asset to compute rolling average
    const allSessions = await airtableFetch<PracticeSessionFields>(SESSIONS_TABLE, {
      params: {
        filterByFormula: `{asset_id} = "${session.asset_id}"`,
      },
    });

    const newCount = allSessions.records.length;
    const avgAcc = allSessions.records.reduce(
      (sum, r) => sum + (r.fields.accuracy || 0), 0
    ) / newCount;

    await airtableFetch(ASSETS_TABLE, {
      method: 'PATCH',
      body: {
        records: [
          {
            id: asset.airtable_id,
            fields: {
              practice_count: newCount,
              avg_accuracy: Math.round(avgAcc * 1000) / 1000,
              last_practiced: session.completed_at || session.started_at,
              updated_at: new Date().toISOString(),
            },
          },
        ],
      },
    });
  }
}

/**
 * Get practice sessions for a student, optionally filtered by asset.
 */
export async function getStudentSessions(
  studentId: string,
  assetId?: string
): Promise<PracticeSession[]> {
  const conditions = [`{student_id} = "${studentId}"`];
  if (assetId) {
    conditions.push(`{asset_id} = "${assetId}"`);
  }

  const filterFormula = conditions.length === 1
    ? conditions[0]
    : `AND(${conditions.join(', ')})`;

  const data = await airtableFetch<PracticeSessionFields>(SESSIONS_TABLE, {
    params: {
      filterByFormula: filterFormula,
      sort: JSON.stringify([{ field: 'started_at', direction: 'desc' }]),
    },
  });

  return data.records.map(recordToSession);
}

/**
 * Get summary stats for all practice assets.
 */
export async function getPracticeAssetsSummary(): Promise<{
  total_assets: number;
  by_status: Record<AssetStatus, number>;
  total_sessions: number;
  pilot_concepts_covered: PilotConceptId[];
}> {
  // Get all assets
  const assetData = await airtableFetch<PracticeAssetFields>(ASSETS_TABLE, {
    params: {
      sort: JSON.stringify([{ field: 'created_at', direction: 'desc' }]),
    },
  });
  const assets = assetData.records.map(recordToAsset);

  // Get session count
  const sessionData = await airtableFetch<PracticeSessionFields>(SESSIONS_TABLE, {});
  const totalSessions = sessionData.records.length;

  // Aggregate
  const byStatus: Record<AssetStatus, number> = {
    draft: 0, ready: 0, assigned: 0, archived: 0,
  };
  const conceptSet = new Set<PilotConceptId>();

  for (const a of assets) {
    byStatus[a.status]++;
    for (const c of a.handoff.active_concepts) {
      conceptSet.add(c);
    }
  }

  return {
    total_assets: assets.length,
    by_status: byStatus,
    total_sessions: totalSessions,
    pilot_concepts_covered: Array.from(conceptSet),
  };
}
