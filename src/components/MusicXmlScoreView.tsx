'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Music, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * MusicXmlScoreView — renders converted MusicXML as real staff notation
 * using OpenSheetMusicDisplay (OSMD).
 * 
 * SOM numbers appear as lyrics below each note on the staff.
 * Original notation preserved: staff lines, note positions, durations, rests.
 */

interface MusicXmlScoreViewProps {
  /** The converted MusicXML string with SOM annotations */
  outputXml: string;
  /** Conversion metadata */
  metadata: {
    detected_key: string;
    number_home: string;
    scale_map: string[];
    conversion_mode: string;
    motesart_concepts_detected: string[];
    tempo_bpm: number;
    measure_count: number;
    total_notes: number;
    total_chords: number;
    conversion_confidence: number;
  };
  /** Converted notes array */
  notes: Array<{
    measureNumber: number;
    somDegree: string;
    originalStep: string;
    originalAlter: number;
    isRest: boolean;
  }>;
  /** Converted chords array */
  chords: Array<{
    measureNumber: number;
    originalRoot: string;
    originalKind: string;
    somNotation: string;
  }>;
  /** Scale map */
  scaleMap: string[];
}

export default function MusicXmlScoreView({ outputXml, metadata, notes, chords, scaleMap }: MusicXmlScoreViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    if (!containerRef.current || !outputXml) return;

    let cancelled = false;

    const loadOSMD = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import to avoid SSR issues
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');

        if (cancelled || !containerRef.current) return;

        // Clear previous render
        containerRef.current.innerHTML = '';

        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
          drawLyricist: false,
          drawCredits: false,
          drawPartNames: true,
          drawMeasureNumbers: true,
          drawTimeSignatures: true,
          drawKeySignatures: true,
          // Render lyrics (which contain our SOM numbers)
          drawLyrics: true,
          // Visual settings
          defaultColorNotehead: '#e2e8f0',
          defaultColorStem: '#94a3b8',
          defaultColorRest: '#64748b',
          defaultColorLabel: '#06b6d4',
          defaultFontFamily: 'Inter, system-ui, sans-serif',
        });

        osmdRef.current = osmd;
        osmd.zoom = zoom;

        await osmd.load(outputXml);
        
        if (cancelled) return;
        
        osmd.render();
        setIsLoading(false);
      } catch (err) {
        console.error('[MusicXmlScoreView] OSMD error:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render sheet music');
          setIsLoading(false);
        }
      }
    };

    loadOSMD();
    return () => { cancelled = true; };
  }, [outputXml]);

  // Handle zoom changes
  useEffect(() => {
    if (osmdRef.current && !isLoading) {
      osmdRef.current.zoom = zoom;
      osmdRef.current.render();
    }
  }, [zoom, isLoading]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));

  const handleExportXml = () => {
    const blob = new Blob([outputXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (metadata.detected_key || 'motesart') + '-som-conversion.musicxml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#06b6d4]/10 flex items-center justify-center">
            <Music className="w-5 h-5 text-[#06b6d4]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">MusicXML — SOM Score View</h2>
            <p className="text-[11px] text-[#64748b]">
              Key: {metadata.detected_key} Major | {metadata.number_home} | {metadata.measure_count} measures | {metadata.total_notes} notes
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-all">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-[#64748b] font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-all">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleExportXml} className="ml-2 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export XML
          </button>
        </div>
      </div>

      {/* SCALE MAP BAR */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#06b6d4]/5 border border-[#06b6d4]/15 rounded-lg">
        <span className="text-[10px] font-semibold text-[#06b6d4] uppercase tracking-wider">Scale Map:</span>
        <div className="flex gap-1.5">
          {scaleMap.map((m, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#06b6d4]/10 text-[#22d3ee] border border-[#06b6d4]/20">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* SCORE RENDERER */}
      <div className="bg-white rounded-xl border border-white/[0.08] overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-[#6366f1] animate-spin" />
              <span className="text-sm font-medium text-[#334155]">Rendering score...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center p-6">
              <p className="text-sm text-red-500 font-medium mb-2">Could not render score</p>
              <p className="text-xs text-[#64748b]">{error}</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="p-4" style={{ minHeight: '300px' }} />
      </div>

      {/* CONVERSION DETAILS */}
      <div className="flex gap-3">
        {/* Chord Translations */}
        {chords.length > 0 && (
          <div className="flex-1 bg-[#0f172a]/60 border border-[#6366f1]/20 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider mb-2">
              Chord Translations ({chords.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {chords.map((c, i) => (
                <span key={i} className="px-2 py-1 rounded text-[10px] font-mono bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20">
                  {c.originalRoot}{c.originalKind !== 'major' ? c.originalKind.substring(0, 3) : ''} → <strong className="text-[#06b6d4]">{c.somNotation}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Concepts Detected */}
        {metadata.motesart_concepts_detected.length > 0 && (
          <div className="w-[220px] shrink-0 bg-[#0f172a]/60 border border-[#10b981]/20 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider mb-2">Concepts Detected</p>
            <div className="flex flex-wrap gap-1.5">
              {metadata.motesart_concepts_detected.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/20">
                  {c.replace('T_', '').replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confidence */}
        <div className="w-[140px] shrink-0 bg-[#0f172a]/60 border border-[#22c55e]/20 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-[#22c55e] uppercase tracking-wider mb-1">Confidence</p>
          <p className="text-2xl font-extrabold text-[#22c55e]">{metadata.conversion_confidence}%</p>
          <p className="text-[9px] text-[#64748b]">Deterministic</p>
          <p className="text-[9px] text-[#64748b] mt-1">
            {metadata.tempo_bpm} BPM | {metadata.conversion_mode}
          </p>
        </div>
      </div>
    </div>
  );
}
