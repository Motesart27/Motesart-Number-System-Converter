/**
 * Motesart Conversion Engine Tests
 *
 * Tests the core conversion logic against known correct outputs.
 */

import { chordToMotesart, getKeyByTonic, convertChordChart, pitchToMotesartNumber, detectKeyFromChords } from '../index';

// ==================== Key Functions ====================

describe('getKeyByTonic', () => {
  test('finds C Major', () => {
    const key = getKeyByTonic('C');
    expect(key).toBeDefined();
    expect(key!.name).toBe('C Major');
    expect(key!.tonicPitch).toBe(0);
  });

  test('finds Bb Major', () => {
    const key = getKeyByTonic('Bb');
    expect(key).toBeDefined();
    expect(key!.name).toBe('Bb Major');
  });

  test('finds Eb Major', () => {
    const key = getKeyByTonic('Eb');
    expect(key).toBeDefined();
    expect(key!.name).toBe('Eb Major');
  });
});

// ==================== Pitch to Number ====================

describe('pitchToMotesartNumber', () => {
  const keyC = getKeyByTonic('C')!;

  test('diatonic notes in C → 1-7', () => {
    expect(pitchToMotesartNumber(0, keyC)).toBe('1');  // C
    expect(pitchToMotesartNumber(2, keyC)).toBe('2');  // D
    expect(pitchToMotesartNumber(4, keyC)).toBe('3');  // E
    expect(pitchToMotesartNumber(5, keyC)).toBe('4');  // F
    expect(pitchToMotesartNumber(7, keyC)).toBe('5');  // G
    expect(pitchToMotesartNumber(9, keyC)).toBe('6');  // A
    expect(pitchToMotesartNumber(11, keyC)).toBe('7'); // B
  });

  test('chromatic notes in C → half-numbers', () => {
    expect(pitchToMotesartNumber(1, keyC)).toBe('1½');  // C#/Db
    expect(pitchToMotesartNumber(3, keyC)).toBe('2½');  // D#/Eb
    expect(pitchToMotesartNumber(6, keyC)).toBe('4½');  // F#/Gb
    expect(pitchToMotesartNumber(8, keyC)).toBe('5½');  // G#/Ab
    expect(pitchToMotesartNumber(10, keyC)).toBe('6½'); // A#/Bb
  });

  test('diatonic notes in G → 1-7', () => {
    const keyG = getKeyByTonic('G')!;
    expect(pitchToMotesartNumber(7, keyG)).toBe('1');   // G
    expect(pitchToMotesartNumber(9, keyG)).toBe('2');   // A
    expect(pitchToMotesartNumber(11, keyG)).toBe('3');  // B
    expect(pitchToMotesartNumber(0, keyG)).toBe('4');   // C
    expect(pitchToMotesartNumber(2, keyG)).toBe('5');   // D
    expect(pitchToMotesartNumber(4, keyG)).toBe('6');   // E
    expect(pitchToMotesartNumber(6, keyG)).toBe('7');   // F#
  });
});

// ==================== Single Chord Conversion ====================

describe('chordToMotesart - Key of C', () => {
  const keyC = getKeyByTonic('C')!;

  test('diatonic major chords → bare numbers', () => {
    expect(chordToMotesart('C', keyC)?.symbol).toBe('1');
    expect(chordToMotesart('F', keyC)?.symbol).toBe('4');
    expect(chordToMotesart('G', keyC)?.symbol).toBe('5');
  });

  test('diatonic minor chords → m suffix', () => {
    expect(chordToMotesart('Dm', keyC)?.symbol).toBe('2m');
    expect(chordToMotesart('Em', keyC)?.symbol).toBe('3m');
    expect(chordToMotesart('Am', keyC)?.symbol).toBe('6m');
  });

  test('diminished → ° suffix', () => {
    expect(chordToMotesart('Bdim', keyC)?.symbol).toBe('7°');
  });

  test('non-diatonic major → M suffix', () => {
    // D major in key of C (degree 2 is naturally minor) → 2M
    expect(chordToMotesart('D', keyC)?.symbol).toBe('2M');
    // E major in key of C (degree 3 is naturally minor) → 3M
    expect(chordToMotesart('E', keyC)?.symbol).toBe('3M');
    // A major in key of C (degree 6 is naturally minor) → 6M
    expect(chordToMotesart('A', keyC)?.symbol).toBe('6M');
  });

  test('seventh chords → superscript 7', () => {
    expect(chordToMotesart('G7', keyC)?.symbol).toBe('5⁷');
    expect(chordToMotesart('Am7', keyC)?.symbol).toBe('6m⁷');
    expect(chordToMotesart('Cmaj7', keyC)?.symbol).toBe('1M⁷');
    expect(chordToMotesart('Dm7', keyC)?.symbol).toBe('2m⁷');
  });

  test('slash chords / inversions → bass/chord format', () => {
    // G/B in key of C: bass=B=7, chord=G=5 → 7/5
    const gb = chordToMotesart('G/B', keyC);
    expect(gb?.symbol).toBe('7/5');
    expect(gb?.isInversion).toBe(true);

    // C/E in key of C: bass=E=3, chord=C=1 → 3/1
    expect(chordToMotesart('C/E', keyC)?.symbol).toBe('3/1');

    // C/G in key of C: bass=G=5, chord=C=1 → 5/1
    expect(chordToMotesart('C/G', keyC)?.symbol).toBe('5/1');

    // Am/G in key of C: bass=G=5, chord=A=6m → 5/6m
    expect(chordToMotesart('Am/G', keyC)?.symbol).toBe('5/6m');
  });

  test('suspended chords', () => {
    expect(chordToMotesart('Csus4', keyC)?.symbol).toBe('1sus4');
    expect(chordToMotesart('Gsus2', keyC)?.symbol).toBe('5sus2');
  });

  test('augmented chords', () => {
    expect(chordToMotesart('Caug', keyC)?.symbol).toBe('1+');
  });

  test('chromatic root → half-number', () => {
    // Bb in key of C → 6½M (chromatic root, major quality)
    expect(chordToMotesart('Bb', keyC)?.symbol).toBe('6½M');
    // Eb in key of C → 2½M
    expect(chordToMotesart('Eb', keyC)?.symbol).toBe('2½M');
  });
});

