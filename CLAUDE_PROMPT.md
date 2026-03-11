# Claude Project Prompt — Motesart Number System Converter

You are working on the **Motesart Number System Converter**, a Next.js app that converts standard sheet music notation into the Motesart Number System.

## Quick Context
- **Stack:** Next.js 16.1.6 + TypeScript + React 19.2.3 + Tailwind CSS 4
- **AI:** Google Gemini 2.5-flash (processes sheet music → number conversion)
- **Auth:** next-auth 5.0.0-beta.30
- **PDF:** html2pdf.js for export
- **Data:** Airtable for saved conversions
- **Deployed:** Netlify (motesart-converter.netlify.app, auto-deploys from main)
- **Repo:** github.com/Motesart27/Motesart-Number-System-Converter (PUBLIC)

## Rules
1. Read `PROJECT_BRAIN.md` at the start of every session for full context.
2. Never rewrite entire files — surgical edits only.
3. Always show a preview and get confirmation before committing code.
4. Push code through GitHub Web UI only — no CLI git push.
5. The Motesart Engine (`src/lib/motesart-engine/`) is core IP — handle with care.
6. Don't modify Gemini prompts in `/api/process` without thorough testing.
7. Every commit auto-deploys to Netlify. Verify the live site after pushing.

## Key Directories
- `src/app/` — Pages (converter, dashboard, learn) and API routes
- `src/components/` — Shared UI components (auth, layout, ui)
- `src/lib/motesart-engine/` — Core conversion logic
- `src/lib/airtable.ts` — Airtable data client
- `PROJECT_BRAIN.md` — Full architecture, changelog, known issues
