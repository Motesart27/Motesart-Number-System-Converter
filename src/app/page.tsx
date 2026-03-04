'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import FireflyCanvas from '@/components/ui/FireflyCanvas';

const MOTESART_LOGO = "https://customer-assets.emergentagent.com/job_music-to-numbers/artifacts/eqmmw6fl_2316F097-7806-4D1F-AB36-BB5FF560800D.png";
const STUDIO_IMG = "https://images.unsplash.com/photo-1714123710240-974b15c86409?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxtdXNpY2lhbiUyMHByb2R1Y2luZyUyMG11c2ljJTIwaW4lMjBkYXJrJTIwc3R1ZGlvfGVufDB8fHx8MTc2ODU0MjE2NXww&ixlib=rb-4.1.0&q=85";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-[#94a3b8]">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        {/* FireflyCanvas Background */}
        <div className="absolute inset-0 z-0">
          <FireflyCanvas />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-transparent z-5" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-5" />
        <div className="absolute top-0 inset-x-0 h-1/4 bg-gradient-to-b from-[#020617] via-transparent to-transparent z-5" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* LEFT: Hero Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30">
                <svg className="w-4 h-4 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-sm text-[#cbd5e1]">AI-Powered Music Analysis</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                See Your Sheet Music in{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#06b6d4]">Numbers</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-[#94a3b8] max-w-lg leading-relaxed">
                Upload your sheet music and see it instantly in the Motesart Number System. Visualize chords, detect progressions, and transpose to any key in seconds.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/converter" className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e3] text-white rounded-full px-8 py-4 text-lg font-medium transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Sheet Music
                </Link>
                <Link href="/learn" className="inline-flex items-center gap-2 border border-[#1e293b] hover:border-[#6366f1]/50 hover:bg-[#1e293b]/30 text-[#cbd5e1] rounded-full px-8 py-4 text-lg font-medium transition-colors">
                  Learn More
                </Link>
              </div>
            </div>

            {/* RIGHT: Preview Card */}
            <div className="hidden lg:block">
              <div className="rounded-2xl p-8 backdrop-blur-xl bg-white/5 border border-[#1e293b] space-y-6">
                {/* Preview Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#94a3b8]">Live Preview</span>
                  <span className="text-sm font-['JetBrains_Mono'] text-[#6366f1]">1 = Eb</span>
                </div>

                {/* Measure M1 */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1e293b]/50 border border-[#1e293b]">
                  <span className="text-[#64748b] text-sm font-['JetBrains_Mono'] w-12">M1</span>
                  <div className="flex gap-2 font-['JetBrains_Mono'] text-xl">
                    <span className="text-[#06b6d4]">1</span>
                    <span className="text-[#94a3b8]">-</span>
                    <span className="text-[#06b6d4]">5</span>
                    <span className="text-[#94a3b8]">-</span>
                    <span className="text-[#06b6d4]">6</span>
                    <span className="text-[#94a3b8]">-</span>
                    <span className="text-[#06b6d4]">4</span>
                  </div>
                  <span className="ml-auto text-xs font-['JetBrains_Mono'] text-[#6366f1] px-3 py-1 rounded-full bg-[#6366f1]/20">1-5-6-4</span>
                </div>

                {/* Measure M2 */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1e293b]/50 border border-[#1e293b]">
                  <span className="text-[#64748b] text-sm font-['JetBrains_Mono'] w-12">M2</span>
                  <div className="flex gap-2 font-['JetBrains_Mono'] text-xl">
                    <span className="text-[#a855f7]">2m⁷</span>
                    <span className="text-[#94a3b8]">-</span>
                    <span className="text-[#a855f7]">5⁷</span>
                    <span className="text-[#94a3b8]">-</span>
                    <span className="text-[#a855f7]">1M⁷</span>
                  </div>
                  <span className="ml-auto text-xs font-['JetBrains_Mono'] text-[#4ade80] px-3 py-1 rounded-full bg-[#4ade80]/20">2-5-1</span>
                </div>

                {/* Measure M3 */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1e293b]/50 border border-[#1e293b]">
                  <span className="text-[#64748b] text-sm font-['JetBrains_Mono'] w-12">M3</span>
                  <div className="flex gap-2 font-['JetBrains_Mono'] text-xl">
                    <span className="text-[#06b6d4]">1</span>
                    <span className="text-[#64748b]">/</span>
                    <span className="text-[#ec4899]">3</span>
                    <span className="text-[#94a3b8]">-</span>
                    <span className="text-[#06b6d4]">4</span>
                    <span className="text-[#94a3b8]">-</span>
                    <span className="text-[#f97316]">2½</span>
                  </div>
                  <span className="ml-auto text-xs font-['JetBrains_Mono'] text-[#f97316] px-3 py-1 rounded-full bg-[#f97316]/20">passing</span>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 pt-4 border-t border-[#1e293b]">
                  <div className="text-center flex-1">
                    <div className="text-sm font-['JetBrains_Mono'] text-white">1 = C</div>
                    <div className="text-xs text-[#64748b]">Reference</div>
                  </div>
                  <div className="w-px h-8 bg-[#1e293b]" />
                  <div className="text-center flex-1">
                    <div className="text-sm font-['JetBrains_Mono'] text-[#6366f1]">2-5-1</div>
                    <div className="text-xs text-[#64748b]">Progression</div>
                  </div>
                  <div className="w-px h-8 bg-[#1e293b]" />
                  <div className="text-center flex-1">
                    <div className="text-sm font-['JetBrains_Mono'] text-[#f97316]">1½</div>
                    <div className="text-xs text-[#64748b]">Chromatic</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learn More Section */}
      <section className="py-24 px-6 bg-[#0f172a]/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Learn More</h2>
            <p className="text-[#94a3b8] text-lg">Quick answers about the Motesart methodology</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: What is Motesart? */}
            <div className="rounded-xl p-8 border border-[#1e293b] bg-[#0f172a]/40 hover:border-[#6366f1]/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#6366f1]/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>What is Motesart?</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">A numbers-first music language: each note becomes a scale degree (1–7) so you can hear, play, and transpose faster than with letters alone.</p>
            </div>

            {/* Card 2: How do we convert? */}
            <div className="rounded-xl p-8 border border-[#1e293b] bg-[#0f172a]/40 hover:border-[#06b6d4]/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#06b6d4]/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#06b6d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>How do we convert?</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">We read the key, chords, and notes from your sheet music, then translate every pitch into a number and every chord into its function.</p>
            </div>

            {/* Card 3: What do symbols mean? */}
            <div className="rounded-xl p-8 border border-[#1e293b] bg-[#0f172a]/40 hover:border-[#a855f7]/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#a855f7]/20 flex items-center justify-center mb-6">
                <span className="font-['JetBrains_Mono'] text-lg text-[#a855f7]">½</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>What do symbols mean?</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed"><span className="font-['JetBrains_Mono'] text-[#06b6d4]">½</span> = chromatic up, <span className="font-['JetBrains_Mono'] text-[#ec4899]">/3</span> = 3rd in bass, <span className="font-['JetBrains_Mono']">m</span> = minor, <span className="font-['JetBrains_Mono']">M</span> = major, <span className="font-['JetBrains_Mono']">⁷</span> = seventh.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/learn" className="inline-flex items-center gap-2 text-[#6366f1] hover:text-[#818cf8] transition-colors font-medium">
              View Motesart Key
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>How It Works</h2>
            <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">Three simple steps to transform your sheet music into numbers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1: Upload */}
            <div className="relative p-8 rounded-xl border border-[#1e293b] bg-[#0f172a]/40 hover:border-[#6366f1]/50 transition-colors">
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center font-bold text-sm text-white">1</div>
              <div className="w-12 h-12 rounded-lg bg-[#6366f1]/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Upload Sheet Music</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">Drag and drop your sheet music (PDF or image). Also supports MusicXML and MIDI from DAWs and notation software.</p>
            </div>

            {/* Step 2: Auto-Analyze */}
            <div className="relative p-8 rounded-xl border border-[#1e293b] bg-[#0f172a]/40 hover:border-[#06b6d4]/50 transition-colors">
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#06b6d4] flex items-center justify-center font-bold text-sm text-[#020617]">2</div>
              <div className="w-12 h-12 rounded-lg bg-[#06b6d4]/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#06b6d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Auto-Analyze</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">Key detection, chord recognition, and progression analysis happen automatically with AI assistance.</p>
            </div>

            {/* Step 3: Export */}
            <div className="relative p-8 rounded-xl border border-[#1e293b] bg-[#0f172a]/40 hover:border-[#a855f7]/50 transition-colors">
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#a855f7] flex items-center justify-center font-bold text-sm text-white">3</div>
              <div className="w-12 h-12 rounded-lg bg-[#a855f7]/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Export &amp; Share</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">Export to PDF, CSV for Airtable, or print. Perfect for lessons, practice, and study with students, bands, and choirs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* See Music Differently Section */}
      <section className="py-24 px-6 bg-[#0f172a]/20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT: Comparison Table */}
          <div className="space-y-8">
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              See Music <span className="text-[#06b6d4]">Differently</span>
            </h2>
            <p className="text-[#94a3b8] text-lg leading-relaxed">Same music. New language. Traditional notation on the left; Motesart numbers on the right. The universal number system makes patterns obvious and transposition instant.</p>

            {/* Comparison Table */}
            <div className="grid grid-cols-2 gap-6 p-6 rounded-xl bg-[#1e293b]/30 border border-[#1e293b]">
              <div className="text-center">
                <div className="text-xs font-bold text-[#64748b] uppercase tracking-widest mb-4">Traditional</div>
                <div className="space-y-2">
                  <div className="font-['JetBrains_Mono'] text-lg text-[#cbd5e1]">C - G - Am - F</div>
                  <div className="text-xs text-[#64748b]">Key of C</div>
                </div>
              </div>
              <div className="text-center border-l border-[#334155]">
                <div className="text-xs font-bold text-[#64748b] uppercase tracking-widest mb-4">Motesart</div>
                <div className="space-y-2">
                  <div className="font-['JetBrains_Mono'] text-lg">
                    <span className="text-[#06b6d4]">1</span><span className="text-[#64748b]"> - </span>
                    <span className="text-[#06b6d4]">5</span><span className="text-[#64748b]"> - </span>
                    <span className="text-[#a855f7]">6m</span><span className="text-[#64748b]"> - </span>
                    <span className="text-[#06b6d4]">4</span>
                  </div>
                  <div className="text-xs text-[#6366f1] font-['JetBrains_Mono']">1 = C</div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-[#6366f1]">1</span>
                </div>
                <span className="text-[#cbd5e1]">Numbers 1-7 represent major scale degrees</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#06b6d4]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-['JetBrains_Mono'] text-[#06b6d4]">½</span>
                </div>
                <span className="text-[#cbd5e1]">Half-numbers (1½, 2½, etc.) for chromatic tones</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#a855f7]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-[#a855f7]">/</span>
                </div>
                <span className="text-[#cbd5e1]">Slash notation shows bass inversions (1/3, 5/7)</span>
              </li>
            </ul>
          </div>

          {/* RIGHT: Studio Image */}
          <div className="relative rounded-2xl overflow-hidden h-96">
            <img src={STUDIO_IMG} alt="Musician in studio" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/5 border border-[#1e293b] text-center">
            <h2 className="text-4xl font-extrabold mb-6 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Ready to Transform Your Music?</h2>
            <p className="text-[#94a3b8] text-lg mb-8 max-w-xl mx-auto">Join musicians and teachers using the Motesart Number System for faster learning and deeper understanding.</p>
            <Link href="/converter" className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e3] text-white rounded-full px-10 py-4 text-lg font-medium transition-colors">
              Upload Sheet Music
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#1e293b]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={MOTESART_LOGO} alt="Motesart" className="w-8 h-8 rounded object-cover" />
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm">Motesart</span>
                <span className="text-[#64748b] text-xs">Built for musicians, by musicians. Part of the T.A.M.i ecosystem.</span>
              </div>
            </div>
            <p className="text-[#64748b] text-sm">Copyright 2026 Motesart Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
