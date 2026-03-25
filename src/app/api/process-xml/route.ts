import { NextRequest, NextResponse } from 'next/server';
import { convertMusicXml } from '@/lib/musicxml-converter';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/process-xml
 * 
 * Deterministic MusicXML → Motesart Number System converter.
 * No AI — pure code conversion using locked SOM syntax.
 * 
 * Input: MusicXML file (.xml, .musicxml)
 * Output: Converted MusicXML + metadata
 * 
 * Form fields:
 *   file: MusicXML file
 *   mode: 'practice' | 'teaching' (default: 'practice')
 *   key: optional key override (e.g., 'G', 'Bb')
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isXml = fileName.endsWith('.xml') || fileName.endsWith('.musicxml') || fileName.endsWith('.mxl');
    if (!isXml && file.type !== 'text/xml' && file.type !== 'application/xml') {
      return NextResponse.json(
        { error: 'File must be a MusicXML file (.xml or .musicxml)' },
        { status: 400 }
      );
    }

    // File size check (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum 10MB for MusicXML files.' },
        { status: 413 }
      );
    }

    // Read file content
    const xmlString = await file.text();
    
    // Basic MusicXML validation
    if (!xmlString.includes('<score-partwise') && !xmlString.includes('<score-timewise')) {
      return NextResponse.json(
        { error: 'Invalid MusicXML file. Expected <score-partwise> or <score-timewise> root element.' },
        { status: 422 }
      );
    }

    // Parse mode and optional key override
    const mode = (formData.get('mode') as string) === 'teaching' ? 'teaching' : 'practice';
    const keyOverride = formData.get('key') as string | null;
    const overrideKey = keyOverride && keyOverride !== 'Auto-detect' ? keyOverride : undefined;

    console.log(`[process-xml] Converting: ${file.name}, size: ${file.size}, mode: ${mode}, keyOverride: ${overrideKey || 'auto'}`);

    // Run deterministic conversion
    const result = convertMusicXml(xmlString, mode, overrideKey);

    console.log(`[process-xml] Conversion complete: key=${result.metadata.detected_key}, notes=${result.metadata.total_notes}, chords=${result.metadata.total_chords}, measures=${result.metadata.measure_count}`);

    // Return both the converted XML and metadata
    return NextResponse.json({
      format: 'musicxml-som',
      outputXml: result.outputXml,
      metadata: result.metadata,
      notes: result.notes,
      chords: result.chords,
      scaleMap: result.scaleMap,
      _converterMode: mode,
    });
  } catch (error) {
    console.error('[process-xml] Error:', error);
    
    // Provide specific error messages for common issues
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('xmldom') || message.includes('parse')) {
      return NextResponse.json(
        { error: 'Failed to parse MusicXML. The file may be malformed or use an unsupported format.' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Conversion failed: ' + message },
      { status: 500 }
    );
  }
}
