import { NextRequest, NextResponse } from 'next/server';

// Extend serverless function timeout (Netlify supports up to 26s on Pro)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const SOM_CONVERSION_PROMPT = `You are a Motesart Number System (SOM) expert converter. Analyze this sheet music and produce a COMPLETE SOM Teaching Edition conversion.

## THE MOTESART NUMBER SYSTEM RULES
- Numbers 1-7 = major scale degrees: 1(do) 2(re) 3(mi) 4(fa) 5(sol) 6(la) 7(ti)
- Half-numbers for chromatic tones: 1½, 2½, 4½, 5½, 6½ (NEVER 3½ or 7½)
- "1 = C" means C is the tonic: C=1, D=2, E=3, F=4, G=5, A=6, B=7
- Diatonic major chords (1, 4, 5): NO modifier needed
- Major on non-diatonic degree: "M" suffix (e.g., 2M for D major in key of C)
- Minor chords: "m" suffix (e.g., 6m for Am in key of C)
- Diminished: "dim" suffix (e.g., 7dim)
- Augmented: "+" suffix (e.g., 5+)
- Dominant 7th: "(7)" suffix (e.g., 5(7) for G7 in key of C)
- Major 7th: "maj7" suffix (e.g., 1maj7, 4maj7)
- Minor 7th: "m7" suffix (e.g., 2m7, 6m7)
- Diminished 7th: "dim7" suffix (e.g., 7dim7)
- Suspended 2nd: "sus2" suffix (e.g., 1sus2, 5sus2)
- Suspended 4th: "sus4" suffix (e.g., 1sus4, 5sus4)
- Add chords: "add9" suffix (e.g., 1add9)
- Extensions 9/11/13: parenthetical (e.g., 5(9), 2m(11))
- Slash/Inversion chords: chord/bass (e.g., 5/7 for G/B in key of C)

## OFFICIAL CHORD SYNTAX REFERENCE (LOCKED)
All converted chords MUST use ONLY the syntax above. Do not invent variations.
Valid examples: 1, 4, 5, 2m, 3m, 6m, 5(7), 1maj7, 2m7, 7dim, 5+, 1sus4, 5/7, 4½
Invalid examples: Imaj, IV, vi, V7, IΔ, ii7, bVII (do NOT use Roman numerals or jazz shorthand)

## SCALE MAP REFERENCE
When you detect a key, build the full scale map. Example for Key of C:
C=1, D=2, E=3, F=4, G=5, A=6, B=7
Example for Key of G:
G=1, A=2, B=3, C=4, D=5, E=6, F#=7

## OUTPUT STRUCTURE (3 LAYERS)
Your JSON response MUST contain these three layers:

### A. RENDER LAYER (what the user sees)
- "title": Song title
- "subtitle": "SOM Teaching Edition" (always)
- "metadata": { "keys": [...detected keys...], "meter": string, "tempo": number, "artist": string }
- "sections": Array of section objects (see LINE TYPES below)

### B. EXPLANATION LAYER (how you got there)
- "detectedKey": The primary key detected (e.g., "C", "G", "Bb")
- "homeNumber": What letter = 1 (e.g., "C = 1")
- "scaleMap": Array of 7 strings showing the full mapping (e.g., ["C=1", "D=2", "E=3", "F=4", "G=5", "A=6", "B=7"])
- "chordTranslations": Array of { "original": string, "converted": string, "reason": string, "confidence": number (0-100), "specialCase": boolean }
  Every unique chord in the song MUST have exactly one entry. The "reason" field should be a brief explanation (e.g., "G is the 5th degree of C major", "Am is the 6th degree minor").
- "assumptions": Array of strings listing any assumptions you made (e.g., "Assumed key of C based on opening chord progression", "Treated Dm7 as ii7 rather than borrowed chord")

### C. VALIDATION LAYER (self-check)
- "conversionConfidence": { "overall": number (0-100), "totalChords": number, "resolvedChords": number, "ambiguousCount": number, "reasons": string[] }
  "reasons" should list specific factors affecting confidence (e.g., "All chords diatonic to detected key", "One borrowed chord flagged")
- "specialCases": Array of strings for edge cases. Examples: "G7 treated as dominant 7th (V7 analog) leading to C", "Slash chord F/C converted to 4/1", "Key modulation detected at section Bridge", "Ambiguous: Dm7 could be ii7 or vi7"
- "renderHints": { "viewType": "lead_sheet" | "hymn" | "plain_text", "lyricAlignment": "word" | "syllable", "editionType": "quick" }

## LINE TYPES
- "chords": A chord progression line. Include "original" (letter chords), "som" (number conversion), and optionally "lyrics"
- "notes": Individual note sequences (instrumental/melody). Include "label", "original", and "som"
- "nc": No chord section. Just lyrics with N.C. marking
- "break": An instrumental break or transition with optional "label"