describe('chordToMotesart - Key of G', () => {
  const keyG = getKeyByTonic('G')!;

  test('diatonic chords in G', () => {
    expect(chordToMotesart('G', keyG)?.symbol).toBe('1');
    expect(chordToMotesart('Am', keyG)?.symbol).toBe('2m');
    expect(chordToMotesart('Bm', keyG)?.symbol).toBe('3m');
    expect(chordToMotesart('C', keyG)?.symbol).toBe('4');
    expect(chordToMotesart('D', keyG)?.symbol).toBe('5');
    expect(chordToMotesart('Em', keyG)?.symbol).toBe('6m');
    expect(chordToMotesart('F#dim', keyG)?.symbol).toBe('7°');
  });
});

describe('chordToMotesart - Key of Eb', () => {
  const keyEb = getKeyByTonic('Eb')!;

  test('diatonic chords in Eb', () => {
    expect(chordToMotesart('Eb', keyEb)?.symbol).toBe('1');
    expect(chordToMotesart('Fm', keyEb)?.symbol).toBe('2m');
    expect(chordToMotesart('Gm', keyEb)?.symbol).toBe('3m');
    expect(chordToMotesart('Ab', keyEb)?.symbol).toBe('4');
    expect(chordToMotesart('Bb', keyEb)?.symbol).toBe('5');
    expect(chordToMotesart('Cm', keyEb)?.symbol).toBe('6m');
  });
});

// ==================== Key Detection ====================

describe('detectKeyFromChords', () => {
  test('detects C from C-Am-F-G', () => {
    const key = detectKeyFromChords(['C', 'A', 'F', 'G']);
    expect(key.tonic).toBe('C');
  });

  test('detects G from G-D-Em-C with F#', () => {
    // Including F# makes G unambiguous (F# is diatonic to G but not C)
    const key = detectKeyFromChords(['G', 'D', 'E', 'C', 'F#']);
    expect(key.tonic).toBe('G');
  });
});

// ==================== Full Chart Conversion ====================

describe('convertChordChart', () => {
  test('converts a simple chord chart', () => {
    const input = `Key: C
[Verse]
G    D    Em    C
Amazing grace how sweet
G    D    G
That saved a wretch like me`;

    const result = convertChordChart(input, { key: 'G' });
    expect(result.key.tonic).toBe('G');
    expect(result.sections.length).toBeGreaterThan(0);

    // Find the first line with chords
    const firstChordLine = result.sections
      .flatMap(s => s.lines)
      .find(l => l.motesartChords && l.motesartChords.length > 0);

    expect(firstChordLine).toBeDefined();
    expect(firstChordLine!.motesartChords![0].symbol).toBe('1');  // G in key of G
    expect(firstChordLine!.motesartChords![1].symbol).toBe('5');  // D in key of G
    expect(firstChordLine!.motesartChords![2].symbol).toBe('6m'); // Em in key of G
    expect(firstChordLine!.motesartChords![3].symbol).toBe('4');  // C in key of G
  });

  test('handles plain chord sequence', () => {
    const input = 'C  Am  F  G';
    const result = convertChordChart(input, { key: 'C' });
    const chords = result.sections.flatMap(s => s.lines).flatMap(l => l.motesartChords || []);

    expect(chords[0].symbol).toBe('1');    // C
    expect(chords[1].symbol).toBe('6m');   // Am
    expect(chords[2].symbol).toBe('4');    // F
    expect(chords[3].symbol).toBe('5');    // G
  });
});
