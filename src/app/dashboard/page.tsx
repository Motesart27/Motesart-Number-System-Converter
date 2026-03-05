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
  ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

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

interface ConversionResult {
  key: { tonic: string; mode: string };
  sections: ChartSection[];
  detectedProgressions: { pattern: string; name: string }[];
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploaded' | 'processing' | 'converted' | 'error';
  key?: string;
  result?: ConversionResult;
  timestamp: Date;
  file?: File;
  errorMessage?: string;
}

function MotesartSymbol({ symbol }: { symbol: string }) {
  const numberMatch = symbol.match(/^(\d½?)/);
  if (!numberMatch) return <span>{symbol}</span>;
  const num = numberMatch[1];
  const rest = symbol.slice(num.length);
  const isHalf = num.includes('½');
  const baseNum = parseInt(num[0]);
  const colors: Record<number, string> = {
    1: '#06b6d4', 2: '#6366f1', 3: '#a855f7',
    4: '#06b6d4', 5: '#6366f1', 6: '#a855f7', 7: '#ec4899',
  };
  const color = isHalf ? '#f97316' : (colors[baseNum] || '#06b6d4');
  return (
    <span className="font-mono text-lg">
      <span style={{ color, fontWeight: 700 }}>{num}</span>
      <span className="text-[#94a3b8]">{rest}</span>
    </span>
  );
}

