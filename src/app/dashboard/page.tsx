'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  RefreshCw,
  Settings,
  Music,
  MessageCircle,
  Download,
  File,
  Trash2,
  Send,
  FileText,
  Wand2,
  Edit3,
  BookOpen,
  Info,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

// Transition animation styles
const fadeInStyles = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.som-fade-in { animation: fadeInUp 0.5s ease-out forwards; }
.som-fade-in-delay { animation: fadeInUp 0.5s ease-out 0.15s forwards; opacity: 0; }
.som-fade-in-delay-2 { animation: fadeInUp 0.5s ease-out 0.3s forwards; opacity: 0; }
`;


/* ââ Old engine types (for manual text conversion) ââ */
interface MotesartChordResult {
  symbol: string;
  original: string;
  rootNumber: string;
  quality: string;
}
interface ChartLine {
  type: 'chords' | 'lyrics' | 'empty';
  motesartChords?: MotesartChordResult[];
  lyrics?: string;
}
interface ChartSection {
  name: string;
  lines: ChartLine[];
}
interface OldConversionResult {
  format?: undefined;
  key: { tonic: string; mode: string };
  sections: ChartSection[];
  detectedProgressions: { pattern: string; name: string }[];
}

/* ââ NEW SOM Teaching Edition types (from Gemini) ââ */
interface SomLine {
  type: 'chords' | 'notes' | 'nc' | 'break';
  original?: string;
  som?: string;
  lyrics?: string;
  label?: string;
}
interface SomSubsection {
  name: string;
  lines: SomLine[];
}
interface SomSection {
  name: string;
  key: string;
  scaleReference: string;
  subsections: SomSubsection[];
}
interface ChordTranslation {
  original: string;
  converted: string;
  reason: string;
  confidence: number;
  specialCase?: boolean;
}

interface ConversionConfidence {
  overall: number;
  totalChords: number;
  resolvedChords: number;
  ambiguousCount: number;
  reasons: string[];
}

interface RenderHints {
  viewType: 'lead_sheet' | 'hymn' | 'plain_text';
  lyricAlignment: 'word' | 'syllable';
  editionType: 'quick' | 'curriculum' | 'compliance';
}

interface ValidationResult {
  valid: boolean;
  warnings: Array<{ type: string; message: string; chord?: string }>;
  checkedAt: string;
}

interface SomTeachingEdition {
  format: 'som-teaching-edition';
  title: string;
  subtitle: string;
  metadata: {
    keys: string[];
    meter: string;
    tempo: number;
    artist: string;
  };
  detectedKey?: string;
  homeNumber?: string;
  scaleMap?: string[];
  chordTranslations?: ChordTranslation[];
  conversionConfidence?: ConversionConfidence;
  specialCases?: string[];
  assumptions?: string[];
  renderHints?: RenderHints;
  _validation?: ValidationResult;
  sections: SomSection[];
  conceptsExercised?: string[];
  suggestedPhase?: string;
  teachingNotes?: string;
  toolSuggestions?: string[];
  gradeBandAlignment?: string;
  standardsEvidence?: string;
  complianceNotes?: string;
  _converterMode?: string;
}

type ActiveResult = OldConversionResult | SomTeachingEdition;

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploaded' | 'processing' | 'converted' | 'error';
  key?: string;
  result?: ActiveResult;
  timestamp: Date;
  file?: File;
  errorMessage?: string;
}

function isSomTeachingEdition(r: ActiveResult): r is SomTeachingEdition {
  return r && (r as SomTeachingEdition).format === 'som-teaching-edition';
}

/* ââ SOM Legend Card ââ */
function SomLegendCard() {
  const [expanded, setExpanded] = useState(false);
  return (
      <><style dangerouslySetInnerHTML={{ __html: fadeInStyles }} />
    <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#f97316]" />
          <h2 className="text-sm font-semibold text-[#e2e8f0]">SOM Quick Guide</h2>
        </div>
        <span className="text-xs text-[#64748b]">{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 text-xs">
          <div>
            <p className="text-[#94a3b8] font-semibold mb-1">Scale Degrees</p>
            <div className="flex flex-wrap gap-2 font-mono">
              {[
                { n: '1', c: '#06b6d4', l: 'do' },
                { n: '2', c: '#6366f1', l: 're' },
                { n: '3', c: '#a855f7', l: 'mi' },
                { n: '4', c: '#06b6d4', l: 'fa' },
                { n: '5', c: '#6366f1', l: 'sol' },
                { n: '6', c: '#a855f7', l: 'la' },
                { n: '7', c: '#ec4899', l: 'ti' },
              ].map(d => (
                <span key={d.n} className="px-2 py-1 bg-[#1e293b] rounded">
                  <span style={{ color: d.c, fontWeight: 700 }}>{d.n}</span>
                  <span className="text-[#64748b] ml-1">= {d.l}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[#94a3b8] font-semibold mb-1">Chromatic Half-Numbers</p>
            <p className="font-mono text-[#f97316]">1½ &nbsp; 2½ &nbsp; 4½ &nbsp; 5½ &nbsp; 6½</p>
            <p className="text-[#64748b] mt-0.5">No 3½ or 7½ (E-F and B-C are natural half steps)</p>
          </div>

          <div>
            <p className="text-[#94a3b8] font-semibold mb-1">Chord Symbols</p>
            <div className="space-y-1 text-[#94a3b8]">
              <p><span className="font-mono text-white">1, 4, 5</span> = diatonic major (no modifier)</p>
              <p><span className="font-mono text-white">m</span> = minor <span className="text-[#64748b]">(e.g., 6m = Am in C)</span></p>
              <p><span className="font-mono text-white">M</span> = non-diatonic major <span className="text-[#64748b]">(e.g., 2M = D major in C)</span></p>
              <p><span className="font-mono text-white">Â°</span> = diminished &nbsp; <span className="font-mono text-white">+</span> = augmented</p>
            </div>
          </div>

          <div>
            <p className="text-[#94a3b8] font-semibold mb-1">Slash Chords</p>
            <p className="text-[#94a3b8]"><span className="font-mono text-white">bass/chord</span> format &mdash; bass note first</p>
            <p className="text-[#64748b]">e.g., G/B in key of C = 3/5</p>
          </div>

          <div>
            <p className="text-[#94a3b8] font-semibold mb-1">Reading Format</p>
            <p className="text-[#94a3b8]"><span className="font-mono text-white">1(F)</span> means scale degree 1 = the note F</p>
            <p className="text-[#64748b]">Numbers stay the same in any key &mdash; only the notes in parentheses change!</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ââ SOM Teaching Edition Renderer ââ */
function SomTeachingEditionView({ data, converterMode, setConverterMode }: { data: SomTeachingEdition; converterMode: 'quick' | 'curriculum' | 'compliance'; setConverterMode: (m: 'quick' | 'curriculum' | 'compliance') => void }) {
  const [viewMode, setViewMode] = useState<'original' | 'numbers' | 'side-by-side'>('side-by-side');

  const [showExplanation, setShowExplanation] = useState(false);

  /* Helper: render a single section's lines */
  const renderLines = (lines: SomLine[], showOriginal: boolean, showSom: boolean) => (
    <div className="space-y-1.5">
      {lines.map((line, li) => {
        if (line.type === 'chords') {
          return (
            <div key={li} className="som-fade-in px-3 py-1.5">
              {showOriginal && line.original && (
                <pre className="font-mono font-bold text-sm text-[#f97316] whitespace-pre leading-snug m-0">{line.original}</pre>
              )}
              {showSom && (line.som || line.original) && (
                <pre className="font-mono font-bold text-sm text-[#06b6d4] whitespace-pre leading-snug m-0">{line.som || line.original}</pre>
              )}
              {line.lyrics && (
                <pre className="font-mono text-sm text-[#94a3b8] whitespace-pre leading-snug m-0">{line.lyrics}</pre>
              )}
            </div>
          );
        } else if (line.type === 'notes') {
          return (
            <div key={li} className="bg-[#1e1338]/40 border-l-2 border-[#a855f7] px-3 py-1.5 rounded-r">
              {line.label && <p className="text-[10px] font-semibold text-[#7c3aed] uppercase tracking-wider">{line.label}</p>}
              {showOriginal && line.original && <p className="font-mono text-xs text-[#f97316]">{line.original}</p>}
              {showSom && line.som && <p className="font-mono text-sm font-bold text-[#06b6d4]">{line.som}</p>}
            </div>
          );
        } else if (line.type === 'nc') {
          return (
            <div key={li} className="px-3 py-1">
              <span className="font-mono text-xs text-[#64748b]">N.C.</span>
              {line.lyrics && <pre className="font-mono text-sm text-[#94a3b8] whitespace-pre m-0">{line.lyrics}</pre>}
            </div>
          );
        }
        return null;
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* MODE TABS */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(['quick', 'curriculum', 'compliance'] as const).map(mode => (
            <button key={mode} onClick={() => setConverterMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${converterMode === mode
                ? 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white/[0.03] text-[#475569] border border-white/[0.06] hover:bg-white/[0.06]'}`}>
              {mode === 'quick' ? 'Quick Convert' : mode === 'curriculum' ? 'Curriculum Convert' : 'Compliance Convert'}
            </button>
          ))}
        </div>
        {/* VIEW TOGGLE */}
        <div className="flex gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
          {(['original', 'numbers', 'side-by-side'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${viewMode === v
                ? 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white'
                : 'text-[#64748b] hover:text-white'}`}>
              {v === 'side-by-side' ? 'Side-by-Side' : v === 'original' ? 'Original' : 'Numbers'}
            </button>
          ))}
        </div>
      </div>

      {/* TITLE BAR */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#06b6d4]/10 flex items-center justify-center">
          <Music className="w-5 h-5 text-[#06b6d4]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{data.title}</h2>
          <p className="text-[11px] text-[#64748b]">SOM Teaching Edition</p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex gap-3">
        {/* LEFT/MAIN: CONVERSION PANELS */}
        <div className="flex-1 min-w-0">
          {viewMode === 'side-by-side' ? (
            /* SIDE-BY-SIDE */
            <div className="flex gap-2">
              {/* Original */}
              <div className="flex-1 bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#f97316]" />
                  <span className="text-xs font-semibold text-[#f97316]">Original Chords</span>
                </div>
                <div className="p-3">
                  {(data.sections || []).map((sec, si) => (
                    <div key={si} className="mb-4">
                      <p className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest mb-2">{sec.name} — Key: {sec.key}</p>
                      {(sec.subsections || []).map((sub, ssi) => (
                        <div key={ssi} className="mb-2">
                          <p className="text-xs font-bold text-[#334155] mb-1">{sub.name}</p>
                          {renderLines((sub.lines || []), true, false)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Arrow */}
              <div className="flex items-center justify-center w-8 shrink-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/30">→</div>
              </div>
              {/* Numbers */}
              <div className="flex-1 bg-[#111827] border border-[#06b6d4]/15 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                <div className="px-3 py-2 bg-[#06b6d4]/5 border-b border-[#06b6d4]/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#06b6d4]" />
                  <span className="text-xs font-semibold text-[#06b6d4]">Motesart Number System</span>
                </div>
                <div className="p-3">
                  {(data.sections || []).map((sec, si) => (
                    <div key={si} className="mb-4">
                      <p className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest mb-2">{sec.name} — Key: 1 = {sec.key}</p>
                      {(sec.subsections || []).map((sub, ssi) => (
                        <div key={ssi} className="mb-2">
                          <p className="text-xs font-bold text-[#334155] mb-1">{sub.name}</p>
                          {renderLines((sub.lines || []), false, true)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE VIEW: Original or Numbers */
            <div className="bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className={`px-3 py-2 border-b flex items-center gap-2 ${viewMode === 'original' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#06b6d4]/5 border-[#06b6d4]/10'}`}>
                <div className={`w-2 h-2 rounded-full ${viewMode === 'original' ? 'bg-[#f97316]' : 'bg-[#06b6d4]'}`} />
                <span className={`text-xs font-semibold ${viewMode === 'original' ? 'text-[#f97316]' : 'text-[#06b6d4]'}`}>
                  {viewMode === 'original' ? 'Original Chords' : 'Motesart Number System'}
                </span>
              </div>
              <div className="p-3">
                {(data.sections || []).map((sec, si) => (
                  <div key={si} className="mb-4">
                    <p className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest mb-2">
                      {sec.name} — {viewMode === 'original' ? 'Key: ' + sec.key : 'Key: 1 = ' + sec.key}
                    </p>
                    <p className="font-mono text-[11px] text-[#475569] mb-2">{sec.scaleReference || ''}</p>
                    {(sec.subsections || []).map((sub, ssi) => (
                      <div key={ssi} className="mb-3">
                        <p className="text-xs font-bold text-[#1e293b] mb-1">{sub.name}</p>
                        {renderLines((sub.lines || []), viewMode === 'original', viewMode === 'numbers')}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: CONVERSION SUMMARY */}
        <div className="w-[240px] shrink-0 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
          <p className="text-xs font-bold text-white">Conversion Summary</p>

          {/* Key Detected */}
          <div className="bg-[#6366f1]/8 border border-[#6366f1]/15 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider mb-1">Key Detected</p>
            <p className="text-lg font-extrabold text-white">{data.detectedKey || data.metadata?.keys?.[0] || 'Unknown'} Major</p>
            <p className="text-[10px] text-[#64748b] mt-0.5">{(data.metadata?.keys?.length || 0) > 1 ? 'Key changes: ' + (data.metadata?.keys || []).join(' → ') : 'No key changes'}</p>
          </div>

          {/* Number System Home + Scale Map */}
          <div className="bg-[#06b6d4]/8 border border-[#06b6d4]/15 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-[#06b6d4] uppercase tracking-wider mb-1">Number Home</p>
            <p className="text-base font-extrabold text-white">{data.homeNumber || ((data.detectedKey || data.metadata?.keys?.[0] || 'C') + ' = 1')}</p>
            {data.scaleMap && data.scaleMap.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-1">
                {(data.scaleMap || []).map((m: string, i: number) => (
                  <span key={i} className="text-[9px] font-mono bg-white/[0.06] px-1 py-0.5 rounded text-center text-[#94a3b8]">{m}</span>
                ))}
              </div>
            )}
          </div>

          {/* Chord Translations */}
          {data.chordTranslations && data.chordTranslations.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
              <p className="text-[10px] font-semibold text-[#f97316] uppercase tracking-wider mb-2">Chord Translations</p>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {(data.chordTranslations || []).map((ct: ChordTranslation, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono font-semibold text-[#f97316] min-w-[28px]">{ct.original}</span>
                    <span className="text-[#475569] text-[10px]">→</span>
                    <span className={"font-mono font-bold min-w-[28px] " + (ct.specialCase ? "text-[#eab308]" : "text-[#06b6d4]")}>{ct.converted}</span>
                    {ct.specialCase && <span className="text-[8px] text-[#eab308]">⚠</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversion Confidence */}
          {data.conversionConfidence != null && (
            <div className="bg-[#22c55e]/8 border border-[#22c55e]/15 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-[#22c55e] uppercase tracking-wider mb-1">Conversion Confidence</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#22c55e]">{data.conversionConfidence?.overall ?? 0}%</span>
                <span className="text-[10px] text-[#64748b]">{(data.conversionConfidence?.overall ?? 0) >= 95 ? 'High Accuracy' : (data.conversionConfidence?.overall ?? 0) >= 80 ? 'Good' : 'Review Needed'}</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#06b6d4]" style={{ width: (data.conversionConfidence?.overall ?? 0) + '%' }} />
              </div>
              {data.conversionConfidence?.ambiguousCount != null && data.conversionConfidence.ambiguousCount > 0 && (
                <p className="text-[9px] text-[#eab308] mt-1.5">{data.conversionConfidence.ambiguousCount} ambiguous chord{data.conversionConfidence.ambiguousCount > 1 ? 's' : ''} detected</p>
              )}
              {data.conversionConfidence?.totalChords != null && (
                <p className="text-[9px] text-[#64748b] mt-0.5">{data.conversionConfidence.resolvedChords ?? data.conversionConfidence.totalChords}/{data.conversionConfidence.totalChords} chords resolved</p>
              )}
            </div>
          )}

          {/* Special Cases / Warnings */}
          {data.specialCases && data.specialCases.length > 0 && (
            <div className="bg-[#eab308]/8 border border-[#eab308]/15 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-[#eab308] uppercase tracking-wider mb-2">Special Cases</p>
              <div className="space-y-1.5">
                {(data.specialCases || []).map((sc: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[#eab308] text-[10px] mt-0.5">⚠</span>
                    <p className="text-[10px] text-[#94a3b8] leading-tight">{sc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions */}
          {data.assumptions && data.assumptions.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Assumptions Made</p>
              <div className="space-y-1">
                {(data.assumptions || []).map((a: string, i: number) => (
                  <p key={i} className="text-[10px] text-[#475569] leading-tight">• {a}</p>
                ))}
              </div>
            </div>
          )}

          {/* Validation Status */}
          {data._validation && (
            <div className={"border rounded-lg p-2 " + (data._validation.valid ? "bg-[#22c55e]/5 border-[#22c55e]/15" : "bg-[#ef4444]/5 border-[#ef4444]/15")}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{data._validation.valid ? '✅' : '⚠️'}</span>
                <p className={"text-[9px] font-semibold " + (data._validation.valid ? "text-[#22c55e]" : "text-[#ef4444]")}>{data._validation.valid ? 'All checks passed' : data._validation.warnings.length + ' warning(s)'}</p>
              </div>
            </div>
          )}
        </div>
    </div>
      {/* HOW WE CONVERTED THIS — Collapsible Drawer */}
      <div className="mt-4">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.05] transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🔍</span>
            <span className="text-xs font-semibold text-white">How we converted this</span>
          </div>
          <span className={"text-[#64748b] text-xs transition-transform " + (showExplanation ? "rotate-180" : "")}>▼</span>
        </button>
        {showExplanation && (
          <div className="mt-2 bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-4">
            {/* Detected Key & Scale */}
            <div>
              <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider mb-2">Key Detection</p>
              <p className="text-xs text-[#94a3b8]">Detected key: <span className="font-bold text-white">{data.detectedKey || data.metadata?.keys?.[0] || 'Unknown'}</span></p>
              {data.homeNumber && <p className="text-xs text-[#94a3b8] mt-1">Home number: <span className="font-bold text-[#06b6d4]">{data.homeNumber}</span></p>}
              {data.scaleMap && data.scaleMap.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-[#64748b] mb-1">Scale degree map:</p>
                  <div className="flex gap-2 flex-wrap">
                    {(data.scaleMap || []).map((m: string, i: number) => (
                      <span key={i} className="font-mono text-xs bg-[#6366f1]/10 text-[#a5b4fc] px-2 py-0.5 rounded">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Each Chord Mapping */}
            {data.chordTranslations && data.chordTranslations.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#f97316] uppercase tracking-wider mb-2">Chord-by-Chord Mapping</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {(data.chordTranslations || []).map((ct: ChordTranslation, i: number) => (
                    <div key={i} className={"flex items-center gap-2 text-xs px-2 py-1.5 rounded " + (ct.specialCase ? "bg-[#eab308]/8 border border-[#eab308]/15" : "bg-white/[0.02]")}>
                      <span className="font-mono font-bold text-[#f97316] w-[36px]">{ct.original}</span>
                      <span className="text-[#475569]">→</span>
                      <span className="font-mono font-bold text-[#06b6d4] w-[36px]">{ct.converted}</span>
                      <span className="text-[10px] text-[#64748b] flex-1 truncate">{ct.reason}</span>
                      {ct.specialCase && <span className="text-[9px] text-[#eab308]">⚠</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assumptions */}
            {data.assumptions && data.assumptions.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Assumptions & Simplifications</p>
                <div className="space-y-1">
                  {(data.assumptions || []).map((a: string, i: number) => (
                    <p key={i} className="text-[10px] text-[#94a3b8] leading-relaxed">• {a}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Details */}
            {data._validation && !data._validation.valid && (
              <div>
                <p className="text-[10px] font-semibold text-[#ef4444] uppercase tracking-wider mb-2">Validation Warnings</p>
                <div className="space-y-1">
                  {(data._validation?.warnings || []).map((w: {type: string; message: string}, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px]">
                      <span className="text-[#ef4444] mt-0.5">⚠</span>
                      <span className="text-[#94a3b8]">{w.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Reasons */}
            {data.conversionConfidence?.reasons && data.conversionConfidence.reasons.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#22c55e] uppercase tracking-wider mb-2">Confidence Factors</p>
                <div className="space-y-1">
                  {(data.conversionConfidence?.reasons || []).map((r: string, i: number) => (
                    <p key={i} className="text-[10px] text-[#94a3b8]">• {r}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ââ Old-format result renderer (for manual text conversion) ââ */
function OldResultView({ result, originalPreview }: { result: OldConversionResult; originalPreview: boolean }) {
  return (
    <div className="space-y-4">
      {(result.sections || []).map((section, si) => (
        <div key={si}>
          <h3 className="text-xs font-bold text-[#06b6d4] mb-2 uppercase tracking-wider">
            {section.name}
          </h3>
          <div className="space-y-2">
            {(section.lines || []).map((line, li) => {
              if (line.type === 'empty') return <div key={li} className="h-2" />;
              return (
                <div key={li} className="space-y-0.5">
                  {line.motesartChords && line.motesartChords.length > 0 && (
                    <div className="flex flex-wrap gap-4 px-2 py-1.5 bg-[#1e293b]/30 rounded">
                      {line.motesartChords.map((chord, ci) => {
                        const numberMatch = chord.symbol.match(/^(\d½?)/);
                        const num = numberMatch?.[1] || '';
                        const rest = chord.symbol.slice(num.length);
                        const isHalf = num.includes('½');
                        const baseNum = parseInt(num[0]) || 1;
                        const colors: Record<number, string> = {
                          1: '#06b6d4', 2: '#6366f1', 3: '#a855f7',
                          4: '#06b6d4', 5: '#6366f1', 6: '#a855f7', 7: '#ec4899',
                        };
                        const color = isHalf ? '#f97316' : (colors[baseNum] || '#06b6d4');
                        return (
                          <div key={ci} className="flex flex-col items-center">
                            <span className="font-mono text-lg">
                              <span style={{ color, fontWeight: 700 }}>{num}</span>
                              <span className="text-[#94a3b8]">{rest}</span>
                            </span>
                            {originalPreview && (
                              <span className="text-[10px] text-[#475569] font-mono">{chord.original}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {line.lyrics && <p className="text-sm text-[#94a3b8] pl-2">{line.lyrics}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {result.detectedProgressions?.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#1e293b]">
          <h3 className="text-sm font-bold text-white mb-2">Detected Progressions</h3>
          <div className="flex flex-wrap gap-2">
            {result.detectedProgressions.map((prog, pi) => (
              <span key={pi} className="text-xs px-3 py-1.5 bg-[#6366f1]/20 text-[#818cf8] rounded-full">
                {prog.pattern} ({prog.name})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   MAIN DASHBOARD
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
export default function Dashboard() {
  const [originalPreview, setOriginalPreview] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string; text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [manualInput, setManualInput] = useState('');
  const [selectedKey, setSelectedKey] = useState('Auto-detect');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeResult, setActiveResult] = useState<any>(null);
  const [activeFileName, setActiveFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [converterMode, setConverterMode] = useState<'quick' | 'curriculum' | 'compliance'>('quick');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) addFiles(Array.from(files));
  };

  const addFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'uploaded' as const,
      timestamp: new Date(),
      file: f,
    }));
    setUploadedFiles(prev => [...newFiles, ...prev]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) addFiles(Array.from(files));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /* ââ Convert / Process ââ */
  const handleConvert = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (mode === 'manual') {
        if (!manualInput.trim()) { setIsProcessing(false); return; }
        const options: Record<string, string> = {};
        if (selectedKey !== 'Auto-detect') options.key = selectedKey;

        const res = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: manualInput, ...options }),
        });
        const result = await res.json();
        if (res.ok) {
          setActiveResult(result);
          setActiveFileName('Manual Entry');
          fetch('/api/conversions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputText: manualInput,
              outputJson: result,
              keyUsed: result.key?.tonic || 'C',
              timeSignature: '4/4',
            }),
          }).catch(() => {});
        }
      } else {
        const fileToProcess = uploadedFiles.find(f => f.file && f.status === 'uploaded');
        if (!fileToProcess || !fileToProcess.file) { setIsProcessing(false); return; }

        setUploadedFiles(prev => prev.map(f =>
          f.name === fileToProcess.name ? { ...f, status: 'processing' as const } : f
        ));

        const formData = new FormData();
        formData.append('file', fileToProcess.file);
      formData.append('mode', converterMode);
        if (selectedKey !== 'Auto-detect') formData.append('key', selectedKey);

        // Use AbortController for 65-second client-side timeout
        const controller = new AbortController();
        const clientTimeout = setTimeout(() => controller.abort(), 65000);

        try {
          const res = await fetch('/api/process', { method: 'POST', body: formData, signal: controller.signal });
          clearTimeout(clientTimeout);
          let result;
          try {
            result = await res.json();
          } catch {
            throw new Error('Server returned an invalid response — the file may be too large or processing timed out.');
          }

          if (res.ok) {
            setActiveResult(result);
            setActiveFileName(fileToProcess.name);
            const keyStr = result.format === 'som-teaching-edition'
              ? result.metadata?.keys?.[0]
              : result.key?.tonic;
            setUploadedFiles(prev => prev.map(f =>
              f.name === fileToProcess.name
                ? { ...f, status: 'converted' as const, key: keyStr, result }
                : f
            ));
          } else {
            setUploadedFiles(prev => prev.map(f =>
              f.name === fileToProcess.name
                ? { ...f, status: 'error' as const, errorMessage: result.error || 'Processing failed' }
                : f
            ));
          }
        } catch (fetchErr) {
          clearTimeout(clientTimeout);
          const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
          setUploadedFiles(prev => prev.map(f =>
            f.name === fileToProcess.name
              ? { ...f, status: 'error' as const, errorMessage: isTimeout ? 'Processing timed out â try again or use a smaller file' : (fetchErr instanceof Error ? fetchErr.message : 'Processing failed â please try again') }
              : f
          ));
        }
      }
    } catch (err) {
      console.error('Conversion error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [mode, manualInput, selectedKey, uploadedFiles, converterMode]);

  /* ââ Build plain-text content for CSV/TEXT exports ââ */
  const buildTextContent = (): string => {
    if (!activeResult) return '';
    let content = '';
    if (isSomTeachingEdition(activeResult)) {
      const d = activeResult;
      content += `${d.title} â ${d.subtitle}\n`;
      content += `Keys: ${d.metadata.keys.join(' â ')}  Meter: ${d.metadata.meter}  Tempo: ${d.metadata.tempo}  Artist: ${d.metadata.artist}\n\n`;
      d.sections.forEach(sec => {
        content += `${sec.name} â Key: 1 = ${sec.key}\n`;
        content += `Scale: ${sec.scaleReference}\n\n`;
        sec.subsections.forEach(sub => {
          content += `  ${sub.name}\n`;
          sub.lines.forEach(line => {
            if (line.som) content += `  ${line.som}\n`;
            if (line.lyrics) content += `  ${line.lyrics}\n`;
            content += '\n';
          });
        });
      });
    } else if (activeResult.key) {
      content += `Key: 1 = ${activeResult.key.tonic}\n\n`;
      activeResult.sections?.forEach((section: ChartSection) => {
        content += `[${section.name}]\n`;
        section.lines.forEach((line: ChartLine) => {
          if (line.motesartChords && line.motesartChords.length > 0) {
            content += line.motesartChords.map((c: MotesartChordResult) => c.symbol).join('  ') + '\n';
          }
          if (line.lyrics) content += line.lyrics + '\n';
        });
        content += '\n';
      });
    }
    return content;
  };

  /* ââ Build styled HTML for PDF export ââ */
  const buildStyledPdfHtml = (logoDataUrl: string): string => {
    if (!activeResult || !isSomTeachingEdition(activeResult)) return '';
    const d = activeResult;
    const logo = logoDataUrl;

    let sectionsHtml = '';
    d.sections.forEach((sec, si) => {
      if (si > 0) {
        sectionsHtml += `<div style="display:flex;align-items:center;gap:12px;margin:20px 0 14px">
          <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,#c7d2fe,transparent)"></div>
          <span style="font-size:13px;font-weight:700;color:#6366f1;background:#eef2ff;padding:3px 12px;border-radius:999px;border:1px solid #c7d2fe;white-space:nowrap">KEY CHANGE &rarr; ${sec.key}</span>
          <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,#c7d2fe,transparent)"></div>
        </div>`;
      }

      sectionsHtml += `<div style="margin-bottom:24px">
        <div style="border-bottom:2px solid #e2e8f0;padding-bottom:10px;margin-bottom:14px">
          <div style="font-size:20px;font-weight:700;color:#0f172a">${sec.name} <span style="color:#6366f1">&mdash;</span> <span style="color:#0891b2">Key: 1 = ${sec.key}</span></div>
          <div style="margin-top:6px">
            <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Scale Reference</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:15px;color:#475569;margin-top:2px">${sec.scaleReference}</div>
          </div>
        </div>`;

      sec.subsections.forEach(sub => {
        sectionsHtml += `<div style="margin-bottom:14px">
          <div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:5px">${sub.name}</div>`;

        sub.lines.forEach(line => {
          if (line.type === 'chords') {
            sectionsHtml += `<div style="background:#f0fdfa;border-left:3px solid #06b6d4;padding:6px 14px;border-radius:0 4px 4px 0;margin-bottom:6px">`;
            sectionsHtml += `<pre style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#0891b2;white-space:pre;margin:0;line-height:1.4">${line.som || line.original || ''}</pre>`;
            if (line.lyrics) {
              sectionsHtml += `<pre style="font-family:'JetBrains Mono',monospace;font-size:15px;color:#475569;white-space:pre;margin:0;line-height:1.4">${line.lyrics}</pre>`;
            }
            sectionsHtml += `</div>`;
          } else if (line.type === 'notes') {
            sectionsHtml += `<div style="background:#faf5ff;border-left:3px solid #a855f7;padding:8px 14px;border-radius:0 4px 4px 0;margin-bottom:8px">`;
            if (line.label) sectionsHtml += `<div style="font-size:13px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.5px">${line.label}</div>`;
            if (line.original) sectionsHtml += `<div style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#94a3b8;margin-top:2px">Original: ${line.original}</div>`;
            if (line.som) sectionsHtml += `<div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#ea580c;margin-top:3px">SOM: ${line.som}</div>`;
            sectionsHtml += `</div>`;
          } else if (line.type === 'nc') {
            sectionsHtml += `<div style="font-family:'JetBrains Mono',monospace;font-size:14px;color:#94a3b8;padding-left:17px;margin-bottom:1px">N.C.</div>`;
            if (line.lyrics) sectionsHtml += `<div style="font-size:15px;color:#475569;padding-left:17px;margin-bottom:6px">${line.lyrics}</div>`;
          }
        });
        sectionsHtml += `</div>`;
      });
      sectionsHtml += `</div>`;
    });

    return `<div id="pdf-export-root" style="background:#fff;color:#1e293b;padding:0;font-family:Inter,Helvetica,Arial,sans-serif">
      <div style="height:3px;background:linear-gradient(90deg,#6366f1,#06b6d4,#f97316)"></div>
      <div style="display:flex;align-items:center;gap:18px;padding:28px 40px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
        <img src="${logo}" style="width:80px;height:80px;border-radius:14px;object-fit:cover">
        <div>
          <div style="font-size:32px;font-weight:700;color:#0f172a">Motesart Converter</div>
          <div style="font-size:15px;color:#94a3b8;margin-top:1px">SOM Teaching Edition</div>
        </div>
      </div>
      <div style="padding:24px 40px 40px">
        <div style="border-bottom:1px solid #e2e8f0;padding-bottom:18px;margin-bottom:24px">
          <div style="font-size:30px;font-weight:700;color:#0f172a">${d.title} <span style="color:#6366f1">&mdash;</span> <span style="font-weight:400;font-size:18px;color:#94a3b8">SOM Teaching Edition</span></div>
          <div style="display:flex;gap:24px;font-size:15px;color:#64748b;margin-top:8px;flex-wrap:wrap">
            <span><span style="font-weight:700;color:#334155">Keys:</span> ${d.metadata.keys.join(' &rarr; ')}</span>
            <span><span style="font-weight:700;color:#334155">Meter:</span> ${d.metadata.meter}</span>
            <span><span style="font-weight:700;color:#334155">Tempo:</span> ${d.metadata.tempo}</span>
            <span><span style="font-weight:700;color:#334155">Artist:</span> ${d.metadata.artist}</span>
          </div>
        </div>
        ${sectionsHtml}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding:10px 40px;margin-top:12px">
        <span style="display:flex;align-items:center;gap:5px">
          <img src="${logo}" style="width:18px;height:18px;border-radius:3px;object-fit:cover">
          Powered by Motesart Technologies
        </span>
        <span>motesart-converter.netlify.app</span>
      </div>
    </div>`;
  };

  /* ââ Helper: load logo as base64 data URL via same-origin proxy ââ */
  const loadLogoBase64 = async (): Promise<string> => {
    try {
      const res = await fetch('/api/logo');
      if (!res.ok) throw new Error('Logo fetch failed');
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // Return a 1x1 transparent PNG as fallback
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  };

  /* ââ Export ââ */
  const handleExport = async (format: 'pdf' | 'csv' | 'text') => {
    if (!activeResult) return;

    if (format === 'pdf' && isSomTeachingEdition(activeResult)) {
      try {
        // Preload logo as base64 via same-origin proxy
        const logoDataUrl = await loadLogoBase64();
        const html = buildStyledPdfHtml(logoDataUrl);
        if (!html) return;

        // Dynamic import of html2pdf.js (bundled via npm)
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default;

        const container = document.createElement('div');
        container.innerHTML = html;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '816px';
        document.body.appendChild(container);

        const element = container.firstElementChild as HTMLElement;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (html2pdf() as any).set({
          margin: [0, 0, 0, 0],
          filename: `${activeResult.title || 'motesart-conversion'} - SOM Teaching Edition.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true, width: 816, windowWidth: 816 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        }).from(element).save();

        document.body.removeChild(container);
      } catch (err) {
        console.error('PDF export error:', err);
        // Fallback to plain text download
        const content = buildTextContent();
        if (content) {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${activeResult.title || 'motesart-conversion'} - SOM Teaching Edition.txt`; a.click();
          URL.revokeObjectURL(url);
        }
      }
    } else {
      // Plain text / CSV export
      const content = buildTextContent();
      const fileName = `motesart-conversion.${format === 'text' ? 'txt' : format}`;
      if (content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  /* ââ Chat ââ */
  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = { role: 'user', text: chatInput };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          conversionContext: activeResult || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: 'ai', text: data.text }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I had trouble responding. Please try again.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Connection error. Please check your internet and try again.' }]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleExplainClick = () => {
    if (!activeResult) {
      setChatInput('What is the Motesart Number System and how does it work?');
    } else {
      setChatInput('Analyze this conversion. What key changes, progressions, and patterns do you see?');
    }
  };

  const KEYS = ['Auto-detect','C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];

  /* ââ Determine key display ââ */
  const keyDisplay = activeResult
    ? isSomTeachingEdition(activeResult)
      ? activeResult.metadata?.keys?.join(' â ')
      : activeResult.key?.tonic
    : null;

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />

      <main className="max-w-[1360px] mx-auto p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            {/* Upload / Manual Entry Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#6366f1]" />
                  <h2 className="text-sm font-semibold text-[#e2e8f0]">
                    {mode === 'upload' ? 'Upload Sheet Music' : 'Manual Entry'}
                  </h2>
                </div>
                <button
                  onClick={() => setMode(mode === 'upload' ? 'manual' : 'upload')}
                  className="text-xs px-3 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-[#e2e8f0] rounded-lg transition-colors flex items-center gap-1"
                >
                  {mode === 'upload' ? <Edit3 className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                  {mode === 'upload' ? 'Manual' : 'Upload'}
                </button>
              </div>

              {mode === 'upload' ? (
                <>
                  <p className="text-xs text-[#64748b] mb-4">
                    Drop sheet music (PDF/image) or MIDI/MusicXML
                  </p>
                  <div
                    onClick={handleFileInputClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-9 text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-[#334155] hover:border-[#6366f1]'
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      <FileText className="w-8 h-8 text-[#64748b]" />
                    </div>
                    <p className="text-sm text-[#94a3b8] mb-1">Drop sheet music here or click to browse</p>
                    <p className="text-xs text-[#64748b]">PDF, PNG, JPG, MIDI, MusicXML</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.mid,.midi,.musicxml,.xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </>
              ) : (
                <>
                  <p className="text-xs text-[#64748b] mb-3">Paste a chord chart below to convert</p>
                  <div className="mb-3">
                    <label className="text-xs text-[#64748b] mb-1 block">Key</label>
                    <select
                      value={selectedKey}
                      onChange={(e) => setSelectedKey(e.target.value)}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                    >
                      {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={`Key: G\n[Verse]\nG     D     Em    C\nAmazing grace how sweet\nG     D     G\nThat saved a wretch like me`}
                    className="w-full h-40 bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm font-mono text-white placeholder-[#475569] resize-none focus:outline-none focus:border-[#6366f1]"
                  />
                  <button
                    onClick={handleConvert}
                    disabled={!manualInput.trim() || isProcessing}
                    className="w-full mt-3 px-4 py-2.5 bg-[#6366f1] hover:bg-[#5558e6] disabled:bg-[#6366f1]/30 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isProcessing ? 'Converting...' : 'Convert to Motesart'}
                  </button>
                </>
              )}
            </div>

            {/* Recent Files Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Recent Files</h2>
                <button onClick={() => setUploadedFiles([])} className="p-1 hover:bg-[#1e293b] rounded transition-colors">
                  <RefreshCw className="w-4 h-4 text-[#64748b] hover:text-[#94a3b8]" />
                </button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.length === 0 ? (
                  <p className="text-xs text-[#64748b] text-center py-4">No files uploaded yet</p>
                ) : (
                  uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#0f172a] rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer">
                      <div className={`p-2 rounded ${file.type.includes('pdf') ? 'bg-red-500/20' : file.type.includes('image') ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                        <File className={`w-4 h-4 ${file.type.includes('pdf') ? 'text-red-400' : file.type.includes('image') ? 'text-blue-400' : 'text-green-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#e2e8f0] truncate">{file.name}</p>
                        <p className="text-xs text-[#64748b]">{file.key ? `1 = ${file.key}` : `${(file.size / 1024).toFixed(1)}KB`}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        file.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                        file.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                        file.status === 'error' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1 hover:bg-[#0f172a] rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-[#64748b] hover:text-red-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SOM Quick Guide */}
            <SomLegendCard />

            {/* Display Settings Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-[#6366f1]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Display Settings</h2>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <label className="text-sm text-[#94a3b8]">Show original preview</label>
                <button
                  onClick={() => setOriginalPreview(!originalPreview)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ backgroundColor: originalPreview ? '#6366f1' : '#334155' }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${originalPreview ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="pt-3 border-t border-[#1e293b]">
                <p className="text-xs text-[#64748b] mb-2">Chromatic reference</p>
                <p className="text-xs font-mono text-[#f97316]">1½ 2½ 4½ 5½ 6½</p>
                <p className="text-xs text-[#64748b] mt-1">No 3½ or 7½</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">
            {/* Motesart Conversion Preview Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-[#6366f1]" />
                  <h2 className="text-sm font-semibold text-[#e2e8f0]">SOM Teaching Edition</h2>
                </div>
                <div className="flex items-center gap-2">
                  {keyDisplay && (
                    <span className="text-xs px-2 py-1 bg-[#6366f1]/20 text-[#818cf8] rounded font-mono font-bold">
                      1 = {keyDisplay}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    activeResult ? 'bg-green-500/20 text-green-400' :
                    isProcessing ? 'bg-[#f97316]/20 text-[#f97316]' :
                    'bg-[#334155] text-[#64748b]'
                  }`}>
                    {activeResult ? 'Converted' : isProcessing ? 'Processing...' : 'Ready'}
                  </span>
                </div>
              </div>

              {activeResult ? (
                <div className="flex-1 overflow-y-auto">
                  {activeFileName && (
                    <p className="text-xs text-[#64748b] mb-3">Source: {activeFileName}</p>
                  )}
                  {isSomTeachingEdition(activeResult) ? (
                    <SomTeachingEditionView data={activeResult} converterMode={converterMode} setConverterMode={setConverterMode} />
                  ) : (
                    <OldResultView result={activeResult as OldConversionResult} originalPreview={originalPreview} />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                  <Music className="w-12 h-12 text-[#64748b] mb-3" />
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1">Ready to Process</h3>
                  <p className="text-xs text-[#64748b] mb-6 max-w-sm">
                    {mode === 'upload'
                      ? 'Upload sheet music and click Process to extract and convert using Gemini AI.'
                      : 'Switch to Manual Entry mode and paste a chord chart to convert.'}
                  </p>
              {/* CONVERTER MODE SELECTOR */}
              <div className="flex gap-1.5 mb-4">
                {(['quick', 'curriculum', 'compliance'] as const).map(m => (
                  <button key={m} onClick={() => setConverterMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${converterMode === m
                      ? 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/[0.03] text-[#475569] border border-white/[0.06] hover:bg-white/[0.06]'}`}>
                    {m === 'quick' ? 'Quick' : m === 'curriculum' ? 'Curriculum' : 'Compliance'}
                  </button>
                ))}
              </div>
                  {mode === 'upload' && (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={handleConvert}
                        disabled={uploadedFiles.length === 0 || isProcessing}
                        className="px-6 py-2 bg-[#f97316] hover:bg-[#ea580c] disabled:bg-[#f97316]/30 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-colors"
                      >
                        {isProcessing ? 'Processing...' : 'Process with Gemini AI'}
                      </button>
                      <p className="text-xs text-[#64748b]">
                        Extracts notes, lyrics, key signature and converts to SOM
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* CURRICULUM & COMPLIANCE PANELS */}
            {converterMode !== 'quick' && (activeResult as any) && (
              <div className="mt-4 space-y-3">
                {/* Concepts Exercised */}
                {((activeResult as any).conceptsExercised || []).length > 0 && (
                  <div className="bg-[#0f172a]/60 border border-[#6366f1]/20 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider mb-2">Concepts Exercised</p>
                    <div className="flex flex-wrap gap-1.5">
                      {((activeResult as any).conceptsExercised || []).map((concept: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/20">
                          {concept.replace('T_', '').replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Phase */}
                {(activeResult as any).suggestedPhase && (
                  <div className="bg-[#0f172a]/60 border border-[#06b6d4]/20 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#06b6d4] uppercase tracking-wider mb-1">Learning Phase</p>
                    <p className="text-sm font-bold text-white">{(activeResult as any).suggestedPhase.replace('PHASE_', 'Phase ').replace(/_/g, ' ')}</p>
                  </div>
                )}

                {/* Teaching Notes (Curriculum & Compliance) */}
                {(activeResult as any).teachingNotes && (
                  <div className="bg-[#0f172a]/60 border border-[#10b981]/20 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider mb-1">Teaching Notes</p>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">{(activeResult as any).teachingNotes}</p>
                  </div>
                )}

                {/* Tool Suggestions */}
                {((activeResult as any).toolSuggestions || []).length > 0 && (
                  <div className="bg-[#0f172a]/60 border border-[#f59e0b]/20 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#f59e0b] uppercase tracking-wider mb-2">Suggested Tools</p>
                    <div className="flex flex-wrap gap-1.5">
                      {((activeResult as any).toolSuggestions || []).map((tool: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f59e0b]/10 text-[#fbbf24] border border-[#f59e0b]/20">
                          {tool.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMPLIANCE-ONLY PANELS */}
                {converterMode === 'compliance' && (
                  <>
                    {/* Grade Band Alignment */}
                    {(activeResult as any).gradeBandAlignment && (
                      <div className="bg-[#0f172a]/60 border border-[#ec4899]/20 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-[#ec4899] uppercase tracking-wider mb-1">Grade Band Alignment</p>
                        <p className="text-lg font-extrabold text-white">{(activeResult as any).gradeBandAlignment}</p>
                      </div>
                    )}

                    {/* Standards Evidence */}
                    {(activeResult as any).standardsEvidence && (
                      <div className="bg-[#0f172a]/60 border border-[#8b5cf6]/20 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-[#8b5cf6] uppercase tracking-wider mb-1">Standards Evidence</p>
                        <p className="text-xs text-[#94a3b8] leading-relaxed">{(activeResult as any).standardsEvidence}</p>
                      </div>
                    )}

                    {/* Compliance Notes */}
                    {(activeResult as any).complianceNotes && (
                      <div className="bg-[#0f172a]/60 border border-[#ef4444]/20 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-[#ef4444] uppercase tracking-wider mb-1">Compliance Notes</p>
                        <p className="text-xs text-[#94a3b8] leading-relaxed">{(activeResult as any).complianceNotes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* AI Analysis & Chat Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#6366f1]" />
                  <h2 className="text-sm font-semibold text-[#e2e8f0]">AI Analysis & Chat</h2>
                </div>
                <button onClick={handleExplainClick} className="text-xs px-3 py-1 bg-[#7c3aed]/20 text-[#a78bfa] hover:bg-[#7c3aed]/30 rounded transition-colors">
                  Explain
                </button>
              </div>
              <div className="flex-1 mb-4 min-h-[100px] max-h-[300px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-[#64748b] mb-3">
                      Ask questions about the sheet music, musical theory, or get AI insights.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['What is the Motesart Number System?', 'Explain the 1-5-6-4 progression', 'How do I transpose to a new key?'].map((q, i) => (
                        <button key={i} onClick={() => setChatInput(q)} className="text-xs px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded-full transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                          msg.role === 'user' ? 'bg-[#6366f1] text-white' : 'bg-[#1e293b] text-[#94a3b8]'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#1e293b] px-4 py-2 rounded-lg">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask about this sheet music..."
                  className="flex-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6366f1] transition-colors"
                />
                <button
                  onClick={handleChatSend}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#6366f1]/30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Export & Share Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-[#6366f1]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Export & Share</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['pdf', 'csv', 'text'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    disabled={!activeResult}
                    className="py-2 px-4 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed text-[#94a3b8] hover:text-[#e2e8f0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
