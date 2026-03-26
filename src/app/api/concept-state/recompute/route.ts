import { NextRequest, NextResponse } from 'next/server';
import { getState, setState } from '@/lib/concept-state-server-store';
import type { ConceptState } from '@/lib/concept-state-server-store';
import { getEventsByStudentConcept } from '@/lib/practice-events-store';
import { corsHeaders, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const { student_instrument_id, concept_id } = body;

    if (!student_instrument_id || !concept_id) {
      return NextResponse.json(
        { error: 'Missing student_instrument_id or concept_id' },
        { status: 400, headers }
      );
    }

    const rawEvents = await getEventsByStudentConcept(student_instrument_id, concept_id);

    if (rawEvents.length === 0) {
      return NextResponse.json(
        { recomputed: false, reason: 'No practice events found' },
        { status: 404, headers }
      );
    }

    // Sort ascending by created_at so events[length-1] is the most recent
    const events = [...rawEvents].sort((a, b) =>
      (a.created_at || '').localeCompare(b.created_at || '')
    );

    const existing = await getState(student_instrument_id, concept_id);

    const latestEvent = events[events.length - 1];
    const chapter = latestEvent.chapter || 'find_it';
    const completedEvents = events.filter(e => e.result === 'complete');
    const totalWrongTaps = events.reduce((sum, e) => sum + (e.wrong_taps?.length || 0), 0);
    const hintEverUsed = events.some(e => e.hint_used);

    // --- Confidence: based on latest event only ---
    let confidence = 0.5;
    if (latestEvent.result === 'complete') {
      const wrongCount = latestEvent.wrong_taps?.length || 0;
      if (wrongCount === 0 && !latestEvent.hint_used) confidence = 0.9;
      else if (wrongCount === 0) confidence = 0.7;
      else if (wrongCount <= 2) confidence = 0.6;
      else confidence = 0.4;
    } else {
      confidence = 0.3;
    }

    // --- Trend: rolling window of last 3 ---
    const last3 = existing?.last_3_confidences ? [...existing.last_3_confidences] : [];
    last3.push(confidence);
    if (last3.length > 3) last3.shift();

    let trend = 'stable';
    if (last3.length >= 2) {
      const recent = last3[last3.length - 1];
      const prior = last3[last3.length - 2];
      if (recent > prior) trend = 'improving';
      else if (recent < prior) trend = 'declining';
    }

    // --- Mistake pattern: aggregate across all events ---
    const allWrongTaps = events.flatMap(e => e.wrong_taps || []);
    let mistakePattern = 'No wrong taps';
    if (allWrongTaps.length > 0) {
      const wrongCounts: Record<string, number> = {};
      allWrongTaps.forEach(t => { wrongCounts[t] = (wrongCounts[t] || 0) + 1; });
      const sorted = Object.entries(wrongCounts).sort((a, b) => b[1] - a[1]);
      mistakePattern = 'Most missed: ' + sorted[0][0] + ' (' + sorted[0][1] + 'x). Total wrong taps: ' + totalWrongTaps;
    }

    // --- Chapter-aware evidence, mastery, and next action ---
    // next_action uses snake_case to match PracticeChapterWrapper
    const pairsFound = latestEvent.found_pairs || [];
    let evidenceSummary = '';
    let masteryReady = false;
    let recommendedStrategy = '';
    let nextAction = '';

    const completedFindIt = completedEvents.some(e => (e.chapter || 'find_it') === 'find_it');
    const completedPlayIt = completedEvents.some(e => e.chapter === 'play_it');

    if (chapter === 'play_it') {
      evidenceSummary = 'Play It ' + latestEvent.result + ': played '
        + pairsFound.join(', ') + ' in ' + latestEvent.attempt_count + ' taps. '
        + (totalWrongTaps === 0 ? 'No wrong taps.' : totalWrongTaps + ' wrong tap(s).')
        + (hintEverUsed ? ' Hint used.' : '')
        + ' Confidence: ' + Math.round(confidence * 100) + '%';

      masteryReady = confidence >= 0.7 && completedPlayIt;
      recommendedStrategy = masteryReady
        ? 'advance_to_move_it'
        : (confidence < 0.5 ? 'retry_with_hint' : 'retry_without_hint');
      nextAction = masteryReady ? 'move_it' : 'retry_play_it';

    } else if (chapter === 'move_it') {
      // Move It: home-based transfer evaluation
      const homeKey = latestEvent.home_key || 'C';
      const playedNotes = latestEvent.found_pairs || latestEvent.played_notes || [];
      const moveItEvents = completedEvents.filter((e) => e.chapter === 'move_it');
      const homesCompleted = [...new Set(moveItEvents.map((e) => e.home_key).filter(Boolean))];
      const allThreeHomes = homesCompleted.includes('C') && homesCompleted.includes('G') && homesCompleted.includes('F');
      const transferPassed = allThreeHomes;

      const homeWrong = latestEvent.wrong_taps?.length || 0;
      if (latestEvent.result === 'complete') {
        if (homeWrong === 0 && !latestEvent.hint_used) confidence = 0.9;
        else if (homeWrong === 0) confidence = 0.7;
        else if (homeWrong <= 2) confidence = 0.6;
        else confidence = 0.4;
      }

      const stalledNote = latestEvent.stalled_on_note;
      if (stalledNote) mistakePattern = 'Stalled on: ' + stalledNote + '. ' + mistakePattern;

      evidenceSummary = 'Move It home ' + homeKey + ' ' + latestEvent.result + ': played ' + playedNotes.join('-')
        + '. ' + (homeWrong === 0 ? 'No wrong taps.' : homeWrong + ' wrong tap(s).')
        + (stalledNote ? ' Stalled on ' + stalledNote + '.' : '')
        + ' Homes completed: ' + (homesCompleted.length > 0 ? homesCompleted.join(', ') : 'none')
        + '. Confidence: ' + Math.round(confidence * 100) + '%';

      masteryReady = transferPassed && confidence >= 0.7;
      recommendedStrategy = masteryReady ? 'advance_to_own_it'
        : (allThreeHomes ? 'retry_weak_home' : 'continue_transfer');
      nextAction = masteryReady ? 'own_it' : 'move_it';

    } else {
      evidenceSummary = 'Find It ' + latestEvent.result + ': found '
        + pairsFound.join(' and ') + ' in ' + latestEvent.attempt_count + ' taps. '
        + (totalWrongTaps === 0 ? 'No wrong taps.' : totalWrongTaps + ' wrong tap(s).')
        + (hintEverUsed ? ' Hint used.' : '')
        + ' Confidence: ' + Math.round(confidence * 100) + '%';

      masteryReady = confidence >= 0.7 && completedFindIt;
      recommendedStrategy = masteryReady
        ? 'advance_to_play_it'
        : (confidence < 0.5 ? 'retry_with_hint' : 'retry_without_hint');
      nextAction = masteryReady ? 'play_it' : 'retry_find_it';
    }

    const newState: ConceptState = {
      student_instrument_id,
      concept_id,
      confidence,
      trend,
      mastery_ready: masteryReady,
      mistake_pattern: mistakePattern,
      recommended_strategy: recommendedStrategy,
      next_action: nextAction,
      evidence_summary: evidenceSummary,
      last_3_confidences: last3,
      updated_at: new Date().toISOString(),
      ...(chapter === 'move_it' ? {
        homes_completed: [...new Set(completedEvents.filter((e) => e.chapter === 'move_it').map((e) => e.home_key).filter(Boolean))],
        transfer_passed: (() => { const hc = [...new Set(completedEvents.filter((e) => e.chapter === 'move_it').map((e) => e.home_key).filter(Boolean))]; return hc.includes('C') && hc.includes('G') && hc.includes('F'); })()
      } : {})
    };

    await setState(newState);

    return NextResponse.json(
      { recomputed: true, state: newState, events_analyzed: events.length },
      { status: 200, headers }
    );
  } catch (err) {
    console.error('[recompute] Error:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500, headers }
    );
  }
}
