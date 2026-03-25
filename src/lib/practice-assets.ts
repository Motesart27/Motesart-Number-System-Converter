/**
 * practice-assets.ts
 * 
 * Practice Assets layer for the Motesart Number System Converter.
 * Stores converted MusicXML files as structured training data
 * that the practice app consumes for student exercises.
 * 
 * Architecture:
 *   Converter output (XML) -> Practice Asset record -> Practice page consumes
 *   -> Concept_State updates from practice sessions
 * 
 * This file handles:
 *   - PracticeAsset type definitions
 *   - In-memory store (MVP — Airtable integration later)
 *   - CRUD operations for practice assets
 *   - Concept mapping restricted to 5 pilot concepts
 *   - Handoff contract between converter and practice app
 */

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

export type PilotConceptId = typeof PILOT_CONCEPTS[number];

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
  created_at: string;
  updated_at: string;
  status: AssetStatus;
  
  /** The converted MusicXML string with SOM annotations */
  output_xml: string;
  
  /** Handoff metadata from the converter */
  handoff: ConverterHandoff;
  
  /** Teacher-facing fields */
  assigned_to?: string[];  // student IDs
  assigned_by?: string;    // teacher ID
  assigned_at?: string;
  
  /** Practice tracking */
  practice_count: number;
  last_practiced?: string;
  avg_accuracy?: number;
}

/** What the practice page needs to render and track */
export interface PracticeSession {
  asset_id: string;
  student_id: string;
  started_at: string;
  completed_at?: string;
  tempo_factor: number;  // 0.5 = half speed, 1.0 = normal
  accuracy: number;      // 0-1
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
// IN-MEMORY STORE (MVP — no Airtable yet)
// ============================================================

let _assets: Map<string, PracticeAsset> = new Map();
let _sessions: PracticeSession[] = [];

function generateId(): string {
  return 'pa_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// ============================================================
// CRUD OPERATIONS
// ============================================================

/**
 * Create a practice asset from converter output.
 * This is the main entry point after XML conversion.
 */
export function createPracticeAsset(
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
): PracticeAsset {
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
  const asset: PracticeAsset = {
    id: generateId(),
    created_at: now,
    updated_at: now,
    status: 'ready',
    output_xml: outputXml,
    handoff: {
      source_type: 'musicxml',
      title: title || 'Untitled Piece',
      detected_key: metadata.detected_key,
      number_home: metadata.number_home,
      tempo_bpm: metadata.tempo_bpm,
      measure_count: metadata.measure_count,
      total_notes: metadata.total_notes,
      total_chords: metadata.total_chords,
      scale_map: metadata.scale_map,
      motesart_annotations: metadata.total_notes, // each note gets a SOM annotation
      concept_candidates: metadata.motesart_concepts_detected,
      active_concepts: active,
      conversion_confidence: metadata.conversion_confidence,
      special_cases: [],
      converter_mode: metadata.conversion_mode,
    },
    practice_count: 0,
  };
  
  _assets.set(asset.id, asset);
  return asset;
}

/**
 * Get a practice asset by ID.
 */
export function getPracticeAsset(id: string): PracticeAsset | null {
  return _assets.get(id) || null;
}

/**
 * List all practice assets, optionally filtered by status.
 */
export function listPracticeAssets(
  filter?: { status?: AssetStatus; concept?: PilotConceptId }
): PracticeAsset[] {
  let results = Array.from(_assets.values());
  
  if (filter?.status) {
    results = results.filter(a => a.status === filter.status);
  }
  if (filter?.concept) {
    results = results.filter(a => 
      a.handoff.active_concepts.includes(filter.concept!)
    );
  }
  
  return results.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Assign a practice asset to students.
 */
export function assignAsset(
  assetId: string,
  studentIds: string[],
  teacherId: string
): PracticeAsset | null {
  const asset = _assets.get(assetId);
  if (!asset) return null;
  
  asset.status = 'assigned';
  asset.assigned_to = studentIds;
  asset.assigned_by = teacherId;
  asset.assigned_at = new Date().toISOString();
  asset.updated_at = new Date().toISOString();
  
  _assets.set(assetId, asset);
  return asset;
}

/**
 * Record a practice session result.
 */
export function recordPracticeSession(session: PracticeSession): void {
  _sessions.push(session);
  
  const asset = _assets.get(session.asset_id);
  if (asset) {
    asset.practice_count += 1;
    asset.last_practiced = session.completed_at || session.started_at;
    
    // Rolling average accuracy
    const assetSessions = _sessions.filter(s => s.asset_id === session.asset_id);
    asset.avg_accuracy = assetSessions.reduce((sum, s) => sum + s.accuracy, 0) / assetSessions.length;
    asset.updated_at = new Date().toISOString();
    
    _assets.set(asset.id, asset);
  }
}

/**
 * Get practice sessions for a student, optionally filtered by asset.
 */
export function getStudentSessions(
  studentId: string,
  assetId?: string
): PracticeSession[] {
  let results = _sessions.filter(s => s.student_id === studentId);
  if (assetId) {
    results = results.filter(s => s.asset_id === assetId);
  }
  return results.sort((a, b) => 
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

/**
 * Get all assets, sessions count, and summary stats.
 */
export function getPracticeAssetsSummary(): {
  total_assets: number;
  by_status: Record<AssetStatus, number>;
  total_sessions: number;
  pilot_concepts_covered: PilotConceptId[];
} {
  const assets = Array.from(_assets.values());
  const byStatus: Record<AssetStatus, number> = {
    draft: 0, ready: 0, assigned: 0, archived: 0
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
    total_sessions: _sessions.length,
    pilot_concepts_covered: Array.from(conceptSet),
  };
}
