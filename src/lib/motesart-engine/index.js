"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectProgressions = exports.convertChordChart = exports.parseChordChart = exports.detectInputFormat = exports.isChordToken = exports.chordToMotesart = exports.convertChordToMotesart = exports.parseChordSymbol = exports.detectKeyFromChords = exports.DIATONIC_QUALITIES = exports.isDiatonic = exports.pitchToMotesartNumber = exports.getKeyByTonic = exports.FLAT_NAMES = exports.SHARP_NAMES = exports.NOTE_TO_PITCH = exports.MAJOR_SCALE_INTERVALS = exports.KEY_SIGNATURES = void 0;
// Key signatures & scale functions
var keys_1 = require("./keys");
Object.defineProperty(exports, "KEY_SIGNATURES", { enumerable: true, get: function () { return keys_1.KEY_SIGNATURES; } });
Object.defineProperty(exports, "MAJOR_SCALE_INTERVALS", { enumerable: true, get: function () { return keys_1.MAJOR_SCALE_INTERVALS; } });
Object.defineProperty(exports, "NOTE_TO_PITCH", { enumerable: true, get: function () { return keys_1.NOTE_TO_PITCH; } });
Object.defineProperty(exports, "SHARP_NAMES", { enumerable: true, get: function () { return keys_1.SHARP_NAMES; } });
Object.defineProperty(exports, "FLAT_NAMES", { enumerable: true, get: function () { return keys_1.FLAT_NAMES; } });
Object.defineProperty(exports, "getKeyByTonic", { enumerable: true, get: function () { return keys_1.getKeyByTonic; } });
Object.defineProperty(exports, "pitchToMotesartNumber", { enumerable: true, get: function () { return keys_1.pitchToMotesartNumber; } });
Object.defineProperty(exports, "isDiatonic", { enumerable: true, get: function () { return keys_1.isDiatonic; } });
Object.defineProperty(exports, "DIATONIC_QUALITIES", { enumerable: true, get: function () { return keys_1.DIATONIC_QUALITIES; } });
Object.defineProperty(exports, "detectKeyFromChords", { enumerable: true, get: function () { return keys_1.detectKeyFromChords; } });
// Chord parsing & conversion
var chords_1 = require("./chords");
Object.defineProperty(exports, "parseChordSymbol", { enumerable: true, get: function () { return chords_1.parseChordSymbol; } });
Object.defineProperty(exports, "convertChordToMotesart", { enumerable: true, get: function () { return chords_1.convertChordToMotesart; } });
Object.defineProperty(exports, "chordToMotesart", { enumerable: true, get: function () { return chords_1.chordToMotesart; } });
// Input parsing & full pipeline
var parser_1 = require("./parser");
Object.defineProperty(exports, "isChordToken", { enumerable: true, get: function () { return parser_1.isChordToken; } });
Object.defineProperty(exports, "detectInputFormat", { enumerable: true, get: function () { return parser_1.detectInputFormat; } });
Object.defineProperty(exports, "parseChordChart", { enumerable: true, get: function () { return parser_1.parseChordChart; } });
Object.defineProperty(exports, "convertChordChart", { enumerable: true, get: function () { return parser_1.convertChordChart; } });
// Progression detection
var progressions_1 = require("./progressions");
Object.defineProperty(exports, "detectProgressions", { enumerable: true, get: function () { return progressions_1.detectProgressions; } });
