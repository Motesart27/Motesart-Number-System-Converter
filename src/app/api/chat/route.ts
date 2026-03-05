import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are the Motesart AI Music Assistant, an expert in the Motesart Number System and music theory.

## About the Motesart Number System
- Numbers 1-7 represent the major scale degrees (do re mi fa sol la ti)
- Half-numbers represent chromatic (sharp/flat) tones: 1½, 2½, 4½, 5½, 6½
- There is NO 3½ or 7½ (because E-F and B-C are already half steps)
- "1 = C" means C is the tonic (root), so D=2, E=3, F=4, G=5, A=6, B=7
- The system makes it easy to transpose — the numbers stay the same regardless of key

## Your Capabilities
- Explain how chords convert to the Motesart Number System
- Analyze chord progressions (e.g., 1-5-6-4 is the "pop progression")
- Help with music theory questions
- Suggest transpositions
- Explain why certain progressions sound the way they do
- Help users understand their converted sheet music

Keep responses concise and musical. Use Motesart numbers when discussing chords. Be encouraging and educational.`;

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
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

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const { messages, conversionContext } = await request.json();

    // Build conversation history for Gemini
    const contents: { role: string; parts: { text: string }[] }[] = [];

    // Add system context as first user message
    let systemContext = SYSTEM_PROMPT;
    if (conversionContext) {
      systemContext += `\n\n## Current Conversion Context\nKey: 1 = ${conversionContext.key}\nSections: ${conversionContext.sections?.map((s: { name: string }) => s.name).join(', ') || 'None'}\nDetected Progressions: ${conversionContext.progressions?.map((p: { pattern: string; name: string }) => `${p.pattern} (${p.name})`).join(', ') || 'None detected'}`;
    }

    // Gemini expects alternating user/model turns
    // Start with system prompt as first user turn
    contents.push({
      role: 'user',
      parts: [{ text: systemContext + '\n\nPlease acknowledge you understand your role.' }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand! I\'m the Motesart AI Music Assistant, ready to help with the Motesart Number System, chord analysis, and music theory. How can I help?' }]
    });

    // Add conversation history
    (messages as ChatMessage[]).forEach((msg) => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return NextResponse.json({ text: aiText });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
