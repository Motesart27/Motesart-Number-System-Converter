"use strict";
/**
 * Motesart Number System - Input Parser
 *
 * Parses various chord chart formats:
 * 1. Chords-over-lyrics (standard chord charts)
 * 2. Inline chords [G] [D] [Em]
 * 3. Plain chord sequences: G - D - Em - C
 * 4. Metadata extraction (key, tempo, time signature, title)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChordToken = isChordToken;
exports.detectInputFormat = detectInputFormat;
exports.parseChordChart = parseChordChart;
exports.convertChordChart = convertChordChart;
const keys_1 = require("./keys");
const chords_1 = require("./chords");
const progressions_1 = require("./progressions");
/** Regex to match a chord token (e.g., Am7, G/B, Cmaj7, etc.) */
const CHORD_TOKEN_REGEX = /^[A-G][#b]?(?:m(?:aj|in)?|M(?:aj)?|dim|aug|°|ø|\+|sus[24]?)?(?:7|9|11|13|6|add[0-9]+)?(?:\/[A-G][#b]?)?$/;
/** Section header patterns */
const SECTION_PATTERNS = [
    /^\[?(Intro|Verse|Pre[\s-]?Chorus|Chorus|Bridge|Interlude|Refrain|Outro|Tag|Vamp|Coda|Ending|Instrumental|Solo|Turnaround)\s*(\d*)\]?\s*:?\s*$/i,
    /^\*\*?(Intro|Verse|Pre[\s-]?Chorus|Chorus|Bridge|Interlude|Refrain|Outro|Tag|Vamp|Coda)\s*(\d*)\*?\*?\s*:?\s*$/i,
];
/**
 * Check if a string looks like a chord.
 */
function isChordToken(token) {
    return CHORD_TOKEN_REGEX.test(token.trim());
}
/**
 * Check if a line is primarily chords (>50% of tokens are chords).
 */
function isChordLine(line) {
    const tokens = line.trim().split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0)
        return false;
    // Filter out common non-chord tokens like "|", "-", "(", ")"
    const meaningfulTokens = tokens.filter(t => !/^[|\-–—()[\]{},.:;x]+$/.test(t));
    if (meaningfulTokens.length === 0)
        return false;
    const chordCount = meaningfulTokens.filter(t => isChordToken(t)).length;
    return chordCount / meaningfulTokens.length > 0.5;
}
/**
 * Check if a line is a section header.
 */
function isSectionHeader(line) {
    const trimmed = line.trim();
    for (const pattern of SECTION_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) {
            const name = match[1];
            const num = match[2] || '';
            return `${name}${num ? ' ' + num : ''}`;
        }
    }
    return null;
}
/**
 * Extract metadata from the chord chart text.
 */
