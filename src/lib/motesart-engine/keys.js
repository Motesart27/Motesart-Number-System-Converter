"use strict";
/**
 * Motesart Number System - Key Signatures & Scale Mappings
 *
 * Core principle: 1 = Your Tonic. Numbers 1-7 represent major scale degrees.
 * The major scale follows W-W-H-W-W-W-H (semitone pattern: 0,2,4,5,7,9,11).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIATONIC_QUALITIES = exports.KEY_SIGNATURES = exports.FLAT_NAMES = exports.SHARP_NAMES = exports.NOTE_TO_PITCH = exports.MAJOR_SCALE_INTERVALS = void 0;
exports.getKeyByTonic = getKeyByTonic;
exports.pitchToMotesartNumber = pitchToMotesartNumber;
exports.isDiatonic = isDiatonic;
exports.detectKeyFromChords = detectKeyFromChords;
/** Semitone intervals of the major scale from root */
exports.MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
/** Map note names to pitch classes (0-11) */
exports.NOTE_TO_PITCH = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4, 'E#': 5,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11, 'B#': 0,
};
/** Sharp note names by pitch class */
exports.SHARP_NAMES = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];
/** Flat note names by pitch class */
exports.FLAT_NAMES = [
    'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];
/**
 * All 12 major key signatures with their scale mappings.
 * This data matches the Airtable Key_Mappings table.
 */
exports.KEY_SIGNATURES = [
    {
        name: 'C Major', tonic: 'C', tonicPitch: 0,
        scalePitches: [0, 2, 4, 5, 7, 9, 11],
        scaleLetters: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        relativeMinor: 'A minor'
    },
    {
        name: 'G Major', tonic: 'G', tonicPitch: 7,
        scalePitches: [7, 9, 11, 0, 2, 4, 6],
        scaleLetters: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
        relativeMinor: 'E minor'
    },
    {
        name: 'D Major', tonic: 'D', tonicPitch: 2,
        scalePitches: [2, 4, 6, 7, 9, 11, 1],
        scaleLetters: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
        relativeMinor: 'B minor'
    },
    {
        name: 'A Major', tonic: 'A', tonicPitch: 9,
        scalePitches: [9, 11, 1, 2, 4, 6, 8],
        scaleLetters: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
        relativeMinor: 'F# minor'
    },
    {
        name: 'E Major', tonic: 'E', tonicPitch: 4,
        scalePitches: [4, 6, 8, 9, 11, 1, 3],
        scaleLetters: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
        relativeMinor: 'C# minor'
    },
    {
        name: 'B Major', tonic: 'B', tonicPitch: 11,
        scalePitches: [11, 1, 3, 4, 6, 8, 10],
        scaleLetters: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
        relativeMinor: 'G# minor'
    },
    {
        name: 'F# Major', tonic: 'F#', tonicPitch: 6,
        scalePitches: [6, 8, 10, 11, 1, 3, 5],
        scaleLetters: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
        relativeMinor: 'D# minor'
    },
    {
        name: 'F Major', tonic: 'F', tonicPitch: 5,
        scalePitches: [5, 7, 9, 10, 0, 2, 4],
        scaleLetters: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
        relativeMinor: 'D minor'
    },
    {
        name: 'Bb Major', tonic: 'Bb', tonicPitch: 10,
        scalePitches: [10, 0, 2, 3, 5, 7, 9],
        scaleLetters: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
        relativeMinor: 'G minor'
    },
    {
        name: 'Eb Major', tonic: 'Eb', tonicPitch: 3,
        scalePitches: [3, 5, 7, 8, 10, 0, 2],
        scaleLetters: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
        relativeMinor: 'C minor'
    },
    {
        name: 'Ab Major', tonic: 'Ab', tonicPitch: 8,
        scalePitches: [8, 10, 0, 1, 3, 5, 7],
        scaleLetters: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
        relativeMinor: 'F minor'
    },
    {
        name: 'Db Major', tonic: 'Db', tonicPitch: 1,
        scalePitches: [1, 3, 5, 6, 8, 10, 0],
        scaleLetters: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
        relativeMinor: 'Bb minor'
    },
];
/**
 * Find a key signature by tonic letter name.
 * Handles enharmonic equivalents (e.g., "Gb" maps to "F#").
 */
function getKeyByTonic(tonic) {
    // Direct match
    const direct = exports.KEY_SIGNATURES.find(k => k.tonic === tonic);
    if (direct)
        return direct;
    // Enharmonic match: find by pitch class
    const pitch = exports.NOTE_TO_PITCH[tonic];
    if (pitch !== undefined) {
        return exports.KEY_SIGNATURES.find(k => k.tonicPitch === pitch);
    }
    return undefined;
}
/**
 * Convert a pitch class to its Motesart number in a given key.
 * Returns the scale degree (1-7) for diatonic pitches,
 * or a half-number (1½, 2½, etc.) for chromatic pitches.
 */
function pitchToMotesartNumber(pitch, key) {
    const semitones = ((pitch - key.tonicPitch) % 12 + 12) % 12;
    // Check diatonic scale degrees
    const degreeIndex = exports.MAJOR_SCALE_INTERVALS.indexOf(semitones);
    if (degreeIndex !== -1) {
        return String(degreeIndex + 1);
    }
    // Chromatic half-numbers
    // Rule: half-numbers always move UP. No 3½ or 7½ (natural half-steps).
    // Semitone 1 = between 1 and 2 → 1½
    // Semitone 3 = between 2 and 3 → 2½
    // Semitone 6 = between 4 and 5 → 4½
    // Semitone 8 = between 5 and 6 → 5½
    // Semitone 10 = between 6 and 7 → 6½
    const halfNumberMap = {
        1: '1½',
        3: '2½',
        6: '4½',
        8: '5½',
        10: '6½',
    };
    return halfNumberMap[semitones] || `?${semitones}`;
}
/**
 * Check if a pitch is diatonic (belongs to the major scale) in the given key.
 */
function isDiatonic(pitch, key) {
    return key.scalePitches.includes(pitch);
}
/**
 * Determine the naturally occurring chord quality at each scale degree.
 * In a major key:
 *   1 = Major, 2 = minor, 3 = minor, 4 = Major,
 *   5 = Major, 6 = minor, 7 = diminished
 */
exports.DIATONIC_QUALITIES = {
    1: 'major',
    2: 'minor',
    3: 'minor',
    4: 'major',
    5: 'major',
    6: 'minor',
    7: 'dim',
};
/**
 * Try to auto-detect the key from a list of chord root names.
 * Uses a scoring system based on how many chords are diatonic to each key.
 */
function detectKeyFromChords(chordRoots) {
    let bestKey = exports.KEY_SIGNATURES[0]; // Default to C Major
    let bestScore = -1;
    for (const key of exports.KEY_SIGNATURES) {
        let score = 0;
        for (const root of chordRoots) {
            const pitch = exports.NOTE_TO_PITCH[root];
            if (pitch !== undefined && isDiatonic(pitch, key)) {
                score++;
            }
        }
        // Slight preference for common keys (C, G, D, F, Bb, Eb)
        const commonKeys = ['C', 'G', 'D', 'F', 'Bb', 'Eb', 'A'];
        if (commonKeys.includes(key.tonic)) {
            score += 0.5;
        }
        if (score > bestScore) {
            bestScore = score;
            bestKey = key;
        }
    }
    return bestKey;
}