## CHORD-LYRIC ALIGNMENT (CRITICAL — FOLLOW EXACTLY)
In the original sheet music, chord symbols (like F, Bb, C) appear ABOVE specific words/syllables. You MUST preserve this exact positioning when converting to SOM numbers.

Rules:
1. The "original" chord line and "som" chord line must be the SAME LENGTH as the "lyrics" line
2. Each chord/number must START at the exact character index where the corresponding word begins in the lyrics
3. Use spaces to pad between chords so alignment is perfect
4. When a chord name is shorter than the original (e.g., "Bb" → "4½"), pad with spaces to maintain alignment of subsequent chords
5. When a chord name is longer, you may need to adjust but NEVER shift subsequent lyrics

Example:
lyrics: "Amazing grace how sweet the sound"
original: "F                 Bb        F"
som:      "1                 4         1"

Notice: "F" and "1" start at index 0 (above "Amazing"), "Bb" and "4" start at index 18 (above "sweet"), etc.

## CONVERSION RULES
1. Detect the key from chord progressions, key signatures, or explicit markings
2. Map EVERY chord to SOM numbers using the LOCKED syntax above
3. For songs with key changes, mark modulations as special cases and create new sections
4. Include the full scale reference for each key section
5. Extract title, artist, tempo, meter if visible in the document
6. If info is not in the document, make educated guesses based on the music
7. Handle N.C. (No Chord) sections properly
8. For note sequences use dashes: "5-5-5 5-5-5 5-5-5-5 6-4-6-7"
9. Output ONLY valid JSON. No explanations, no markdown fences.
10. ALWAYS space-align "som" with "lyrics" — each chord number must start at the EXACT character index of the word/syllable it belongs to. This is the #1 most important formatting rule.
11. Every chord in "original" MUST have a corresponding entry in "chordTranslations"
12. If ANY chord is ambiguous, set its specialCase to true and add it to "specialCases" array`;

// ============================================
// DETERMINISTIC POST-GEMINI VALIDATOR
// Runs after AI returns JSON, before sending to frontend
// ============================================

// Official allowed chord pattern: number (1-7), optional half, optional modifier
const VALID_CHORD_RE = /^[1-7](½)?(m7|maj7|dim7|m|dim|sus2|sus4|add9|\+|\(7\)|\(9\)|\(11\)|\(13\)|M)?(\/[1-7](½)?)?$/;

interface ValidationWarning {
  type: 'missing_translation' | 'invalid_syntax' | 'key_mismatch' | 'confidence_mismatch' | 'unresolved_ambiguity';
  message: string;
  chord?: string;
}

function validateConversion(result: Record<string, unknown>): { valid: boolean; warnings: ValidationWarning[]; fixedConfidence?: number } {
  const warnings: ValidationWarning[] = [];
  
  // 1. Check every source chord has a translation
  const translatedOriginals = new Set<string>();
  const translations = (result.chordTranslations as Array<{original: string; converted: string; confidence: number; specialCase?: boolean}>) || [];
  for (const t of translations) {
    translatedOriginals.add(t.original);
  }
  
  // Collect all unique original chords from sections
  const allOriginalChords = new Set<string>();
  const sections = (result.sections as Array<{subsections?: Array<{lines?: Array<{type: string; original?: string}>}>; lines?: Array<{type: string; original?: string}>}>) || [];
  for (const section of sections) {
    // Walk subsections (SOM Teaching Edition structure) or direct lines (legacy)
    const allLines: Array<{type: string; original?: string}> = [];
    if (section.subsections) {
      for (const sub of section.subsections) {
        if (sub.lines) allLines.push(...sub.lines);
      }
    } else if (section.lines) {
      allLines.push(...section.lines);
    }
    for (const line of allLines) {
      if (line.type === 'chords' && line.original) {
        const chords = (line.original as string).trim().split(/\s+/);
        for (const c of chords) {
          if (c && c !== '' && c !== 'N.C.') allOriginalChords.add(c);
        }
      }
    }
  }
  
  for (const chord of allOriginalChords) {
    if (!translatedOriginals.has(chord)) {
      warnings.push({ type: 'missing_translation', message: `Chord "${chord}" appears in sections but has no translation entry`, chord });
    }
  }
  
  // 2. Check every converted chord uses valid syntax
  for (const t of translations) {
    const converted = t.converted;
    if (converted && !VALID_CHORD_RE.test(converted) && converted !== 'N.C.') {
      warnings.push({ type: 'invalid_syntax', message: `Converted chord "${converted}" (from "${t.original}") does not match official SOM syntax`, chord: converted });
    }
  }
  
  // 3. Check key compatibility with scaleMap
  const scaleMap = (result.scaleMap as string[]) || [];
  const detectedKey = (result.detectedKey as string) || '';
  if (scaleMap.length === 7 && detectedKey) {
    const firstMapping = scaleMap[0] || '';
    if (!firstMapping.startsWith(detectedKey)) {
      warnings.push({ type: 'key_mismatch', message: `Detected key "${detectedKey}" doesn't match scaleMap first entry "${firstMapping}"` });
    }
  }
  
  // 4. Check confidence consistency
  const conf = result.conversionConfidence as {overall: number; ambiguousCount: number} | undefined;
  if (conf) {
    const hasSpecialCases = translations.some(t => t.specialCase);
    if (conf.overall >= 95 && conf.ambiguousCount > 0) {
      warnings.push({ type: 'confidence_mismatch', message: `Confidence is ${conf.overall}% but ${conf.ambiguousCount} ambiguous chords reported` });
    }
    if (conf.overall >= 95 && hasSpecialCases) {
      warnings.push({ type: 'confidence_mismatch', message: `Confidence is ${conf.overall}% but special cases exist in translations` });
    }
  }
  
  // 5. Check special cases are not hidden
  const specialCaseChords = translations.filter(t => t.specialCase);
  const specialCasesArray = (result.specialCases as string[]) || [];
  if (specialCaseChords.length > 0 && specialCasesArray.length === 0) {
    warnings.push({ type: 'unresolved_ambiguity', message: `${specialCaseChords.length} chords flagged as special cases but specialCases array is empty` });
  }
  
  // Calculate adjusted confidence if needed
  let fixedConfidence: number | undefined;
  if (conf && warnings.length > 0) {
    const penalty = warnings.filter(w => w.type !== 'confidence_mismatch').length * 5;
    fixedConfidence = Math.max(0, Math.min(100, (conf.overall || 90) - penalty));
  }
  
  return { valid: warnings.length === 0, warnings, fixedConfidence };
}

