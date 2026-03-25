/**
 * MusicXML ↔ Motesart Number System Converter
 * Deterministic conversion — no AI, pure code.
 * 
 * Supports: single-part melody/lead sheet, one key at a time,
 * chord symbols, note durations, tempo, dynamics preserved.
 */

// ============================================
// KEY SIGNATURE & SCALE MAP
// ============================================

/** MusicXML <fifths> value → tonic note name */
const FIFTHS_TO_TONIC: Record<number, string> = {
  [-7]: 'Cb', [-6]: 'Gb', [-5]: 'Db', [-4]: 'Ab', [-3]: 'Eb', [-2]: 'Bb', [-1]: 'F',
  0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#',
};

/** Chromatic semitone offset from C for each note letter */
const STEP_TO_SEMITONE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** Major scale intervals in semitones from tonic */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

/** Full scale note names for each key (sharps/flats in order of circle of fifths) */
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Get the tonic semitone value for a key string like "G", "Bb", "F#" */
function tonicSemitone(tonic: string): number {
  const letter = tonic[0].toUpperCase();
  const base = STEP_TO_SEMITONE[letter] ?? 0;
  if (tonic.includes('#')) return (base + 1) % 12;
  if (tonic.includes('b')) return (base - 1 + 12) % 12;
  return base;
}

/** Build the 7-note scale map for a given tonic: ["G=1","A=2","B=3",...] */
export function buildScaleMap(tonic: string): string[] {
  const tSemi = tonicSemitone(tonic);
  const useFlats = tonic.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(tonic);
  const names = useFlats ? FLAT_NOTES : SHARP_NOTES;
  return MAJOR_SCALE.map((interval, i) => {
    const noteName = names[(tSemi + interval) % 12];
    return noteName + '=' + (i + 1);
  });
}

// ============================================
// PITCH → SOM DEGREE CONVERSION
// ============================================

/**
 * Convert a MusicXML pitch (step + alter) to a Motesart SOM degree string.
 * Uses the locked Motesart half-number rules:
 *   1½, 2½, 4½, 5½, 6½ allowed
 *   3½ and 7½ are NEVER used (those intervals are natural half-steps)
 * 
 * @param step - Note letter: C, D, E, F, G, A, B
 * @param alter - Chromatic alteration: -1 (flat), 0 (natural), 1 (sharp)
 * @param tonic - Key tonic: "C", "G", "Bb", etc.
 * @returns SOM degree string like "1", "5", "4½", etc.
 */
export function pitchToSomDegree(step: string, alter: number, tonic: string): string {
  const pitchSemi = ((STEP_TO_SEMITONE[step] ?? 0) + alter + 12) % 12;
  const tSemi = tonicSemitone(tonic);
  const interval = ((pitchSemi - tSemi) + 12) % 12;

  // Check exact major scale degrees first
  for (let deg = 0; deg < 7; deg++) {
    if (interval === MAJOR_SCALE[deg]) return String(deg + 1);
  }

  // Check chromatic half-number positions
  // Allowed: 1½(1 semi), 2½(3 semi), 4½(6 semi), 5½(8 semi), 6½(10 semi)
  const halfMap: Record<number, string> = {
    1: '1\u00BD',   // between 1 and 2
    3: '2\u00BD',   // between 2 and 3
    6: '4\u00BD',   // between 4 and 5 (tritone)
    8: '5\u00BD',   // between 5 and 6
    10: '6\u00BD',  // between 6 and 7
  };

  if (halfMap[interval]) return halfMap[interval];

  // Edge cases: intervals that don't have half-numbers (natural half-steps)
  // semitone 5 = between 3 and 4 → just use the nearest degree
  // semitone 11 = between 7 and 1 → just use the nearest degree
  // These are enharmonic edge cases
  if (interval === 5) return '4';  // natural half-step 3→4
  if (interval === 11) return '7'; // natural half-step 7→1

  return '?'; // should never reach here
}

// ============================================
// CHORD SYMBOL → SOM CHORD CONVERSION
// ============================================

/** MusicXML harmony kind → Motesart chord suffix mapping */
const KIND_TO_SOM_SUFFIX: Record<string, string> = {
  'major': '',
  'minor': 'm',
  'dominant': '(7)',
  'major-seventh': 'maj7',
  'minor-seventh': 'm7',
  'diminished': 'dim',
  'diminished-seventh': 'dim7',
  'augmented': '+',
  'half-diminished': 'm7',  // simplified
  'suspended-second': 'sus2',
  'suspended-fourth': 'sus4',
  'dominant-ninth': '(9)',
  'major-minor': 'm',       // simplified
  'major-sixth': '',         // simplified — treated as major
  'minor-sixth': 'm',       // simplified
  'dominant-11th': '(11)',
  'dominant-13th': '(13)',
  'major-ninth': 'maj7',    // simplified
  'minor-ninth': 'm7',      // simplified
};

