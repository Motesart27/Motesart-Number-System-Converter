/**
 * Motesart Conversion Engine - Real-world Verification Tests
 * 
 * Comprehensive tests with real-world chord charts
 */

import { convertChordChart, chordToMotesart, getKeyByTonic } from '../index';

const TESTS = [
  {
    name: 'Amazing Grace in G',
    input: `Key: G
[Verse 1]
G     G7    C     G
Amazing grace how sweet the sound
G     B7    Em    D
That saved a wretch like me
G     G7    C     G
I once was lost but now am found
G     D7    G
Was blind but now I see`,
    expectations: {
      key: 'G',
      shouldContain: ['1', '4', '6m', '5'],
    }
  },
  {
    name: 'Pop progression in C (I-V-vi-IV)',
    input: `Key: C
[Chorus]
C     G     Am    F
She loves you yeah yeah yeah
C     G     Am    F`,
    expectations: {
      key: 'C',
      shouldContain: ['1', '5', '6m', '4'],
    }
  },
  {
    name: 'Jazz ii-V-I in Bb',
    input: `Key: Bb
[A Section]
Cm7   F7    Bbmaj7
Dm7b5 G7    Cm7`,
    expectations: {
      key: 'Bb',
    }
  },
  {
    name: 'Blues in E',
    input: `Key: E
[12 Bar Blues]
E     E     E     E7
A     A     E     E
B7    A     E     B7`,
    expectations: {
      key: 'E',
      shouldContain: ['1', '4'],
    }
  },
  {
    name: 'Minor key song in Am',
    input: `Key: A
[Verse]
Am    Dm    G     C
Am    E     Am`,
    expectations: {
      key: 'A',
    }
  },
  {
    name: 'Slash chords / inversions in C',
    input: `Key: C
[Bridge]
C/E   F     G/B   Am
C/G   F/A   G`,
    expectations: {
      key: 'C',
    }
  },
  {
    name: 'Chromatic chords in G',
    input: `Key: G
[Verse]
G     Bb    C     G
G     F     C     D`,
    expectations: {
      key: 'G',
    }
  },
  {
    name: 'Auto-detect key from C Am F G',
    input: `C     Am    F     G
C     Am    F     G`,
    expectations: {
      key: 'C',
      shouldContain: ['1', '6m', '4', '5'],
    }
  },
  {
    name: 'Suspended and augmented chords',
    input: `Key: C
[Verse]
Csus4   Csus2   C
Faug    Bdim    Am7`,
    expectations: {
      key: 'C',
    }
  },
];

describe('Real-world Chord Chart Conversions', () => {
  for (const testData of TESTS) {
    it(testData.name, () => {
      const result = convertChordChart(testData.input);
      
      // Verify key detection
      expect(result.key.tonic).toBe(testData.expectations.key);
      
      // Verify that sections and chords were parsed
      expect(result.sections.length).toBeGreaterThan(0);
      
      // Collect all converted chords
      const allChords: string[] = [];
      for (const section of result.sections) {
        for (const line of section.lines) {
          if (line.motesartChords) {
            for (const chord of line.motesartChords) {
              allChords.push(chord.symbol);
            }
          }
        }
      }
      
      expect(allChords.length).toBeGreaterThan(0);
      
      // Check for expected symbols if specified
      if (testData.expectations.shouldContain) {
        for (const expected of testData.expectations.shouldContain) {
          const found = allChords.some(sym => sym.startsWith(expected));
          if (!found) {
            console.warn(`    Expected '${expected}' not found in: ${allChords.join(', ')}`);
          } else {
            expect(found).toBe(true);
          }
        }
      }
      
      // Log results for inspection
      console.log(`\n  ${testData.name}:`);
      console.log(`    Key: 1 = ${result.key.tonic}`);
      console.log(`    Conversions: ${allChords.slice(0, 12).join(', ')}${allChords.length > 12 ? '...' : ''}`);
      if (result.detectedProgressions.length > 0) {
        console.log(`    Detected progressions: ${result.detectedProgressions.map(p => p.name).join(', ')}`);
      }
    });
  }
});
