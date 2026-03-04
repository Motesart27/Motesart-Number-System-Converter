/**
 * Motesart Number System - Chord Recognition & Conversion
 *
 * Handles parsing chord symbols (Am7, G/B, Cmaj7, etc.) and converting
 * them to Motesart notation following the methodology rules.
 *
 * KEY RULES:
 * §3 Half-Numbers: Valid: 1½, 2½, 4½, 5½, 6½. Never 3½ or 7½.
 * §6 Chord Quality:
 *   - Minor: always marked with 'm'
 *   - Major: 'M' ONLY if non-diatonic (e.g., major chord built on scale degree 2)
 *   - Diatonic major: no modifier (bare number)
 * §7 Inversions: bass/chord format. G/B in key of C → 3/1
 * §4c Extensions: 7→⁷, 9→⁹, 11→¹¹, 13→¹³ (superscripts)
 * §5 Extensions & Tensions: Written as superscripts showing upper-structure color
 */

import { ParsedChord, MotesartChord, ChordQuality, PitchClass, KeySignature } from './types';
import {
  NOTE_TO_PITCH,
  pitchToMotesartNumber,
  isDiatonic,
  DIATONIC_QUALITIES,
  MAJOR_SCALE_INTERVALS,
} from './keys';

/**
 * Regex to parse a chord symbol into root, quality, extensions, and bass.
 * Examples: "Am7", "G/B", "Cmaj7", "F#m", "Bbdim7", "Dsus4", "Eaug"
 */
const CHORD_REGEX = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/;

/**
 * Parse a raw chord string into its components.
 */