/**
 * Convert a MusicXML <harmony> root + kind to SOM chord notation.
 * @param rootStep - Root note letter
 * @param rootAlter - Root chromatic alteration
 * @param kind - MusicXML harmony kind string
 * @param tonic - Current key tonic
 * @returns SOM chord string like "1", "5(7)", "2m", "4\u00BD"
 */
export function chordToSom(rootStep: string, rootAlter: number, kind: string, tonic: string): string {
  const degree = pitchToSomDegree(rootStep, rootAlter, tonic);
  const suffix = KIND_TO_SOM_SUFFIX[kind] ?? '';

  // For diatonic major chords (1, 4, 5): no suffix needed per Motesart rules
  // For major chords on non-diatonic degrees: add "M" suffix
  if (suffix === '' && !['1', '4', '5'].includes(degree)) {
    // Check if this degree is naturally major in the scale
    // In major scale: 1, 4, 5 are major; 2, 3, 6 are minor; 7 is diminished
    // A major chord on 2, 3, 6, 7 needs "M" suffix
    if (['2', '3', '6', '7'].includes(degree)) return degree + 'M';
  }

  return degree + suffix;
}

// ============================================
// MUSICXML PARSER & CONVERTER TYPES
// ============================================

export interface ConvertedNote {
  measureNumber: number;
  beat: number;
  originalStep: string;
  originalAlter: number;
  originalOctave: number;
  somDegree: string;
  duration: number;
  type: string; // quarter, eighth, etc.
  isRest: boolean;
}

export interface ConvertedChord {
  measureNumber: number;
  originalRoot: string;
  originalKind: string;
  somNotation: string;
}

export interface ConversionMetadata {
  detected_key: string;
  number_home: string;
  scale_map: string[];
  conversion_mode: 'practice' | 'teaching';
  motesart_concepts_detected: string[];
  tempo_bpm: number;
  measure_count: number;
  total_notes: number;
  total_chords: number;
  conversion_confidence: number;
}

export interface MusicXmlConversionResult {
  outputXml: string;
  metadata: ConversionMetadata;
  notes: ConvertedNote[];
  chords: ConvertedChord[];
  scaleMap: string[];
}


// ============================================
// MAIN CONVERSION ENGINE
// ============================================

/**
 * Parse MusicXML, convert pitches/chords to SOM, serialize back.
 * Uses @xmldom/xmldom for DOM-style round-trip fidelity.
 */