function extractMetadata(text) {
    const meta = {};
    // Key detection
    const keyMatch = text.match(/Key\s*[:=]\s*([A-G][#b]?)\s*(Major|Minor|m)?/i);
    if (keyMatch) {
        meta.key = keyMatch[1];
    }
    // Tempo detection
    const tempoMatch = text.match(/(?:Tempo|BPM)\s*[:=]\s*(\d+)/i);
    if (tempoMatch) {
        meta.tempo = parseInt(tempoMatch[1], 10);
    }
    // Time signature detection
    const timeMatch = text.match(/(?:Time|Time Sig(?:nature)?)\s*[:=]\s*(\d+\/\d+)/i);
    if (timeMatch) {
        meta.timeSignature = timeMatch[1];
    }
    // Title detection
    const titleMatch = text.match(/(?:Title|Song)\s*[:=]\s*(.+)/i);
    if (titleMatch) {
        meta.title = titleMatch[1].trim();
    }
    return meta;
}
/**
 * Extract chord names from a chord line.
 */
function extractChords(line) {
    return line
        .trim()
        .split(/[\s|]+/)
        .filter(t => t.length > 0 && !/^[|\-–—()[\]{},.:;x]+$/.test(t))
        .filter(t => isChordToken(t));
}
/**
 * Detect the input format of the text.
 */
function detectInputFormat(text) {
    // Check for inline chords like [G] or [Am7]
    if (/\[[A-G][#b]?[^\]]*\]/.test(text)) {
        return 'inline-chords';
    }
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    // Check for chords-over-lyrics pattern (alternating chord/lyric lines)
    let hasChordLines = false;
    let hasLyricLines = false;
    for (const line of lines) {
        if (isChordLine(line))
            hasChordLines = true;
        else if (!isSectionHeader(line) && line.trim().length > 0)
            hasLyricLines = true;
    }
    if (hasChordLines && hasLyricLines)
        return 'chords-over-lyrics';
    if (hasChordLines)
        return 'plain-sequence';
    return 'unknown';
}
/**
 * Parse inline chords format: "Amazing [G]grace how [D]sweet the [G]sound"
 */
function parseInlineChords(text) {
    const lines = text.split('\n');
    const result = [];
    for (const line of lines) {
        if (line.trim().length === 0) {
            result.push({ type: 'empty' });
            continue;
        }
        const chordMatches = [...line.matchAll(/\[([A-G][#b]?[^\]]*)\]/g)];
        if (chordMatches.length > 0) {
            const chords = chordMatches.map(m => m[1]);
            const lyrics = line.replace(/\[[^\]]*\]/g, '').trim();
            result.push({
                type: 'chords-over-lyrics',
                chords,
                lyrics: lyrics || undefined,
            });
        }
        else {
            result.push({ type: 'lyrics', lyrics: line });
        }
    }
    return result;
}
/**
 * Parse the main chord chart text into sections and lines.
 */
function parseChordChart(text) {
    const metadata = extractMetadata(text);
    const format = detectInputFormat(text);
    const allChordRoots = [];
    // Handle inline chords
    if (format === 'inline-chords') {
        const lines = parseInlineChords(text);
        for (const line of lines) {
            if (line.chords) {
                for (const c of line.chords) {
                    const parsed = (0, chords_1.parseChordSymbol)(c);
                    if (parsed)
                        allChordRoots.push(parsed.root);
                }
            }
        }
        return {
            sections: [{ name: 'Song', lines }],
            chordRoots: allChordRoots,
            metadata,
        };
    }
    // Parse line by line
    const rawLines = text.split('\n');
    const sections = [];
    let currentSection = { name: 'Intro', lines: [] };
    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        const trimmed = line.trim();
        // Empty line
        if (trimmed.length === 0) {
            currentSection.lines.push({ type: 'empty' });
            continue;
        }
        // Section header
        const sectionName = isSectionHeader(trimmed);
        if (sectionName) {
            if (currentSection.lines.length > 0) {
                sections.push(currentSection);
            }
            currentSection = { name: sectionName, lines: [] };
            continue;
        }
        // Skip metadata lines
        if (/^(Key|Tempo|BPM|Time|Title|Song)\s*[:=]/i.test(trimmed)) {
            continue;
        }
        // Check if this is a chord line
        if (isChordLine(trimmed)) {
            const chords = extractChords(trimmed);
            for (const c of chords) {
                const parsed = (0, chords_1.parseChordSymbol)(c);
                if (parsed)
                    allChordRoots.push(parsed.root);
            }
            // Check if next line is lyrics (chords-over-lyrics pattern)
            const nextLine = i + 1 < rawLines.length ? rawLines[i + 1] : '';
            const nextTrimmed = nextLine.trim();
            if (nextTrimmed.length > 0 && !isChordLine(nextTrimmed) && !isSectionHeader(nextTrimmed)) {
                // Chords-over-lyrics pair
                currentSection.lines.push({
                    type: 'chords-over-lyrics',
                    chords,
                    lyrics: nextTrimmed,
                });
                i++; // Skip the lyrics line
            }
            else {
                // Chord-only line
                currentSection.lines.push({
                    type: 'chords',
                    chords,
                });
            }
        }
        else {
            // Lyrics-only line
            currentSection.lines.push({
                type: 'lyrics',
                lyrics: trimmed,
            });
        }
    }
    // Push last section
    if (currentSection.lines.length > 0) {
        sections.push(currentSection);
    }
    // If no sections were created, wrap everything in a default section
    if (sections.length === 0) {
        sections.push({ name: 'Song', lines: [] });
    }
    return {
        sections,
        chordRoots: allChordRoots,
        metadata,
    };
}
/**
 * Full conversion pipeline: parse text → detect key → convert all chords → detect progressions.
 */
function convertChordChart(text, options) {
    // Step 1: Parse the input
    const { sections, chordRoots, metadata } = parseChordChart(text);
    // Step 2: Determine the key
    let key;
    if (options?.key) {
        key = (0, keys_1.getKeyByTonic)(options.key) || (0, keys_1.detectKeyFromChords)(chordRoots);
    }
    else if (metadata.key) {
        key = (0, keys_1.getKeyByTonic)(metadata.key) || (0, keys_1.detectKeyFromChords)(chordRoots);
    }
    else {
        key = (0, keys_1.detectKeyFromChords)(chordRoots);
    }
    // Step 3: Convert all chords in every section
    const allMotesartChords = [];
    for (const section of sections) {
        for (const line of section.lines) {
            if (line.chords && line.chords.length > 0) {
                line.motesartChords = line.chords
                    .map(c => (0, chords_1.chordToMotesart)(c, key))
                    .filter((c) => c !== null);
                allMotesartChords.push(...line.motesartChords);
            }
        }
    }
    // Step 4: Detect progressions
    const detectedProgressions = (0, progressions_1.detectProgressions)(allMotesartChords);
    // Step 5: Build result
    return {
        key,
        timeSignature: options?.timeSignature || metadata.timeSignature || '4/4',
        tempo: metadata.tempo,
        title: metadata.title,
        sections,
        detectedProgressions,
        rawInput: text,
        convertedAt: new Date().toISOString(),
    };
}
