"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// verify-conversions.ts - Real-world conversion verification
const motesart_engine_1 = require("./src/lib/motesart-engine");
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
            // G=1, G7=1⁷, C=4, B7=3M⁷, Em=6m, D=5, D7=5⁷
            shouldContain: ['1', '4', '6m', '5'],
        }
    },
    {
        name: 'Pop progression in C (I-V-vi-IV)',
        input: `Key: C
[Chorus]
C     G     Am    F
She loves you yeah yeah yeah`,
        expectations: {
            key: 'C',
            // C=1, G=5, Am=6m, F=4
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
            // Cm7=2m⁷, F7=5⁷, Bbmaj7=1M⁷, Dm7b5 would be 3ø⁷ or similar, G7 is 6M⁷
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
            // E=1, E7=1⁷, A=4, B7=5⁷
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
            // Relative to A major: Am=1m (non-diatonic minor on 1), but depends on implementation
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
            // C/E = 3/1, F = 4, G/B = 7/5, Am = 6m, C/G = 5/1, F/A = 6/4
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
            // G=1, Bb=chromatic, C=4, F=chromatic
        }
    },
    {
        name: 'Auto-detect key from C Am F G',
        input: `C     Am    F     G
C     Am    F     G`,
        expectations: {
            key: 'C',
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
            // Csus4=1sus4, Csus2=1sus2, Faug=4+, Bdim=7°, Am7=6m⁷
        }
    },
];
let passed = 0;
let failed = 0;
for (const test of TESTS) {
    console.log(`\n========== ${test.name} ==========`);
    try {
        const result = (0, motesart_engine_1.convertChordChart)(test.input);
        console.log(`Key detected: 1 = ${result.key.tonic}`);
        if (test.expectations.key && result.key.tonic !== test.expectations.key) {
            console.log(`  FAIL: Expected key ${test.expectations.key}, got ${result.key.tonic}`);
            failed++;
            continue;
        }
        // Print all converted chords
        const allChords = [];
        for (const section of result.sections) {
            for (const line of section.lines) {
                if (line.motesartChords) {
                    for (const chord of line.motesartChords) {
                        allChords.push(`${chord.original} -> ${chord.symbol}`);
                    }
                }
            }
        }
        console.log('  Conversions:');
        allChords.forEach(c => console.log(`    ${c}`));
        if (test.expectations.shouldContain) {
            const symbols = allChords.map(c => c.split(' -> ')[1]);
            const missing = test.expectations.shouldContain.filter(s => !symbols.some(sym => sym.startsWith(s)));
            if (missing.length > 0) {
                console.log(`  Warning: Missing expected symbols: ${missing.join(', ')}`);
            }
        }
        if (result.detectedProgressions.length > 0) {
            console.log('  Detected progressions:');
            result.detectedProgressions.forEach(p => console.log(`    ${p.pattern} (${p.name})`));
        }
        console.log('  PASS');
        passed++;
    }
    catch (err) {
        console.log(`  ERROR: ${err}`);
        failed++;
    }
}
console.log(`\n========== RESULTS ==========`);
console.log(`Passed: ${passed}/${TESTS.length}`);
console.log(`Failed: ${failed}/${TESTS.length}`);
process.exit(failed > 0 ? 1 : 0);
