/**
 * Motesart Number System - Conversion Engine
 *
 * Main entry point. Re-exports all public APIs.
 *
 * Usage:
 *   import { convertChordChart, chordToMotesart, getKeyByTonic } from '@/lib/motesart-engine';
 *
 *   // Full chord chart conversion
 *   const result = convertChordChart(inputText, { key: 'G' });
 *
 *   // Single chord conversion
 *   const key = getKeyByTonic('C');
 *   const motesart = chordToMotesart('Am7', key);
 *   // → { symbol: '6m⁷', rootNumber: '6', quality: 'm', ... }
 */

// Types
export type {
  PitchClass,
  ScaleDegree,
  HalfNumber,
  MotesartNumber,
  ChordQuality,
  Extension,
  KeySignature,
  ParsedChord,
  MotesartChord,
  ChordChartSection,
  ChordChartLine,
  ConversionResult,
  DetectedProgression,
  InputFormat,
} from './types';

// Key signatures & scale functions
export {
  KEY_SIGNATURES,
  MAJOR_SCALE_INTERVALS,
  NOTE_TO_PITCH,
  SHARP_NAMES,
  FLAT_NAMES,
  getKeyByTonic,
  pitchToMotesartNumber,
  isDiatonic,
  DIATONIC_QUALITIES,
  detectKeyFromChords,
} from './keys';

// Chord parsing & conversion
export {
  parseChordSymbol,
  convertChordToMotesart,
  chordToMotesart,
} from './chords';

// Input parsing & full pipeline
export {
  isChordToken,
  detectInputFormat,
  parseChordChart,
  convertChordChart,
} from './parser';

// Progression detection
export { detectProgressions } from './progressions';
