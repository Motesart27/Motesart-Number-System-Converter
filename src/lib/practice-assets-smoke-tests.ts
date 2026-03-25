/**
 * practice-assets-smoke-tests.ts
 * 
 * 5 smoke tests for the converter-to-practice pipeline.
 * Verifies: asset creation, pilot concept filtering, handoff contract,
 * practice session recording, and summary stats.
 * 
 * Run via: import { runPracticeAssetsSmokeTests } from '@/lib/practice-assets-smoke-tests'
 * Call: runPracticeAssetsSmokeTests() — returns { passed: boolean, results: [...] }
 */

import {
  createPracticeAsset,
  getPracticeAsset,
  listPracticeAssets,
  recordPracticeSession,
  getPracticeAssetsSummary,
  filterToPilotConcepts,
  PILOT_CONCEPTS,
  type PracticeAsset,
  type PracticeSession,
} from './practice-assets';

interface TestResult {
  test: string;
  passed: boolean;
  got: string;
  expected: string;
}

export function runPracticeAssetsSmokeTests(): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // ── Test 1: Create practice asset from converter output ──
  const mockMetadata = {
    detected_key: 'C major',
    number_home: '1',
    scale_map: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    conversion_mode: 'practice',
    motesart_concepts_detected: ['T_HALF_STEP', 'T_MAJOR_SCALE_PATTERN', 'T_KEYBOARD_LAYOUT'],
    tempo_bpm: 120,
    measure_count: 8,
    total_notes: 32,
    total_chords: 4,
    conversion_confidence: 0.95,
  };

  const asset = createPracticeAsset('<score-partwise/>', mockMetadata, 'Test Piece');
  const t1 = asset !== null && asset.id.startsWith('pa_') && asset.status === 'ready';
  results.push({
    test: 'Create practice asset returns valid asset with id and ready status',
    passed: t1,
    got: asset ? 'id=' + asset.id + ', status=' + asset.status : 'null',
    expected: 'id=pa_*, status=ready',
  });

  // ── Test 2: Pilot concept filtering — non-pilot concepts excluded ──
  const { active, flagged_non_pilot } = filterToPilotConcepts([
    'T_HALF_STEP', 'T_MAJOR_SCALE_PATTERN', 'T_KEYBOARD_LAYOUT', 'T_CHORD_QUALITY'
  ]);
  const t2 = active.length === 2 
    && active.includes('T_HALF_STEP') 
    && active.includes('T_MAJOR_SCALE_PATTERN')
    && flagged_non_pilot.length === 2
    && flagged_non_pilot.includes('T_KEYBOARD_LAYOUT');
  results.push({
    test: 'filterToPilotConcepts keeps only pilot concepts, flags non-pilot',
    passed: t2,
    got: 'active=[' + active.join(',') + '], flagged=[' + flagged_non_pilot.join(',') + ']',
    expected: 'active=[T_HALF_STEP,T_MAJOR_SCALE_PATTERN], flagged includes T_KEYBOARD_LAYOUT',
  });

  // ── Test 3: Handoff contract — all required fields present ──
  const requiredHandoffFields = [
    'source_type', 'title', 'detected_key', 'number_home', 'tempo_bpm',
    'measure_count', 'total_notes', 'total_chords', 'scale_map',
    'motesart_annotations', 'concept_candidates', 'active_concepts',
    'conversion_confidence', 'special_cases', 'converter_mode'
  ];
  const handoff = asset.handoff;
  const missingFields = requiredHandoffFields.filter(f => (handoff as unknown as Record<string, unknown>)[f] == null);
  const t3 = missingFields.length === 0 
    && handoff.active_concepts.length === 2 
    && handoff.source_type === 'musicxml';
  results.push({
    test: 'Handoff contract has all required fields, active_concepts filtered to pilot only',
    passed: t3,
    got: 'missing=[' + missingFields.join(',') + '], active_concepts=' + handoff.active_concepts.length + ', source=' + handoff.source_type,
    expected: 'missing=[], active_concepts=2, source=musicxml',
  });

  // ── Test 4: Record practice session updates asset stats ──
  const session: PracticeSession = {
    asset_id: asset.id,
    student_id: 'student_test_001',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    tempo_factor: 0.75,
    accuracy: 0.82,
    mistakes: [],
    concepts_practiced: ['T_HALF_STEP'],
  };
  recordPracticeSession(session);
  const updatedAsset = getPracticeAsset(asset.id);
  const t4 = updatedAsset !== null 
    && updatedAsset.practice_count === 1
    && updatedAsset.avg_accuracy === 0.82
    && updatedAsset.last_practiced !== undefined;
  results.push({
    test: 'Recording practice session updates asset practice_count and avg_accuracy',
    passed: t4,
    got: updatedAsset ? 'count=' + updatedAsset.practice_count + ', avg=' + updatedAsset.avg_accuracy : 'null',
    expected: 'count=1, avg=0.82',
  });

  // ── Test 5: Summary stats reflect all data correctly ──
  const summary = getPracticeAssetsSummary();
  const t5 = summary.total_assets >= 1
    && summary.total_sessions >= 1
    && summary.pilot_concepts_covered.length > 0
    && summary.pilot_concepts_covered.every(c => (PILOT_CONCEPTS as readonly string[]).includes(c));
  results.push({
    test: 'Summary stats: assets >= 1, sessions >= 1, all covered concepts are pilot concepts',
    passed: t5,
    got: 'assets=' + summary.total_assets + ', sessions=' + summary.total_sessions + ', concepts=[' + summary.pilot_concepts_covered.join(',') + ']',
    expected: 'assets>=1, sessions>=1, concepts all in PILOT_CONCEPTS',
  });

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}
