'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import {
  convertChordChart,
  KEY_SIGNATURES,
  type ConversionResult,
} from '@/lib/motesart-engine';

const EXAMPLE_SIMPLE_HYMN = `Key: G
[Verse]
G     D     Em    C
Amazing grace how sweet the sound
G     D     G
That saved a wretch like me`;

const EXAMPLE_POP_SONG = `Key: C
[Verse]
Am    F     C     G
Somebody once told me the world is gonna roll me
Am    F     C     G
I ain't the sharpest tool in the shed

[Chorus]
F     G     Am
Hey now, you're an all star
F     G     C
Get your game on, go play`;

const EXAMPLE_JAZZ = `Key: Bb
[Head]
Cm7   F7    Bbmaj7   Ebmaj7
Cm7   F7    Dm7      G7
Cm7   F7    Bb       Gm7
Cm7   F7    Bb`;

const EXAMPLES = [
  { label: 'Simple Hymn', text: EXAMPLE_SIMPLE_HYMN },
  { label: 'Pop Song', text: EXAMPLE_POP_SONG },
  { label: 'Jazz Standard', text: EXAMPLE_JAZZ },
];

function MotesartSymbol({ symbol }: { symbol: string }) {
  const numberMatch = symbol.match(/^(\d½?)/);
  if (!numberMatch) return <span>{symbol}</span>;

  const num = numberMatch[1];
  const rest = symbol.slice(num.length);
  const isHalf = num.includes('½');
  const baseNum = parseInt(num[0]);

  // Color map matching Emergent neon palette
  const colors: Record<number, string> = {
    1: '#06b6d4', // cyan
    2: '#6366f1', // indigo
    3: '#a855f7', // purple
    4: '#06b6d4', // cyan
    5: '#6366f1', // indigo
    6: '#a855f7', // purple
    7: '#ec4899', // pink
  };

  const color = isHalf ? '#f97316' : (colors[baseNum] || '#06b6d4');

  return (
    <span className="font-mono text-lg">
      <span style={{ color, fontWeight: 700 }}>{num}</span>
      <span className="text-[#94a3b8]">{rest}</span>
    </span>
  );
}

