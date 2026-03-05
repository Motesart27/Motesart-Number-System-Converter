import { NextRequest, NextResponse } from 'next/server';

// Extend serverless function timeout (Netlify supports up to 26s on Pro)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const SOM_CONVERSION_PROMPT = `You are a Motesart Number System (SOM) expert converter. Analyze this sheet music and produce a COMPLETE SOM Teaching Edition conversion.

## THE MOTESART NUMBER SYSTEM RULES
- Numbers 1-7 = major scale degrees: 1(do) 2(re) 3(mi) 4(fa) 5(sol) 6(la) 7(ti)
- Half-numbers for chromatic tones: 1½, 2½, 4½, 5½, 6½ (NEVER 3½ or 7½)
- "1 = C" means C is the tonic: C=1, D=2, E=3, F=4, G=5, A=6, B=7
- Minor chords: marked with "m" (e.g., 6m for Am in key of C)
- Major on non-diatonic degree: marked with "M" (e.g., 2M for D major in key of C)
- Diatonic major chords (1, 4, 5): NO modifier needed
- Diminished: ° (e.g., 7° or 2°)
- Augmented: + (e.g., 5+)
- Extensions: superscript notation 7, 9, 11, 13
- Slash/Inversion chords: bass/chord format. G/B in key of C = 3/5 (bass note first)
- N.C. = No Chord (keep as "N.C.")
- Key changes: start a new section with the new key

## OUTPUT FORMAT
You MUST output valid JSON matching this exact structure. No markdown, no code fences, ONLY the JSON object:

{
  "title": "Song Title",
  "subtitle": "SOM Teaching Edition",
  "metadata": {
    "keys": ["F", "G"],
    "meter": "4/4",
    "tempo": 120,
    "artist": "Artist Name"
  },
  "sections": [
    {
      "name": "SECTION A",
      "key": "F",
      "scaleReference": "1(F) 2(G) 3(A) 4(Bb) 5(C) 6(D) 7(E)",
      "subsections": [
        {
          "name": "Chorus 1",
          "lines": [
            {
              "type": "chords",
              "original": "F Bb C Bb",
              "som": "1 4 5 4",
              "lyrics": "Eh eh eh eh My God is good oh"
            },
            {
              "type": "notes",
              "label": "Instrumental Line",
              "original": "C-C-C C-C-C C-C-C-C D-Bb-D-E",
              "som": "5-5-5 5-5-5 5-5-5-5 6-4-6-7"
            },
            {
              "type": "nc",
              "lyrics": "Some lyric with no chord"
            }
          ]
        }
      ]
    }
  ]
}

## LINE TYPES
- "chords": A chord progression line. Include "original" (letter chords), "som" (number conversion with original in parens), and optionally "lyrics"
- "notes": Individual note sequences (instrumental/melody). Include "label", "original", and "som"
- "nc": No chord section. Just lyrics with N.C. marking
- "break": An instrumental break or transition with optional "label"

## CRITICAL RULES
1. The scaleReference line shows number-to-letter mapping: "1(F) 2(G) 3(A) 4(Bb) 5(C) 6(D) 7(E)"
2. In chord/note lines ("som" field), use NUMBERS ONLY — do NOT repeat the letter names. The scale reference already tells the user what each number means. Example: "1 4 5 4" NOT "1(F) 4(Bb) 5(C) 4(Bb)"
3. For slash chords in som lines: bass/chord — e.g., "3/1" NOT "3/1(F/A)"
4. For quality modifiers: "6m" "2M" "7°" "5+" — numbers only, no letters
5. Detect ALL key changes and create a new section for each key
6. Include the full scale reference (with letters) for each key section
7. Extract title, artist, tempo, meter if visible in the document
8. If info is not in the document, make educated guesses based on the music
9. Handle N.C. (No Chord) sections properly
10. For note sequences use dashes: "5-5-5 5-5-5 5-5-5-5 6-4-6-7"
11. Output ONLY valid JSON. No explanations, no markdown fences.`;

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
    const file = formData.get('file') as File | null;
    const keyOverride = formData.get('key') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type
    let mimeType = file.type || 'application/pdf';
    if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (file.name.endsWith('.png')) mimeType = 'image/png';
    else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mimeType = 'image/jpeg';

    // Build the prompt, optionally including a key override
    let prompt = SOM_CONVERSION_PROMPT;
    if (keyOverride && keyOverride !== 'Auto-detect') {
      prompt += `\n\nIMPORTANT: The user has specified the key as ${keyOverride}. Use this as the primary key unless the music clearly modulates to other keys.`;
    }

    // Send to Gemini Vision API for full SOM conversion
    // Use gemini-2.0-flash — fast, vision-capable, supports JSON output
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`[process] Sending ${(base64Data.length / 1024).toFixed(0)}KB base64 to Gemini 2.0 Flash...`);

    // Use AbortController for a 55-second timeout (leaving headroom for function limit)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let geminiResponse;
    try {
      geminiResponse = await fetch(geminiUrl, {
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
                text: prompt
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        }),
      });
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
      const errorText = await geminiResponse.text();
      console.error('[process] Gemini API error:', errorText.substring(0, 500));
      return NextResponse.json(
        { error: 'Failed to process music file', details: errorText },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = geminiData.candidates?.[0]?.finishReason;

    console.log(`[process] Gemini returned ${rawText ? rawText.length : 0} chars, finishReason: ${finishReason}`);

    // Check for truncated output
    if (finishReason === 'MAX_TOKENS') {
      console.error('[process] Gemini output was truncated (MAX_TOKENS). Response length:', rawText?.length);
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
    let somResult;
    try {
      // Clean potential markdown fences and BOM
      let cleaned = rawText.replace(/^\uFEFF/, '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // Handle case where Gemini wraps in array
      if (cleaned.startsWith('[') && !cleaned.startsWith('[{')) {
        cleaned = cleaned;
      }
      somResult = JSON.parse(cleaned);
      // If Gemini returned an array, take the first element
      if (Array.isArray(somResult)) {
        somResult = somResult[0];
      }
      console.log(`[process] Successfully parsed SOM result: ${somResult.title || 'untitled'}, ${somResult.sections?.length || 0} sections`);
    } catch (parseErr) {
      console.error('[process] JSON parse failed. Error:', parseErr instanceof Error ? parseErr.message : 'unknown');
      console.error('[process] First 200 chars of rawText:', rawText.substring(0, 200));
      console.error('[process] Last 200 chars of rawText:', rawText.substring(rawText.length - 200));
      return NextResponse.json(
        { error: 'AI produced invalid output. Please try again.' },
        { status: 500 }
      );
    }

    // Return the SOM Teaching Edition result with a format flag
    return NextResponse.json({
      format: 'som-teaching-edition',
      ...somResult,
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
