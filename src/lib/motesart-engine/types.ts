/**
 * Motesart Number System - Core Types
 */

/** All 12 chromatic pitch classes (0-11 semitones from C) */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Scale degree numbers 1-7 */
export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Valid half-numbers (chromatic tones between diatonic degrees) */
export type HalfNumber = '1½' | '2½' | '4½' | '5½' | '6½';

/** A Motesart number can be a diatonic degree or chromatic half-number */
export type MotesartNumber = string; // '1'-'7' or half-numbers

/** Chord quality in Motesart notation */
export type ChordQuality =
  | ''       // diatonic major (no modifier)
  | 'm'      // minor
  | 'M'      // non-diatonic major
  | '°'      // diminished
  | '+'      // augmented (using + not ⁺ for simplicity, rendered as superscript in UI)
  | 'ø7'     // half-diminished 7th
  | 'sus2'   // suspended 2nd
  | 'sus4';  // suspended 4th

/** Extension types */
export type Extension = '7' | '9' | '11' | '13' | 'add9' | 'add11' | 'add13';

/** A key signature */
export interface KeySignature {
  name: string;          // e.g., "C Major", "G Major"
  tonic: string;         // e.g., "C", "G", "Bb"
  tonicPitch: PitchClass;
  scalePitches: PitchClass[]; // 7 pitch classes of the major scale
  scaleLetters: string[];     // e.g., ["C", "D", "E", "F", "G", "A", "B"]
  relativeMinor: string;      // e.g., "A minor"
}

/** Parsed chord from text input */
export interface ParsedChord {
  original: string;         // Original chord string, e.g., "Am7/G"
  root: string;             // Root note letter, e.g., "A"
  rootPitch: PitchClass;    // Root pitch class
  quality: string;          // Raw quality string from input, e.g., "m7"
  bass?: string;            // Bass note letter if slash chord, e.g., "G"
  bassPitch?: PitchClass;   // Bass pitch class
  extensions: string[];     // Raw extensions, e.g., ["7"]
  isSus2?: boolean;
  isSus4?: boolean;
  isDim?: boolean;
  isAug?: boolean;
  isMinor?: boolean;
  isMaj7?: boolean;         // Major 7th (Δ7, maj7, M7)
  isHalfDim?: boolean;      // ø7
}

/** Converted Motesart chord */
export interface MotesartChord {
  original: string;           // Original chord string
  symbol: string;             // Full Motesart symbol, e.g., "2m7" or "3/1"
  rootNumber: MotesartNumber; // Root as Motesart number
  quality: ChordQuality;      // Motesart quality
  extensions: string[];       // Formatted extensions with superscripts
  bassNumber?: MotesartNumber; // Bass note as Motesart number (for inversions)
  isInversion: boolean;       // Whether this is a slash/inversion chord
  progressionTag?: string;    // e.g., "2-5-1", "1-5-6-4"
}

/** A section in a chord chart (e.g., Verse, Chorus) */
export interface ChordChartSection {
  name: string;               // e.g., "Verse 1", "Chorus"
  lines: ChordChartLine[];
}

/** A line in a chord chart section */
export interface ChordChartLine {
  type: 'chords' | 'lyrics' | 'chords-over-lyrics' | 'empty';
  chords?: string[];          // Raw chord strings
  lyrics?: string;            // Lyrics text
  motesartChords?: MotesartChord[]; // Converted chords
}

/** Full conversion result */
export interface ConversionResult {
  key: KeySignature;
  timeSignature: string;
  tempo?: number;
  title?: string;
  sections: ChordChartSection[];
  detectedProgressions: DetectedProgression[];
  rawInput: string;
  convertedAt: string;        // ISO timestamp
}

/** Detected chord progression pattern */
export interface DetectedProgression {
  pattern: string;            // e.g., "2-5-1"
  name: string;               // e.g., "Jazz Turnaround"
  startMeasure?: number;
  chords: MotesartChord[];
}

/** Input format types */
export type InputFormat =
  | 'chords-over-lyrics'  // Standard chord chart with chords above lyrics
  | 'inline-chords'       // [G] [D] [Em] style
  | 'plain-sequence'      // G - D - Em - C
  | 'unknown';
