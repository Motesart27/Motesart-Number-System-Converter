"use strict";
/**
 * Motesart Number System - Progression Detection
 *
 * Detects common chord progression patterns in converted Motesart chords.
 * Based on the patterns shown on the Learn page.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectProgressions = detectProgressions;
/** Known progression patterns with their names */
const KNOWN_PROGRESSIONS = [
    { pattern: '1-6-4-5', name: 'Pop Progression', description: 'I-vi-IV-V' },
    { pattern: '2-5-1', name: 'Jazz Turnaround', description: 'ii-V-I' },
    { pattern: '1-4-5-1', name: 'Blues/Rock', description: 'I-IV-V-I' },
    { pattern: '6-4-1-5', name: 'Axis Progression', description: 'vi-IV-I-V' },
    { pattern: '1-5-6-4', name: 'Four Chords', description: 'I-V-vi-IV' },
    { pattern: '7-3-6', name: 'Circle of 5ths', description: 'vii-iii-vi' },
    { pattern: '1-4-5', name: 'Three-Chord', description: 'I-IV-V' },
    { pattern: '1-5-6m-4', name: 'Pop Ballad', description: 'I-V-vi-IV' },
    { pattern: '2m-5-1', name: 'Jazz ii-V-I', description: 'ii(m)-V-I' },
    { pattern: '1-6m-4-5', name: 'Doo-Wop', description: 'I-vi-IV-V' },
    { pattern: '4-5-1', name: 'Plagal Cadence Plus', description: 'IV-V-I' },
    { pattern: '1-4', name: 'Plagal Motion', description: 'I-IV' },
    { pattern: '5-1', name: 'Authentic Cadence', description: 'V-I' },
    { pattern: '4-1', name: 'Plagal Cadence', description: 'IV-I' },
    { pattern: '1-2½-4-5', name: 'Blues with b3', description: 'I-bIII-IV-V' },
];
/**
 * Get the "root number only" from a Motesart chord for pattern matching.
 * Strips quality and extensions to just the number.
 */
function getRootForPattern(chord) {
    // For inversions, use the chord root (after the slash)
    let root = chord.rootNumber;
    // Include quality for more specific matching
    if (chord.quality === 'm') {
        return root + 'm';
    }
    return root;
}
/**
 * Get just the bare root number (no quality) for simpler pattern matching.
 */
function getBareRoot(chord) {
    return chord.rootNumber;
}
/**
 * Detect known chord progressions in a sequence of Motesart chords.
 */
function detectProgressions(chords) {
    if (chords.length < 2)
        return [];
    const detected = [];
    const bareRoots = chords.map(c => getBareRoot(c));
    for (const prog of KNOWN_PROGRESSIONS) {
        const patternParts = prog.pattern.split('-');
        const patternLen = patternParts.length;
        // Slide a window across the chord sequence
        for (let i = 0; i <= bareRoots.length - patternLen; i++) {
            const window = bareRoots.slice(i, i + patternLen);
            const windowStr = window.join('-');
            // Check bare root match
            if (windowStr === prog.pattern.replace(/m/g, '')) {
                // Verify quality matches if pattern specifies it
                let qualityMatch = true;
                for (let j = 0; j < patternLen; j++) {
                    const patPart = patternParts[j];
                    if (patPart.includes('m') && chords[i + j].quality !== 'm') {
                        qualityMatch = false;
                        break;
                    }
                }
                if (qualityMatch) {
                    // Avoid duplicates
                    const alreadyDetected = detected.some(d => d.pattern === prog.pattern && d.startMeasure === i);
                    if (!alreadyDetected) {
                        detected.push({
                            pattern: prog.pattern,
                            name: prog.name,
                            startMeasure: i,
                            chords: chords.slice(i, i + patternLen),
                        });
                    }
                }
            }
        }
    }
    return detected;
}