export async function POST(request: NextRequest) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Parse converter mode (default: quick)
    const mode = (formData.get('mode') as string) || 'quick';
    const validModes = ['quick', 'curriculum', 'compliance'];
    const converterMode = validModes.includes(mode) ? mode : 'quick';

    console.log(`[process] Processing file: ${file.name}, type: ${file.type}, size: ${file.size}, mode: ${converterMode}`);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type
    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      mimeType = mimeMap[ext || ''] || 'application/pdf';
    }

    console.log(`[process] Using MIME type: ${mimeType}, base64 length: ${base64Data.length}`);

    const prompt = SOM_CONVERSION_PROMPT;

    // Mode-specific prompt extensions
    const CURRICULUM_EXTENSION = `
Additionally, for this Curriculum Convert edition, please also include in your JSON response:
- "conceptsExercised": an array of concept IDs this piece exercises. Use these canonical IDs where applicable: T_HALF_STEP, T_WHOLE_STEP, T_MAJOR_SCALE_PATTERN, T_SCALE_DEGREES_MAJOR, T_MAJOR_3RD, T_KEYBOARD_LAYOUT, T_CHORD_TRIAD_STRUCTURE, T_CHORD_QUALITY, T_KEY_SIGNATURE_READING, T_INTERVAL_RECOGNITION
- "suggestedPhase": which learning phase this piece best fits (PHASE_1_FOUNDATIONS, PHASE_2_PATTERNS, PHASE_3_INTERVALS, PHASE_4_KEYS, PHASE_5_HARMONY, PHASE_6_NOTATION)
- "teachingNotes": 2-3 sentences of educator-facing guidance on how to use this piece in a Motesart lesson
- "toolSuggestions": array of teaching tool names that match the concepts (e.g., "numbered_keyboard", "scale_pattern_overlay", "half_step_demo", "interval_demo", "finger_map_numbered")
`;

    const COMPLIANCE_EXTENSION = `
Additionally, for this Compliance Convert edition, please also include in your JSON response:
- "conceptsExercised": an array of concept IDs this piece exercises (same as curriculum mode)
- "suggestedPhase": which learning phase this piece best fits
- "gradeBandAlignment": which grade bands this piece is appropriate for (e.g., "K-2", "1-3", "2-5", "3-8")
- "standardsEvidence": a 1-2 sentence school-facing evidence statement suitable for compliance reporting
- "complianceNotes": educator/admin-facing notes about curriculum alignment
- "teachingNotes": 2-3 sentences of educator-facing guidance
- "toolSuggestions": array of teaching tool names
`;

    const modePromptExtension = converterMode === 'curriculum' ? CURRICULUM_EXTENSION
      : converterMode === 'compliance' ? COMPLIANCE_EXTENSION
      : '';
    const fullPrompt = prompt + modePromptExtension;

    // Call Gemini API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  }
                },
                {
                  text: fullPrompt
                }
              ]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 65536,
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[process] Gemini request timed out after 55s');
        return NextResponse.json(
          { error: 'Processing timed out. The file may be too large — try a smaller PDF or image.' },
          { status: 504 }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeout);
    }

    console.log(`[process] Gemini response status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('[process] Gemini error:', errorBody.substring(0, 500));
      return NextResponse.json(
        { error: 'AI processing failed. Please try again.' },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Extract text from Gemini response
    const candidates = geminiData.candidates || [];
    const rawText = candidates[0]?.content?.parts?.[0]?.text || '';
    const finishReason = candidates[0]?.finishReason || 'unknown';
    
    console.log(`[process] Gemini returned ${rawText ? rawText.length : 0} chars, finishReason: ${finishReason}`);

    // Check for truncated output
    if (finishReason === 'MAX_TOKENS') {
      console.error('[process] Gemini output was truncated (MAX_TOKENS). Response length:', rawText.length);
      return NextResponse.json(
        { error: 'The music file produced too much content. Try uploading fewer pages at a time.' },
        { status: 422 }
      );
    }

    if (!rawText) {
      console.error('[process] No text in Gemini response. Full response:', JSON.stringify(geminiData).substring(0, 500));
      return NextResponse.json(
        { error: 'Could not extract musical content from this file.' },
        { status: 422 }
      );
    }

    // Parse the JSON response from Gemini
    let somResult: Record<string, unknown>;
    try {
      let cleaned = rawText.replace(/^\uFEFF/, '').replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
      if (cleaned.startsWith('[') && !cleaned.startsWith('[{')) {
        cleaned = cleaned;
      }
      somResult = JSON.parse(cleaned);
      if (Array.isArray(somResult)) {
        somResult = somResult[0] as Record<string, unknown>;
      }
      console.log(`[process] Successfully parsed SOM result: ${(somResult as {title?: string}).title || 'untitled'}, ${((somResult as {sections?: unknown[]}).sections || []).length} sections`);
    } catch (parseErr) {
      console.error('[process] JSON parse failed. Error:', parseErr instanceof Error ? parseErr.message : 'unknown');
      console.error('[process] First 200 chars of rawText:', rawText.substring(0, 200));
      console.error('[process] Last 200 chars of rawText:', rawText.substring(rawText.length - 200));
      return NextResponse.json(
        { error: 'AI produced invalid output. Please try again.' },
        { status: 500 }
      );
    }

    // ============================================
    // DETERMINISTIC VALIDATION PASS
    // ============================================
    const validation = validateConversion(somResult);
    
    if (validation.warnings.length > 0) {
      console.warn(`[process] Validation found ${validation.warnings.length} warnings:`);
      for (const w of validation.warnings) {
        console.warn(`  [${w.type}] ${w.message}`);
      }
    }
    
    // Ensure required fields exist with defaults
    if (!somResult.detectedKey && somResult.metadata) {
      const meta = somResult.metadata as {keys?: string[]};
      somResult.detectedKey = meta.keys?.[0] || 'C';
    }
    if (!somResult.homeNumber && somResult.detectedKey) {
      somResult.homeNumber = `${somResult.detectedKey} = 1`;
    }
    if (!somResult.scaleMap) somResult.scaleMap = [];
    if (!somResult.chordTranslations) somResult.chordTranslations = [];
    if (!somResult.assumptions) somResult.assumptions = [];
    if (!somResult.specialCases) somResult.specialCases = [];
    if (!somResult.renderHints) {
      somResult.renderHints = { viewType: 'lead_sheet', lyricAlignment: 'word', editionType: 'quick' };
    }
    if (!somResult.conversionConfidence) {
      somResult.conversionConfidence = { overall: 85, totalChords: 0, resolvedChords: 0, ambiguousCount: 0, reasons: ['Default confidence — model did not return confidence data'] };
    }
    
    if (!somResult.sections) somResult.sections = [];
    if (!somResult.title) somResult.title = 'Untitled';
    if (!somResult.subtitle) somResult.subtitle = 'SOM Teaching Edition';
    if (!somResult.metadata) somResult.metadata = { keys: [], meter: '', tempo: 0, artist: '' };

    // Apply adjusted confidence if validator found issues
    if (validation.fixedConfidence !== undefined) {
      const conf = somResult.conversionConfidence as {overall: number; reasons: string[]};
      const originalConfidence = conf.overall;
      conf.overall = validation.fixedConfidence;
      conf.reasons = [...(conf.reasons || []), `Adjusted from ${originalConfidence} due to ${validation.warnings.length} validation warning(s)`];
    }

    // Return the validated SOM Teaching Edition result
    return NextResponse.json({
      format: 'som-teaching-edition',
      ...somResult,
      _validation: {
        valid: validation.valid,
        warnings: validation.warnings,
        checkedAt: new Date().toISOString(),
      },
      _converterMode: converterMode,
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