export default function Dashboard() {
  const [octaveMarkings, setOctaveMarkings] = useState(true);
  const [originalPreview, setOriginalPreview] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string; text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [manualInput, setManualInput] = useState('');
  const [selectedKey, setSelectedKey] = useState('Auto-detect');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeResult, setActiveResult] = useState<ConversionResult | null>(null);
  const [activeFileName, setActiveFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
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
    if (newFiles.length > 0) {
      setActiveFileName(newFiles[0].name);
    }
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

  const handleConvert = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (mode === 'manual') {
        // Manual text conversion
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
        // File upload processing via Gemini
        const fileToProcess = uploadedFiles.find(f => f.file && f.status === 'uploaded');
        if (!fileToProcess || !fileToProcess.file) {
          setIsProcessing(false);
          return;
        }

        // Update file status to processing
        setUploadedFiles(prev => prev.map(f =>
          f.name === fileToProcess.name ? { ...f, status: 'processing' as const } : f
        ));

        const formData = new FormData();
        formData.append('file', fileToProcess.file);
        if (selectedKey !== 'Auto-detect') {
          formData.append('key', selectedKey);
        }

        const res = await fetch('/api/process', {
          method: 'POST',
          body: formData,
        });
        const result = await res.json();

        if (res.ok) {
          setActiveResult(result);
          setActiveFileName(fileToProcess.name);
          setUploadedFiles(prev => prev.map(f =>
            f.name === fileToProcess.name
              ? { ...f, status: 'converted' as const, key: result.key?.tonic, result }
              : f
          ));
          // Save to Airtable
          fetch('/api/conversions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputText: result.extractedText || fileToProcess.name,
              outputJson: result,
              keyUsed: result.key?.tonic || 'C',
              timeSignature: '4/4',
            }),
          }).catch(() => {});
        } else {
          setUploadedFiles(prev => prev.map(f =>
            f.name === fileToProcess.name
              ? { ...f, status: 'error' as const, errorMessage: result.error }
              : f
          ));
        }
      }
    } catch (err) {
      console.error('Conversion error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [mode, manualInput, selectedKey, uploadedFiles]);

  const handleExport = (format: 'pdf' | 'csv' | 'text') => {
    if (!activeResult) return;
    let content = '';
    const fileName = `motesart-conversion.${format === 'text' ? 'txt' : format}`;

    if (format === 'text' || format === 'csv') {
      content += `Key: 1 = ${activeResult.key.tonic}\n\n`;
      activeResult.sections.forEach(section => {
        content += `[${section.name}]\n`;
        section.lines.forEach(line => {
          if (line.motesartChords && line.motesartChords.length > 0) {
            if (format === 'csv') {
              content += line.motesartChords.map(c => `${c.original},${c.symbol}`).join('\n') + '\n';
            } else {
              content += line.motesartChords.map(c => c.symbol).join('  ') + '\n';
            }
          }
          if (line.lyrics) content += line.lyrics + '\n';
        });
        content += '\n';
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = { role: 'user', text: chatInput };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const conversionContext = activeResult ? {
        key: activeResult.key.tonic,
        sections: activeResult.sections,
        progressions: activeResult.detectedProgressions,
      } : null;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          conversionContext,
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
      setChatInput(`Analyze this conversion in key of ${activeResult.key.tonic}. What progressions do you see and what mood do they create?`);
    }
  };

  const KEYS = ['Auto-detect','C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];

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
                  <p className="text-xs text-[#64748b] mb-3">
                    Paste a chord chart below to convert
                  </p>
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
                <button
                  onClick={() => setUploadedFiles([])}
                  className="p-1 hover:bg-[#1e293b] rounded transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-[#64748b] hover:text-[#94a3b8]" />
                </button>
              </div>

              <div className="space-y-2">
                {uploadedFiles.length === 0 ? (
                  <p className="text-xs text-[#64748b] text-center py-4">No files uploaded yet</p>
                ) : (
                  uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#0f172a] rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer">
                      <div className={`p-2 rounded ${
                        file.type.includes('pdf') ? 'bg-red-500/20' :
                        file.type.includes('image') ? 'bg-blue-500/20' : 'bg-green-500/20'
                      }`}>
                        <File className={`w-4 h-4 ${
                          file.type.includes('pdf') ? 'text-red-400' :
                          file.type.includes('image') ? 'text-blue-400' : 'text-green-400'
                        }`} />
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
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="p-1 hover:bg-[#0f172a] rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-[#64748b] hover:text-red-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Display Settings Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-[#6366f1]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Display Settings</h2>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <label className="text-sm text-[#94a3b8]">Show octave markings</label>
                <button
                  onClick={() => setOctaveMarkings(!octaveMarkings)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ backgroundColor: octaveMarkings ? '#6366f1' : '#334155' }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${octaveMarkings ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
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
                  <h2 className="text-sm font-semibold text-[#e2e8f0]">Motesart Conversion Preview</h2>
                </div>
                <div className="flex items-center gap-2">
                  {activeResult && (
                    <span className="text-xs px-2 py-1 bg-[#6366f1]/20 text-[#818cf8] rounded font-mono font-bold">
                      1 = {activeResult.key.tonic}
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
                  <div className="space-y-4">
                    {activeResult.sections.map((section, si) => (
                      <div key={si}>
                        <h3 className="text-xs font-bold text-[#06b6d4] mb-2 uppercase tracking-wider">
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
                                        {originalPreview && (
                                          <span className="text-[10px] text-[#475569] font-mono">{chord.original}</span>
                                        )}
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

                  {activeResult.detectedProgressions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-[#1e293b]">
                      <h3 className="text-sm font-bold text-white mb-2">Detected Progressions</h3>
                      <div className="flex flex-wrap gap-2">
                        {activeResult.detectedProgressions.map((prog, pi) => (
                          <span key={pi} className="text-xs px-3 py-1.5 bg-[#6366f1]/20 text-[#818cf8] rounded-full">
                            {prog.pattern} ({prog.name})
                          </span>
                        ))}
                      </div>
                    </div>
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
                        Extracts notes, lyrics, key signature from scanned sheet music
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Analysis & Chat Panel */}
            <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#6366f1]" />
                  <h2 className="text-sm font-semibold text-[#e2e8f0]">AI Analysis & Chat</h2>
                </div>
                <button
                  onClick={handleExplainClick}
                  className="text-xs px-3 py-1 bg-[#7c3aed]/20 text-[#a78bfa] hover:bg-[#7c3aed]/30 rounded transition-colors"
                >
                  Explain
                </button>
              </div>

              <div className="flex-1 mb-4 min-h-[100px] max-h-[300px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-[#64748b] mb-3">
                      Ask questions about the sheet music, musical theory, or get AI insights about the piece.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['What is the Motesart Number System?', 'Explain the 1-5-6-4 progression', 'How do I transpose to a new key?'].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setChatInput(q)}
                          className="text-xs px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] rounded-full transition-colors"
                        >
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
                          msg.role === 'user'
                            ? 'bg-[#6366f1] text-white'
                            : 'bg-[#1e293b] text-[#94a3b8]'
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
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!activeResult}
                  className="py-2 px-4 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed text-[#94a3b8] hover:text-[#e2e8f0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={!activeResult}
                  className="py-2 px-4 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed text-[#94a3b8] hover:text-[#e2e8f0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('text')}
                  disabled={!activeResult}
                  className="py-2 px-4 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed text-[#94a3b8] hover:text-[#e2e8f0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Text
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
