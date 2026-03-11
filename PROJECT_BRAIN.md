# PROJECT BRAIN — Motesart Number System Converter
> **Last Updated:** 2026-03-11
> **Stable Version:** v0.1.0
> **Status:** Production — Live on Netlify
> **Owner:** Denarius Motes (@Motesart27)

---

## 1. TECH STACK

### Frontend & Backend (Full-Stack Next.js)
- **Framework:** Next.js 16.1.6 (App Router, TypeScript)
- **React:** 19.2.3
- **Styling:** Tailwind CSS 4
- **Auth:** next-auth 5.0.0-beta.30
- **PDF Export:** html2pdf.js 0.14.0
- **Icons:** lucide-react 0.577.0
- **Testing:** Jest 30.2.0 + ts-jest 29.4.6
- **Linting:** ESLint 9 + eslint-config-next 16.1.6
- **Build:** Next.js → deployed as SSR on Netlify
- **Deployed on:** Netlify (motesart-converter.netlify.app)
- **Repo:** github.com/Motesart27/Motesart-Number-System-Converter (PUBLIC)

### External Services
- **Google Gemini AI** (gemini-2.5-flash) — Powers sheet music → number conversion
- **Airtable** — Data storage (via `src/lib/airtable.ts`)
- **Netlify** — Hosting with auto-deploy from main branch
- **next-auth** — Authentication (Google/GitHub OAuth or similar)

### Environment Variables (Netlify)
| Variable | Purpose |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API access (likely) |
| `AIRTABLE_API_KEY` | Airtable data access |
| `NEXTAUTH_SECRET` | next-auth session encryption |
| `NEXTAUTH_URL` | Auth callback URL |

> Note: Exact env var names should be verified in Netlify dashboard or `.env.local`.

---

## 2. ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│            FULL-STACK NEXT.JS (App Router)            │
│              Netlify: motesart-converter               │
│                                                       │
│  src/app/ (Pages)      src/components/  src/lib/      │
│  ├─ page.tsx (Landing) ├─ auth/        ├─ motesart-   │
│  ├─ converter/         ├─ layout/      │  engine/     │
│  ├─ dashboard/         └─ ui/          └─ airtable.ts│
│  ├─ learn/                                            │
│  ├─ auth/signin/       src/auth.ts (config)           │
│  │                                                    │
│  ├─ api/ (Route Handlers)                             │
│  │  ├─ analytics/      — Usage tracking               │
│  │  ├─ auth/[...nextauth]/ — Auth endpoints           │
│  │  ├─ chat/           — AI chat endpoint             │
│  │  ├─ conversions/    — Saved conversion records     │
│  │  ├─ convert/        — Core conversion endpoint     │
│  │  ├─ logo/           — Logo proxy for PDF CORS      │
│  │  └─ process/        — Gemini AI processing         │
│  │                                                    │
│  ├─ globals.css                                       │
│  ├─ layout.tsx                                        │
│  └─ providers.tsx                                     │
└──────────────────────┬────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Gemini   │  │ Airtable │  │ next-auth│
   │ 2.5-flash│  │ (data)   │  │ (auth)   │
   └──────────┘  └──────────┘  └──────────┘