export function convertMusicXml(
  xmlString: string,
  mode: 'practice' | 'teaching' = 'practice',
  overrideKey?: string
): MusicXmlConversionResult {
  // Dynamic import would be ideal but we import at module level in route.ts
  const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // ---- Step 1: Detect key signature ----
  let detectedKey = overrideKey || 'C';
  let tempoBpm = 120; // default
  let measureCount = 0;
  
  // Find first <key> element
  const keyElements = doc.getElementsByTagName('key');
  if (keyElements.length > 0 && !overrideKey) {
    const fifthsEl = keyElements[0].getElementsByTagName('fifths')[0];
    const modeEl = keyElements[0].getElementsByTagName('mode')[0];
    if (fifthsEl) {
      const fifths = parseInt(fifthsEl.textContent || '0', 10);
      const keyMode = modeEl?.textContent || 'major';
      if (keyMode === 'major') {
        detectedKey = FIFTHS_TO_TONIC[fifths] || 'C';
      } else {
        // Minor key — convert to relative major for SOM
        // Minor key fifths: relative major is 3 semitones up
        const minorTonic = FIFTHS_TO_TONIC[fifths] || 'A';
        const minorSemi = tonicSemitone(minorTonic);
        const majorSemi = (minorSemi + 3) % 12;
        // Find the major key name
        const useFlats = minorTonic.includes('b');
        const names = useFlats ? FLAT_NOTES : SHARP_NOTES;
        detectedKey = names[majorSemi] || 'C';
      }
    }
  }
  
  // Find tempo from <sound tempo="...">
  const soundElements = doc.getElementsByTagName('sound');
  for (let i = 0; i < soundElements.length; i++) {
    const tempoAttr = soundElements[i].getAttribute('tempo');
    if (tempoAttr) {
      tempoBpm = parseFloat(tempoAttr);
      break;
    }
  }
  
  const scaleMap = buildScaleMap(detectedKey);
  const convertedNotes: ConvertedNote[] = [];
  const convertedChords: ConvertedChord[] = [];
  
  // ---- Step 2: Walk all measures ----
  const measures = doc.getElementsByTagName('measure');
  measureCount = measures.length;
  
  for (let mi = 0; mi < measures.length; mi++) {
    const measure = measures[mi];
    const measureNum = parseInt(measure.getAttribute('number') || String(mi + 1), 10);
    let currentBeat = 1;
    const divisions = 1; // will be read from attributes
    
    // Read divisions if present in this measure
    const attrs = measure.getElementsByTagName('attributes');
    let localDivisions = 1;
    if (attrs.length > 0) {
      const divEl = attrs[0].getElementsByTagName('divisions')[0];
      if (divEl) localDivisions = parseInt(divEl.textContent || '1', 10);
    }
    
    // Process child elements in order
    const children = measure.childNodes;
    for (let ci = 0; ci < children.length; ci++) {
      const child = children[ci] as Element;
      if (!child.tagName) continue;
      
      // ---- Process <note> elements ----
      if (child.tagName === 'note') {
        const restEl = child.getElementsByTagName('rest')[0];
        const pitchEl = child.getElementsByTagName('pitch')[0];
        const durationEl = child.getElementsByTagName('duration')[0];
        const typeEl = child.getElementsByTagName('type')[0];
        const duration = durationEl ? parseInt(durationEl.textContent || '1', 10) : 1;
        const noteType = typeEl?.textContent || 'quarter';
        
        if (restEl) {
          // Rest — preserve as-is
          convertedNotes.push({
            measureNumber: measureNum, beat: currentBeat,
            originalStep: '', originalAlter: 0, originalOctave: 0,
            somDegree: 'R', duration, type: noteType, isRest: true,
          });
        } else if (pitchEl) {
          const stepEl = pitchEl.getElementsByTagName('step')[0];
          const alterEl = pitchEl.getElementsByTagName('alter')[0];
          const octaveEl = pitchEl.getElementsByTagName('octave')[0];
          
          const step = stepEl?.textContent || 'C';
          const alter = alterEl ? parseInt(alterEl.textContent || '0', 10) : 0;
          const octave = octaveEl ? parseInt(octaveEl.textContent || '4', 10) : 4;
          
          const somDegree = pitchToSomDegree(step, alter, detectedKey);
          
          convertedNotes.push({
            measureNumber: measureNum, beat: currentBeat,
            originalStep: step, originalAlter: alter, originalOctave: octave,
            somDegree, duration, type: noteType, isRest: false,
          });
          
          // ---- Add SOM annotation to the note ----
          // Add as a <lyric> element with number="2" (preserving existing lyrics)
          const existingLyrics = child.getElementsByTagName('lyric');
          const lyricNum = existingLyrics.length + 1;
          
          const lyricEl = doc.createElement('lyric');
          lyricEl.setAttribute('number', String(lyricNum));
          lyricEl.setAttribute('name', 'motesart-som');
          
          const syllabicEl = doc.createElement('syllabic');
          syllabicEl.textContent = 'single';
          lyricEl.appendChild(syllabicEl);
          
          const textEl = doc.createElement('text');
          textEl.textContent = somDegree;
          lyricEl.appendChild(textEl);
          
          child.appendChild(lyricEl);
        }
        
        // Advance beat position
        currentBeat += duration / (localDivisions || 1);
      }
      
      // ---- Process <harmony> elements (chord symbols) ----
      if (child.tagName === 'harmony') {
        const rootEl = child.getElementsByTagName('root')[0];
        const kindEl = child.getElementsByTagName('kind')[0];
        
        if (rootEl && kindEl) {
          const rootStepEl = rootEl.getElementsByTagName('root-step')[0];
          const rootAlterEl = rootEl.getElementsByTagName('root-alter')[0];
          
          const rootStep = rootStepEl?.textContent || 'C';
          const rootAlter = rootAlterEl ? parseInt(rootAlterEl.textContent || '0', 10) : 0;
          const kind = kindEl.getAttribute('text') || kindEl.textContent || 'major';
          
          const somChord = chordToSom(rootStep, rootAlter, kind, detectedKey);
          
          convertedChords.push({
            measureNumber: measureNum,
            originalRoot: rootStep + (rootAlter > 0 ? '#' : rootAlter < 0 ? 'b' : ''),
            originalKind: kind, somNotation: somChord,
          });
          
          // Add SOM chord annotation
          // Create a parallel <harmony> element or annotation
          const footnoteEl = doc.createElement('footnote');
          footnoteEl.textContent = '';
          
          // Add Motesart annotation as a <kind> text attribute modification
          // We preserve the original and add the SOM notation
          kindEl.setAttribute('motesart-som', somChord);
          
          // Also add a readable annotation
          const levelEl = doc.createElement('level');
          levelEl.setAttribute('reference', 'no');
          levelEl.textContent = somChord;
          child.appendChild(levelEl);
        }
      }
    }
  }

  // ---- Step 3: Detect concepts exercised ----
  const conceptsDetected: string[] = [];
  
  // Check for scale patterns
  const uniqueDegrees = new Set(convertedNotes.filter(n => !n.isRest).map(n => n.somDegree));
  if (uniqueDegrees.size >= 5) conceptsDetected.push('T_MAJOR_SCALE_PATTERN');
  if (uniqueDegrees.has('1') && uniqueDegrees.has('3') && uniqueDegrees.has('5')) {
    conceptsDetected.push('T_MAJOR_3RD');
  }
  if (uniqueDegrees.size >= 3) conceptsDetected.push('T_SCALE_DEGREES_MAJOR');
  
  // Check for half-steps and whole-steps in note sequences
  const nonRestNotes = convertedNotes.filter(n => !n.isRest);
  let hasHalfStep = false;
  let hasWholeStep = false;
  for (let i = 1; i < nonRestNotes.length; i++) {
    const prev = nonRestNotes[i - 1];
    const curr = nonRestNotes[i];
    const prevSemi = (STEP_TO_SEMITONE[prev.originalStep] ?? 0) + prev.originalAlter;
    const currSemi = (STEP_TO_SEMITONE[curr.originalStep] ?? 0) + curr.originalAlter;
    const interval = Math.abs(currSemi - prevSemi);
    if (interval === 1) hasHalfStep = true;
    if (interval === 2) hasWholeStep = true;
  }
  if (hasHalfStep) conceptsDetected.push('T_HALF_STEP');
  if (hasWholeStep) conceptsDetected.push('T_WHOLE_STEP');
  
  // ---- Step 4: Inject metadata into XML ----
  const identification = doc.getElementsByTagName('identification')[0];
  if (identification) {
    // Add Motesart metadata as <miscellaneous> entries
    let misc = identification.getElementsByTagName('miscellaneous')[0];
    if (!misc) {
      misc = doc.createElement('miscellaneous');
      identification.appendChild(misc);
    }
    
    const addMiscField = (name: string, value: string) => {
      const field = doc.createElement('miscellaneous-field');
      field.setAttribute('name', 'motesart-' + name);
      field.textContent = value;
      misc.appendChild(field);
    };
    
    addMiscField('detected-key', detectedKey);
    addMiscField('number-home', detectedKey + ' = 1');
    addMiscField('scale-map', scaleMap.join(', '));
    addMiscField('conversion-mode', mode);
    addMiscField('concepts-detected', conceptsDetected.join(', '));
    addMiscField('tempo-bpm', String(tempoBpm));
    addMiscField('measure-count', String(measureCount));
    addMiscField('converter-version', '1.0.0');
  } else {
    // Create <identification> block if it doesn't exist
    const scoreEl = doc.getElementsByTagName('score-partwise')[0] || doc.getElementsByTagName('score-timewise')[0];
    if (scoreEl) {
      const newIdent = doc.createElement('identification');
      const misc = doc.createElement('miscellaneous');
      
      const addMiscField = (name: string, value: string) => {
        const field = doc.createElement('miscellaneous-field');
        field.setAttribute('name', 'motesart-' + name);
        field.textContent = value;
        misc.appendChild(field);
      };
      
      addMiscField('detected-key', detectedKey);
      addMiscField('number-home', detectedKey + ' = 1');
      addMiscField('scale-map', scaleMap.join(', '));
      addMiscField('conversion-mode', mode);
      addMiscField('concepts-detected', conceptsDetected.join(', '));
      addMiscField('tempo-bpm', String(tempoBpm));
      addMiscField('measure-count', String(measureCount));
      addMiscField('converter-version', '1.0.0');
      
      newIdent.appendChild(misc);
      // Insert after <work> or <movement-title> if they exist, otherwise as first child
      const firstPart = scoreEl.getElementsByTagName('part-list')[0];
      if (firstPart) {
        scoreEl.insertBefore(newIdent, firstPart);
      } else {
        scoreEl.appendChild(newIdent);
      }
    }
  }
  
  // ---- Step 5: Serialize back to XML ----
  const serializer = new XMLSerializer();
  let outputXml = serializer.serializeToString(doc);
  
  // Ensure XML declaration is present
  if (!outputXml.startsWith('<?xml')) {
    outputXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + outputXml;
  }
  
  const metadata: ConversionMetadata = {
    detected_key: detectedKey,
    number_home: detectedKey + ' = 1',
    scale_map: scaleMap,
    conversion_mode: mode,
    motesart_concepts_detected: conceptsDetected,
    tempo_bpm: tempoBpm,
    measure_count: measureCount,
    total_notes: convertedNotes.filter(n => !n.isRest).length,
    total_chords: convertedChords.length,
    conversion_confidence: 100, // deterministic = 100%
  };
  
  return { outputXml, metadata, notes: convertedNotes, chords: convertedChords, scaleMap };
}