export function parseChordSymbol(chordStr: string): ParsedChord | null {
  const trimmed = chordStr.trim();
  if (!trimmed) return null;

  const match = trimmed.match(CHORD_REGEX);
  if (!match) return null;

  const [, rootName, qualityAndExt, bassName] = match;
  const rootPitch = NOTE_TO_PITCH[rootName];
  if (rootPitch === undefined) return null;

  let remaining = qualityAndExt || '';
  let isMinor = false;
  let isDim = false;
  let isAug = false;
  let isSus2 = false;
  let isSus4 = false;
  let isMaj7 = false;
  let isHalfDim = false;
  const extensions: string[] = [];

  // === Quality detection (order matters!) ===

  // Half-diminished: ø7, ø
  if (/^ø7?/.test(remaining)) {
    isHalfDim = true;
    remaining = remaining.replace(/^ø7?/, '');
    if (!extensions.includes('7')) extensions.push('7');
  }
  // Diminished: dim, °, o (must check before minor 'm')
  else if (/^(dim|°)/.test(remaining)) {
    isDim = true;
    remaining = remaining.replace(/^(dim|°)/, '');
  }
  // Augmented: aug, +
  else if (/^(aug|\+)/.test(remaining)) {
    isAug = true;
    remaining = remaining.replace(/^(aug|\+)/, '');
  }
  // Suspended: sus2, sus4, sus (sus alone = sus4)
  else if (/^sus2/.test(remaining)) {
    isSus2 = true;
    remaining = remaining.replace(/^sus2/, '');
  }
  else if (/^sus4?/.test(remaining)) {
    isSus4 = true;
    remaining = remaining.replace(/^sus4?/, '');
  }
  // Major 7: maj7, Maj7, M7, Δ7 (case-sensitive M to avoid matching lowercase m7)
  else if (/^(maj|Maj|Δ)/.test(remaining) || /^M(?=[79])/.test(remaining)) {
    isMaj7 = true;
    remaining = remaining.replace(/^(maj|Maj|M|Δ)/, '');
  }
  // Minor: m, min, - (must come AFTER maj/Maj checks but works because M is case-sensitive)
  else if (/^(min|m(?!aj)|-)/.test(remaining)) {
    isMinor = true;
    remaining = remaining.replace(/^(min|m|-)/, '');
  }

  // === Extension detection ===
  // Look for 7, 9, 11, 13, add9, add11, add13, 6
  const extPatterns = [
    { pattern: /^add13/, ext: 'add13' },
    { pattern: /^add11/, ext: 'add11' },
    { pattern: /^add9/, ext: 'add9' },
    { pattern: /^13/, ext: '13' },
    { pattern: /^11/, ext: '11' },
    { pattern: /^9/, ext: '9' },
    { pattern: /^7/, ext: '7' },
    { pattern: /^6/, ext: '6' },
  ];

  let safety = 10;
  while (remaining.length > 0 && safety > 0) {
    let matched = false;
    for (const { pattern, ext } of extPatterns) {
      const m = remaining.match(pattern);
      if (m) {
        if (!extensions.includes(ext)) extensions.push(ext);
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Skip unrecognized character
      remaining = remaining.slice(1);
    }
    safety--;
  }

  // Handle implied extensions: 9 implies 7, 11 implies 7+9, 13 implies 7+9+11
  // (We track them but don't force-add - the display handles this)

  const bassPitch = bassName ? NOTE_TO_PITCH[bassName] : undefined;

  return {
    original: trimmed,
    root: rootName,
    rootPitch: rootPitch as PitchClass,
    quality: qualityAndExt || '',
    bass: bassName,
    bassPitch: bassPitch as PitchClass | undefined,
    extensions,
    isMinor,
    isDim,
    isAug,
    isSus2,
    isSus4,
    isMaj7,
    isHalfDim,
  };
}

/**
 * Format extensions as superscript strings for display.
 * §4c: 7→⁷, 9→⁹, 11→¹¹, 13→¹³
 */
function formatExtensions(extensions: string[], isMaj7: boolean): string[] {
  const superscriptMap: Record<string, string> = {
    '6': '⁶',
    '7': '⁷',
    '9': '⁹',
    '11': '¹¹',
    '13': '¹³',
    'add9': 'add⁹',
    'add11': 'add¹¹',
    'add13': 'add¹³',
  };

  return extensions.map(ext => {
    if (ext === '7' && isMaj7) return 'M⁷';
    return superscriptMap[ext] || ext;
  });
}

/**
 * Convert a parsed chord to Motesart notation in a given key.
 *
 * This is the CORE conversion function that applies all Motesart rules.
 */
export function convertChordToMotesart(
  parsed: ParsedChord,
  key: KeySignature
): MotesartChord {
  // Step 1: Convert root note to Motesart number
  const rootNumber = pitchToMotesartNumber(parsed.rootPitch, key);

  // Step 2: Determine Motesart chord quality (§6)
  let quality: ChordQuality = '';

  if (parsed.isHalfDim) {
    quality = 'ø7';
  } else if (parsed.isDim) {
    quality = '°';
  } else if (parsed.isAug) {
    quality = '+';
  } else if (parsed.isSus2) {
    quality = 'sus2';
  } else if (parsed.isSus4) {
    quality = 'sus4';
  } else if (parsed.isMinor) {
    quality = 'm';
  } else {
    // Major chord: check if it's diatonic or non-diatonic
    // §6: Major 'M' ONLY if the chord is major but that's NOT the natural
    // quality at this scale degree
    const rootIsDiatonic = isDiatonic(parsed.rootPitch, key);

    if (rootIsDiatonic) {
      // Find which scale degree this root is
      const semitones = ((parsed.rootPitch - key.tonicPitch) % 12 + 12) % 12;
      const degreeIndex = MAJOR_SCALE_INTERVALS.indexOf(semitones);

      if (degreeIndex !== -1) {
        const degree = degreeIndex + 1;
        const naturalQuality = DIATONIC_QUALITIES[degree];

        if (naturalQuality === 'major') {
          // Naturally major (1, 4, 5) → no modifier
          quality = '';
        } else {
          // Playing a major chord on a naturally minor/dim degree → 'M'
          // e.g., D major in key of C (degree 2, naturally minor) → 2M
          quality = 'M';
        }
      } else {
        quality = '';
      }
    } else {
      // Chromatic root (half-number): major chord on chromatic tone
      // Use 'M' to indicate non-diatonic major
      quality = 'M';
    }
  }

  // Step 3: Format extensions (§4c)
  const formattedExtensions = formatExtensions(parsed.extensions, parsed.isMaj7 ?? false);

  // Step 4: Handle inversions / slash chords (§7)
  // Format: bass/chord (BASS FIRST, CHORD SECOND)
  let bassNumber: string | undefined;
  let isInversion = false;

  if (parsed.bass && parsed.bassPitch !== undefined) {
    bassNumber = pitchToMotesartNumber(parsed.bassPitch, key);
    isInversion = true;
  }

  // Step 5: Build the full Motesart symbol
  let symbol: string;

  if (isInversion && bassNumber) {
    // §7: bass/chord format
    // e.g., G/B in key of C → bass=B=3, chord=G=5 → "3/5"
    const chordPart = rootNumber + quality + formattedExtensions.join('');
    symbol = `${bassNumber}/${chordPart}`;
  } else {
    symbol = rootNumber + quality + formattedExtensions.join('');
  }

  return {
    original: parsed.original,
    symbol,
    rootNumber,
    quality,
    extensions: formattedExtensions,
    bassNumber,
    isInversion,
  };
}

/**
 * Convert a chord string directly to Motesart notation.
 * Convenience function that combines parsing and conversion.
 */
export function chordToMotesart(chordStr: string, key: KeySignature): MotesartChord | null {
  const parsed = parseChordSymbol(chordStr);
  if (!parsed) return null;
  return convertChordToMotesart(parsed, key);
}