```

### Data Flow
1. **User opens app** → Next.js SSR renders landing page → Auth check via next-auth
2. **Sign in** → `/auth/signin` → next-auth OAuth flow → session established
3. **Upload sheet music** → User provides sheet music input on `/converter` page
4. **AI Processing** → `/api/process` → Gemini 2.5-flash API → converts standard notation to Motesart Number System
5. **Chord alignment** → Gemini prompt engineered for exact chord-over-word alignment
6. **PDF Export** → Converted result → `html2pdf.js` generates downloadable PDF (logo proxied via `/api/logo` for CORS)
7. **Save conversions** → `/api/conversions` → stored in Airtable
8. **Dashboard** → `/dashboard` → displays saved conversions and analytics
9. **Learn** → `/learn` → educational content about the number system

### Route Map
| Path | Page | Access |
|---|---|---|
| `/` | Landing Page | Public |
| `/auth/signin` | Sign In | Public |
| `/converter` | Converter Tool | Authenticated |
| `/dashboard` | User Dashboard | Authenticated |
| `/learn` | Learning Resources | Public |

### API Route Map
| Path | Purpose |
|---|---|
| `/api/auth/[...nextauth]` | Authentication endpoints |
| `/api/process` | Gemini AI sheet music processing |
| `/api/convert` | Core conversion logic |
| `/api/chat` | AI chat endpoint |
| `/api/conversions` | CRUD for saved conversions |
| `/api/analytics` | Usage tracking |
| `/api/logo` | Logo image proxy (CORS fix for PDF export) |

### Core Engine
- `src/lib/motesart-engine/` — The Motesart Number System conversion logic
- Maps standard Western music notation to a numbered system
- Handles chord-over-word alignment for vocal music

---

## 3. WHAT'S BUILT — LOCKED IN

> These features are working in production. Surgical edits only.

### Core Platform
- [x] **Sheet music → Number System conversion** — Core feature powered by Gemini AI
- [x] **Chord-over-word alignment** — Precise positioning of chord numbers above lyrics
- [x] **PDF export** — html2pdf.js with CORS-friendly logo proxy
- [x] **Authentication** — next-auth with OAuth sign-in flow
- [x] **User dashboard** — Saved conversions and history
- [x] **Learning page** — Educational content about the Motesart Number System
- [x] **Airtable integration** — Conversion storage and analytics
- [x] **Gemini 2.5-flash integration** — Upgraded from 2.0-flash for better results

---

## 4. DEVELOPMENT RULES

> These rules apply to every AI session working on this project.

### Code Workflow Rules
1. **Visual approval before code** — Always show a rendered preview and get explicit user confirmation before committing. HIGH PRIORITY.
2. **GitHub Web UI only for pushing** — All code pushes go through the GitHub web editor. No CLI git push.
3. **Read live file before editing** — Always fetch the current file from GitHub before making changes. Never edit from memory.
4. **Surgical edits only** — Make the smallest possible change. Don't rewrite entire files.
5. **No silent dependency changes** — Never add, remove, or upgrade packages without explicit approval.
6. **CodeMirror editor access** — GitHub's editor uses: `document.querySelector('.cm-content').cmTile.view` (property is `cmTile`, NOT `cmView`)

### Protection Rules
7. **Never rewrite locked features** — Anything marked "LOCKED IN" in Section 3 must not be rebuilt.
8. **Test after deploy** — Netlify auto-deploys from main. Always verify the live site after committing.
9. **Motesart Engine is core IP** — The `src/lib/motesart-engine/` directory contains the proprietary conversion logic. Handle with care.

### App-Specific Rules
10. **Gemini prompt engineering** — The `/api/process` route contains carefully tuned prompts for chord alignment. Don't modify without testing.
11. **PDF font sizes** — Font sizes were increased in the latest update (Mar 10). Verify PDF output after any layout changes.
12. **Logo CORS proxy** — The `/api/logo` route exists specifically for PDF export. Don't remove it.

---

## 5. CHANGELOG

> Update this section at the end of every productive session.

### 2026-03-11 — Project Brain Added
**Changes:**
- Added PROJECT_BRAIN.md for AI session continuity
- Added snapshot.py for automated project state generation
- Added CLAUDE_PROMPT.md for Claude Project system instructions

**Result:** AI sessions now have full project context on startup.

---

### 2026-03-10 — PDF Font Sizes & Gemini Prompt
**Changes:**
- Increased all PDF export font sizes for better readability
- Improved Gemini prompt for exact chord-over-word alignment

**Files Modified:**
- `src/app/dashboard/` (PDF export sizing)
- `src/app/api/process/` (Gemini prompt tuning)

---

### 2026-03-04 — Initial Release
**Changes:**
- Full Next.js app with converter, dashboard, learn pages
- Gemini AI integration (started with 2.0-flash, upgraded to 2.5-flash)
- next-auth authentication
- Airtable data storage
- PDF export with html2pdf.js
- Logo CORS proxy for PDF rendering

**Result:** Motesart Number System Converter fully operational on Netlify.

---

## 6. KNOWN ISSUES & UNFINISHED WORK

### Open Items
- [ ] **Verify env vars in Netlify** — Exact environment variable names need confirmation.
- [ ] **Airtable schema not documented** — Table names and field patterns for this app need mapping.
- [ ] **No test coverage running in CI** — Jest is configured but tests may not run on deploy.
- [ ] **next-auth beta** — Using 5.0.0-beta.30 which may have breaking changes on update.

### Resolved
- [x] PDF export blank page issue — Fixed Mar 4, 2026 (logo CORS proxy)
- [x] Gemini model upgrade — Switched from 2.0-flash to 2.5-flash (Mar 4, 2026)
- [x] PDF font too small — Increased font sizes (Mar 10, 2026)
- [x] Chord alignment imprecise — Improved Gemini prompt (Mar 10, 2026)

---

> **NEXT SESSION STARTS HERE** — Read this file first. Check the changelog and Known Issues above. You know the stack, the rules, and what's locked in. Get to work.