export default function ConverterPage() {
  const [input, setInput] = useState('');
  const [selectedKey, setSelectedKey] = useState('Auto-detect');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [showOctaveMarkings, setShowOctaveMarkings] = useState(false);
  const [showRomanNumerals, setShowRomanNumerals] = useState(false);

  const handleConvert = useCallback(() => {
    if (!input.trim()) return;
    const options: { key?: string; timeSignature?: string } = { timeSignature };
    if (selectedKey !== 'Auto-detect') options.key = selectedKey;
    const converted = convertChordChart(input, options);
    setResult(converted);
  }, [input, selectedKey, timeSignature]);

  const loadExample = (text: string) => { setInput(text); setResult(null); };
  const clearAll = () => { setInput(''); setResult(null); };

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Input Panel */}
          <div className="lg:col-span-4">
            <div className="bg-[#0f172a]/50 rounded-xl border border-[#1e293b] p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h2 className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>Input Chord Chart</h2>
              </div>
              <p className="text-[#64748b] text-xs mb-4">
                Paste your chord chart below. Supports chords-over-lyrics, inline [chords], or plain sequences.
              </p>

              {/* Key & Time Sig */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs text-[#64748b] mb-1 block">Key</label>
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    <option>Auto-detect</option>
                    {KEY_SIGNATURES.map((k) => (
                      <option key={k.tonic} value={k.tonic}>{k.tonic}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#64748b] mb-1 block">Time Signature</label>
                  <select
                    value={timeSignature}
                    onChange={(e) => setTimeSignature(e.target.value)}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                  >
                    <option>4/4</option><option>3/4</option><option>6/8</option><option>2/4</option><option>12/8</option>
                  </select>
                </div>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Paste your chord chart here...\n\nExample:\n[Verse]\nG     D     Em    C\nAmazing grace how sweet\nG     D     G\nThat saved a wretch like me`}
                className="w-full h-64 bg-[#1e293b] border border-[#334155] rounded-lg p-4 text-sm font-mono text-white placeholder-[#475569] resize-none focus:outline-none focus:border-[#6366f1]"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleConvert}
                  disabled={!input.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#6366f1] hover:bg-[#5558e6] disabled:bg-[#6366f1]/30 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors glow-primary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  Convert
                </button>
                <button onClick={clearAll} className="p-3 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-lg transition-colors" title="Clear">
                  <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs text-[#64748b] mb-2">Load Example:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      onClick={() => loadExample(ex.text)}
                      className="text-xs px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-lg text-[#94a3b8] hover:text-white transition-colors"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-5">
            <div className="bg-[#0f172a]/50 rounded-xl border border-[#1e293b] p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#06b6d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <h2 className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>Motesart View</h2>
              </div>

              {result ? (
                <div>
                  <div className="flex items-center justify-between mb-4 px-3 py-2 bg-[#1e293b]/50 rounded-lg">
                    <span className="text-sm text-[#94a3b8]">Key detected:</span>
                    <span className="font-mono font-bold text-[#6366f1]">1 = {result.key.tonic}</span>
                  </div>

                  <div className="space-y-4">
                    {result.sections.map((section, si) => (
                      <div key={si}>
                        <h3 className="text-xs font-bold text-[#06b6d4] mb-2 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {section.name}
                        </h3>
                        <div className="space-y-2">
                          {section.lines.map((line, li) => {
                            if (line.type === 'empty') return <div key={li} className="h-2" />;
                            return (
                              <div key={li} className="space-y-0.5">
                                {line.motesartChords && line.motesartChords.length > 0 && (
                                  <div className="flex flex-wrap gap-4 px-2 py-1.5 bg-[#1e293b]/30 rounded">
                                    {line.motesartChords.map((chord, ci) => (
                                      <div key={ci} className="flex flex-col items-center">
                                        <MotesartSymbol symbol={chord.symbol} />
                                        <span className="text-[10px] text-[#475569] font-mono">{chord.original}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {line.lyrics && <p className="text-sm text-[#94a3b8] pl-2">{line.lyrics}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.detectedProgressions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-[#1e293b]">
                      <h3 className="text-sm font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Detected Progressions</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.detectedProgressions.map((prog, pi) => (
                          <span key={pi} className="progression-chip">{prog.pattern} ({prog.name})</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-[#94a3b8]">
                  <svg className="w-10 h-10 mb-3 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  <p className="font-medium">Enter a chord chart and click Convert</p>
                  <p className="text-sm text-[#64748b]">The Motesart numbers will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Settings & Reference Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0f172a]/50 rounded-xl border border-[#1e293b] p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <h2 className="font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h2>
              </div>

              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-[#94a3b8]">Octave markings</span>
                <button
                  onClick={() => setShowOctaveMarkings(!showOctaveMarkings)}
                  className={`w-10 h-5 rounded-full transition-colors ${showOctaveMarkings ? 'bg-[#6366f1]' : 'bg-[#334155]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showOctaveMarkings ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>

              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-[#94a3b8]">Roman numerals side-by-side</span>
                <button
                  onClick={() => setShowRomanNumerals(!showRomanNumerals)}
                  className={`w-10 h-5 rounded-full transition-colors ${showRomanNumerals ? 'bg-[#6366f1]' : 'bg-[#334155]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showRomanNumerals ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>

              <div className="mt-3 px-3 py-2 bg-[#1e293b] rounded-lg">
                <p className="text-xs font-mono">
                  <span className="text-[#f97316]">1½ 2½ 4½ 5½ 6½</span>
                  <span className="text-[#64748b]"> = chromatic notes</span>
                </p>
              </div>
            </div>

            <div className="bg-[#0f172a]/50 rounded-xl border border-[#1e293b] p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h2 className="font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Conversion Rules</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-bold text-[#06b6d4] mb-1">§3 Half-Numbers</h4>
                  <p className="text-[#94a3b8] text-xs">Valid: 1½, 2½, 4½, 5½, 6½</p>
                  <p className="text-[#94a3b8] text-xs">Never use 3½ or 7½ (natural half-steps)</p>
                  <p className="text-xs text-[#f97316] font-bold font-mono mt-1">No sharp or flat symbols!</p>
                </div>
                <div>
                  <h4 className="font-bold text-[#06b6d4] mb-1">§6 Chord Quality</h4>
                  <p className="text-[#94a3b8] text-xs">Minor: always marked with &apos;m&apos;</p>
                  <p className="text-[#94a3b8] text-xs">Major: &apos;M&apos; only if non-diatonic</p>
                  <p className="text-[#94a3b8] text-xs">Diatonic major: no modifier</p>
                </div>
                <div>
                  <h4 className="font-bold text-[#06b6d4] mb-1">§7 Inversions</h4>
                  <p className="text-[#94a3b8] text-xs">Format: bass/chord</p>
                  <p className="text-[#94a3b8] text-xs">Example: G/B in C → 7/5</p>
                </div>
                <div>
                  <h4 className="font-bold text-[#06b6d4] mb-1">§4c Extensions</h4>
                  <p className="text-[#94a3b8] text-xs font-mono">7→⁷, 9→⁹, 11→¹¹, 13→¹³</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
