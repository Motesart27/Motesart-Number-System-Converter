import { NextRequest, NextResponse } from 'next/server';
import { convertChordChart } from '@/lib/motesart-engine';

const EXTRACTION_PROMPT = `You are an expert music transcriber. Analyze this sheet music image/document and extract the chord chart in a simple text format.

Rules:
1. Identify the KEY of the piece (e.g., "Key: G" or "Key: C")
2. Identify sections like [Verse], [Chorus], [Bridge], [Intro], [Outro], etc.
3. For each section, list the chords on one line and lyrics (if visible) on the next line
4. Use standard chord notation: C, Am, G7, Dm, F#m, Bb, etc.
5. Separate chords with spaces
6. If you can't read certain parts, make your best guess based on context

Output format example:
Key: G

[Verse]
G     D     Em    C
Amazing grace how sweet the sound
G     D     G
That saved a wretch like me

[Chorus]
C     G     D     G
I once was lost but now am found

If the document contains only notes (no chords), try to identify the key and any chord patterns implied by the notes. If it's a full orchestral score, focus on the harmony/chord changes.

If you cannot extract any musical content, respond with exactly: NO_MUSIC_FOUND

Important: Output ONLY the chord chart text, nothing else. No explanations or commentary.`;

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

    // Send to Gemini Vision API for extraction
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
              text: EXTRACTION_PROMPT
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini extraction error:', errorText);
      return NextResponse.json(
        { error: 'Failed to extract music from file', details: errorText },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText || extractedText.trim() === 'NO_MUSIC_FOUND') {
      return NextResponse.json(
        { error: 'Could not extract musical content from this file. Try uploading a clearer image or a different format.' },
        { status: 422 }
      );
    }

    // Now convert the extracted chord chart using the Motesart engine
    const options: { key?: string } = {};
    if (keyOverride && keyOverride !== 'Auto-detect') {
      options.key = keyOverride;
    }

    const conversionResult = convertChordChart(extractedText, options);

    return NextResponse.json({
      extractedText,
      ...conversionResult,
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
