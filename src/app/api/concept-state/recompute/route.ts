import { NextRequest, NextResponse } from 'next/server';
import { getState, setState } from '@/lib/concept-state-server-store';
import type { ConceptState } from '@/lib/concept-state-server-store';
import { getEventsByStudentConcept } from '@/lib/practice-events-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_instrument_id, concept_id } = body;

    if (!student_instrument_id || !concept_id) {
      return NextResponse.json(
        { error: 'Missing student_instrument_id or concept_id' },
        { status: 400 }
      );
    }

    // Get all practice events for this student + concept
    const events = getEventsByStudentConcept(student_instrument_id, concept_id);

    if (events.length === 0) {
      return NextResponse.json(
        { recomputed: false, reason: 'No practice events found' },
        { status: 404 }
      );
    }

    const existing = getState(student_instrument_id, concept_id);
    const latestEvent = events[events.length - 1];
    const completedEvents = events.filter(e => e.result === 'complete');
    const totalWrongTaps = events.reduce((sum, e) => sum + (e.wrong_taps?.length || 0), 0);
    const hintEverUsed = events.some(e => e.hint_used);

    // Confidence: simple for Find It v1
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

    // Last 3 confidences
    const last3 = existing?.last_3_confidences ? [...existing.last_3_confidences] : [];
    last3.push(confidence);
    if (last3.length > 3) last3.shift();

    // Trend from last 3
    let trend = 'stable';
    if (last3.length >= 2) {
      const recent = last3[last3.length - 1];
      const prior = last3[last3.length - 2];
      if (recent > prior) trend = 'improving';
      else if (recent < prior) trend = 'declining';
    }

    // Mistake pattern
    const allWrongTaps = events.flatMap(e => e.wrong_taps || []);
    let mistakePattern = 'No wrong taps \u2014 found both pairs directly';
    if (allWrongTaps.length > 0) {
      const wrongCounts: Record<string, number> = {};
      allWrongTaps.forEach(t => { wrongCounts[t] = (wrongCounts[t] || 0) + 1; });
      const sorted = Object.entries(wrongCounts).sort((a, b) => b[1] - a[1]);
      mistakePattern = 'Most missed: ' + sorted[0][0] + ' (' + sorted[0][1] + 'x). Total wrong taps: ' + totalWrongTaps;
    }

    // Evidence summary
    const pairsFound = latestEvent.found_pairs || [];
    const evidenceSummary = 'Find It ' + latestEvent.result + ': found ' + pairsFound.join(' and ') +
      ' in ' + latestEvent.attempt_count + ' taps. ' +
      (totalWrongTaps === 0 ? 'No wrong taps.' : totalWrongTaps + ' wrong tap(s).') +
      (hintEverUsed ? ' Hint used.' : '') +
      ' Confidence: ' + Math.round(confidence * 100) + '%';

    const masteryReady = confidence >= 0.7 && completedEvents.length > 0;

    const newState: ConceptState = {
      student_instrument_id,
      concept_id,
      confidence,
      trend,
      mastery_ready: masteryReady,
      mistake_pattern: mistakePattern,
      recommended_strategy: masteryReady ? 'advance_to_play_it' : (confidence < 0.5 ? 'retry_with_hint' : 'retry_without_hint'),
      next_action: masteryReady ? 'Play It' : 'Retry Find It',
      evidence_summary: evidenceSummary,
      last_3_confidences: last3,
      updated_at: new Date().toISOString(),
    };

    setState(newState);

    return NextResponse.json(
      { recomputed: true, state: newState, events_analyzed: events.length },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
