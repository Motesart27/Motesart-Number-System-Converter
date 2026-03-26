import { NextRequest, NextResponse } from 'next/server';
import {
  createPracticeAsset,
  getPracticeAsset,
  listPracticeAssets,
  assignAsset,
  recordPracticeSession,
  getStudentSessions,
  getPracticeAssetsSummary,
  PILOT_CONCEPTS,
  type PracticeSession,
  type AssetStatus,
  type PilotConceptId,
} from '@/lib/practice-assets';

/**
 * POST /api/practice-assets
 *
 * Actions:
 * - { action: 'ingest' } — Create a practice asset from converter output
 * - { action: 'assign' } — Assign asset to students
 * - { action: 'record' } — Record a practice session
 *
 * GET /api/practice-assets?action=list
 * - ?action=list — List all assets (optional: status, concept filters)
 * - ?action=get&id=... — Get a single asset
 * - ?action=sessions&student=... — Get student sessions
 * - ?action=summary — Get dashboard summary
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list': {
        const status = searchParams.get('status') as AssetStatus | null;
        const concept = searchParams.get('concept') as PilotConceptId | null;
        const assets = await listPracticeAssets({
          status: status || undefined,
          concept: concept || undefined,
        });

        // Return metadata only (not full XML) for list view
        const slim = assets.map(a => ({
          id: a.id,
          status: a.status,
          created_at: a.created_at,
          updated_at: a.updated_at,
          title: a.handoff.title,
          detected_key: a.handoff.detected_key,
          tempo_bpm: a.handoff.tempo_bpm,
          measure_count: a.handoff.measure_count,
          part_count: a.handoff.part_count,
          active_concepts: a.handoff.active_concepts,
          conversion_confidence: a.handoff.conversion_confidence,
          practice_count: a.practice_count,
          avg_accuracy: a.avg_accuracy,
          assigned_to: a.assigned_to,
        }));

        return NextResponse.json({ assets: slim, total: slim.length });
      }

      case 'get': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { error: 'Missing id parameter' },
            { status: 400 }
          );
        }
        const asset = await getPracticeAsset(id);
        if (!asset) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ asset });
      }

      case 'sessions': {
        const studentId = searchParams.get('student');
        if (!studentId) {
          return NextResponse.json(
            { error: 'Missing student parameter' },
            { status: 400 }
          );
        }
        const assetId = searchParams.get('asset') || undefined;
        const sessions = await getStudentSessions(studentId, assetId);
        return NextResponse.json({ sessions, total: sessions.length });
      }

      case 'summary': {
        const summary = await getPracticeAssetsSummary();
        return NextResponse.json({
          ...summary,
          pilot_concepts_total: PILOT_CONCEPTS.length,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action: ' + action },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[practice-assets GET]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action field' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ingest': {
        const { outputXml, metadata, title } = body;

        if (!outputXml || typeof outputXml !== 'string') {
          return NextResponse.json(
            { error: 'Missing or invalid outputXml' },
            { status: 400 }
          );
        }
        if (!metadata || typeof metadata !== 'object') {
          return NextResponse.json(
            { error: 'Missing or invalid metadata' },
            { status: 400 }
          );
        }

        // Validate required metadata fields
        const required = [
          'detected_key', 'number_home', 'scale_map', 'conversion_mode',
          'motesart_concepts_detected', 'tempo_bpm', 'measure_count',
          'total_notes', 'total_chords', 'conversion_confidence',
        ];
        const missing = required.filter(f => metadata[f] == null);
        if (missing.length > 0) {
          return NextResponse.json(
            { error: 'Missing metadata fields: ' + missing.join(', ') },
            { status: 400 }
          );
        }

        const asset = await createPracticeAsset(outputXml, metadata, title);

        return NextResponse.json({
          success: true,
          asset: {
            id: asset.id,
            status: asset.status,
            title: asset.handoff.title,
            detected_key: asset.handoff.detected_key,
            part_count: asset.handoff.part_count,
            active_concepts: asset.handoff.active_concepts,
            conversion_confidence: asset.handoff.conversion_confidence,
            created_at: asset.created_at,
          },
          message: `Practice asset created with ${asset.handoff.active_concepts.length} active pilot concepts`,
        });
      }

      case 'assign': {
        const { asset_id, student_ids, teacher_id } = body;
        if (!asset_id || !student_ids || !teacher_id) {
          return NextResponse.json(
            { error: 'Missing asset_id, student_ids, or teacher_id' },
            { status: 400 }
          );
        }
        const updated = await assignAsset(asset_id, student_ids, teacher_id);
        if (!updated) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          asset_id: updated.id,
          assigned_to: updated.assigned_to,
          assigned_at: updated.assigned_at,
        });
      }

      case 'record': {
        const { session } = body;
        if (!session || !session.asset_id || !session.student_id) {
          return NextResponse.json(
            { error: 'Missing session data (asset_id, student_id required)' },
            { status: 400 }
          );
        }

        // Validate asset exists
        const asset = await getPracticeAsset(session.asset_id);
        if (!asset) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          );
        }

        const practiceSession: PracticeSession = {
          asset_id: session.asset_id,
          student_id: session.student_id,
          started_at: session.started_at || new Date().toISOString(),
          completed_at: session.completed_at,
          tempo_factor: session.tempo_factor ?? 1.0,
          accuracy: session.accuracy ?? 0,
          mistakes: session.mistakes || [],
          concepts_practiced: (session.concepts_practiced || []).filter(
            (c: string) => (PILOT_CONCEPTS as readonly string[]).includes(c)
          ),
        };

        await recordPracticeSession(practiceSession);

        return NextResponse.json({
          success: true,
          asset_id: session.asset_id,
          practice_count: asset.practice_count + 1,
          concepts_practiced: practiceSession.concepts_practiced,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action: ' + action },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[practice-assets POST]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
