'use client';

import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

const KEY_DATA = [
  { tonic: 'C', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  { tonic: 'D', notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] },
  { tonic: 'E', notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] },
  { tonic: 'F', notes: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'] },
  { tonic: 'G', notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
  { tonic: 'A', notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] },
  { tonic: 'Bb', notes: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'] },
  { tonic: 'Eb', notes: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'] },
];

const PROGRESSIONS = [
  { roman: 'I-vi-IV-V', motesart: '1-6-4-5', name: 'Pop', examples: 'Let It Be' },
  { roman: 'ii-V-I', motesart: '2-5-1', name: 'Jazz', examples: 'All of Me' },
  { roman: 'I-IV-V-I', motesart: '1-4-5-1', name: 'Blues/Rock', examples: 'Johnny B. Goode' },
  { roman: 'vi-IV-I-V', motesart: '6-4-1-5', name: 'Axis', examples: 'Someone Like You' },
  { roman: 'I-V-vi-IV', motesart: '1-5-6-4', name: 'Four Chords', examples: 'Don\'t Stop Believin\'' },
  { roman: 'vii-iii-vi', motesart: '7-3-6', name: 'Circle of 5ths', examples: 'Fly Me to the Moon' },
];

const COLOR_MAP: { [key: number]: string } = {
  1: '#06b6d4',
  2: '#6366f1',
  3: '#a855f7',
  4: '#06b6d4',
  5: '#6366f1',
  6: '#a855f7',
  7: '#ec4899',
};

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 mb-6">
            <span className="text-sm text-[#cbd5e1]">Learn the System</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            The Motesart{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#a855f7]">
              Number System
            </span>
          </h1>
          <p className="text-[#94a3b8] max-w-2xl mx-auto text-lg">
            A numbers-first music language where every note has a number. Learn the universal system that makes
            music theory intuitive and transposition instant.
          </p>
        </div>

        {/* What is Motesart Methodology? */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-3xl">❓</span>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              What is Motesart Methodology?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '#',
                title: 'Numbers Replace Letters',
                description: 'Every note in a key gets a number from 1-7. The same song uses the same numbers in any key.',
                bg: 'bg-[#6366f1]/20',
                border: 'border-[#6366f1]/40',
              },
              {
                icon: '♫',
                title: 'Transpose Instantly',
                description: 'Change keys without changing numbers. 1-5-1 works in C, G, or any other key.',
                bg: 'bg-[#06b6d4]/20',
                border: 'border-[#06b6d4]/40',
              },
              {
                icon: '🏠',
                title: 'See Patterns Clearly',
                description: 'Recognize chord progressions and melodies instantly. Numbers reveal harmonic patterns.',
                bg: 'bg-[#a855f7]/20',
                border: 'border-[#a855f7]/40',
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className={`bg-[#0f172a]/50 border ${card.border} rounded-xl p-6 hover:border-[#cbd5e1]/50 transition-colors`}
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {card.title}
                </h3>
                <p className="text-[#94a3b8]">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Any Key: 1 = Your Tonic */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-3xl">🏠</span>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Any Key: 1 = Your Tonic
            </h2>
          </div>
          <p className="text-[#94a3b8] mb-8 max-w-3xl">
            In the Motesart Number System, the home note (tonic) is always 1. The other notes in the key follow the W-W-H-W-W-W-H pattern (whole and half steps). This means the same chord progression works in every key using the same numbers.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KEY_DATA.map((key) => (
              <div
                key={key.tonic}
                className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-6 hover:border-[#cbd5e1]/30 transition-colors"
              >
                <h3 className="text-lg font-bold mb-4 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  1 = {key.tonic}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <div key={num} className="flex flex-col items-center">
                        <div
                          className="text-lg font-bold mb-1"
                          style={{ color: COLOR_MAP[num] }}
                        >
                          {num}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#64748b]">
                    {key.notes.map((note) => (
                      <div key={note} className="text-center">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common Progressions */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-3xl">↗</span>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Common Progressions
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRESSIONS.map((prog) => (
              <div
                key={prog.name}
                className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-6 hover:border-[#cbd5e1]/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#64748b] text-sm">{prog.roman}</span>
                  <span className="text-[#cbd5e1]">→</span>
                  <span className="text-[#a855f7] font-bold text-lg">{prog.motesart}</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {prog.name}
                </h3>
                <p className="text-[#94a3b8] text-sm">
                  Example: <span className="text-white">{prog.examples}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Half Numbers (Chromatic Tones) */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Half Numbers (Chromatic Tones)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { num: '1½', desc: 'Between 1 and 2', sub: 'b2/#1' },
              { num: '2½', desc: 'Between 2 and 3', sub: 'b3/#2' },
              { num: '4½', desc: 'Between 4 and 5', sub: 'b5/#4' },
              { num: '5½', desc: 'Between 5 and 6', sub: 'b6/#5' },
              { num: '6½', desc: 'Between 6 and 7', sub: 'b7/#6' },
            ].map((h) => (
              <div
                key={h.num}
                className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-6 text-center hover:border-[#cbd5e1]/30 transition-colors"
              >
                <div className="text-3xl font-bold text-[#f97316] mb-2">{h.num}</div>
                <p className="text-[#94a3b8] text-sm mb-1">{h.desc}</p>
                <p className="text-[#64748b] text-xs">{h.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Extensions & Tensions */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Extensions &amp; Tensions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { base: '2', sup: '⁹', desc: 'Second, one octave higher' },
              { base: '4', sup: '¹¹', desc: 'Fourth, one octave higher' },
              { base: '6', sup: '¹³', desc: 'Sixth, one octave higher' },
            ].map((ext) => (
              <div
                key={ext.base}
                className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-6 hover:border-[#cbd5e1]/30 transition-colors text-center"
              >
                <div className="text-5xl font-bold text-[#06b6d4] mb-2">
                  {ext.base}
                  <span className="text-[#a855f7] text-3xl">{ext.sup}</span>
                </div>
                <p className="text-[#94a3b8]">{ext.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Inversions & Slash Rule */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Inversions &amp; Slash Rule
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {[
              { notation: '1/3', desc: 'Third in bass, 1 chord' },
              { notation: '1/5', desc: 'Fifth in bass, 1 chord' },
              { notation: '1/7', desc: 'Seventh in bass, 1 chord' },
            ].map((inv) => (
              <div
                key={inv.notation}
                className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-6 hover:border-[#cbd5e1]/30 transition-colors text-center"
              >
                <div className="text-4xl font-bold text-[#6366f1] mb-2">{inv.notation}</div>
                <p className="text-[#94a3b8]">{inv.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-4">
            <p className="text-[#cbd5e1] text-sm">
              <strong>Format:</strong> <span className="text-[#6366f1] font-mono">bass/chord</span> — the bass note comes first. Use slash notation to specify which note plays in the bass.
            </p>
          </div>
        </section>

        {/* Symbol Quick Reference */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Symbol Quick Reference
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { symbol: 'm', meaning: 'Minor chord' },
              { symbol: 'M', meaning: 'Non-diatonic major' },
              { symbol: '+', meaning: 'Augmented' },
              { symbol: '°', meaning: 'Diminished' },
              { symbol: 'ø⁷', meaning: 'Half-diminished' },
              { symbol: 'sus²', meaning: 'Suspended 2' },
              { symbol: 'sus⁴', meaning: 'Suspended 4' },
              { symbol: '⁷', meaning: 'Seventh' },
              { symbol: '/X', meaning: 'Bass note' },
              { symbol: '½', meaning: 'Chromatic tone' },
              { symbol: '²', meaning: 'Inversion marker' },
              { symbol: '⁹ ¹¹ ¹³', meaning: 'Extensions' },
            ].map((s) => (
              <div
                key={s.symbol}
                className="bg-[#0f172a]/50 border border-[#1e293b] rounded-xl p-4 hover:border-[#cbd5e1]/30 transition-colors"
              >
                <div className="text-2xl font-bold text-[#06b6d4] mb-2 font-mono">{s.symbol}</div>
                <p className="text-[#94a3b8] text-sm">{s.meaning}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to Convert Your Music?
          </h2>
          <p className="text-[#94a3b8] mb-8 max-w-xl mx-auto">
            Start converting chords and melodies to the Motesart Number System right now.
          </p>
          <Link
            href="/converter"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#a855f7] text-white font-bold hover:shadow-lg hover:shadow-[#06b6d4]/50 transition-all"
          >
            Go to Converter
            <span>→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
