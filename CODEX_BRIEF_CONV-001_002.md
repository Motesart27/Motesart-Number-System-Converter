# CODEX BRIEF CONV-001/002

Status: Executable only with `BRIEF_AMENDMENT_A1_CONV-001_002.md`.
Baseline: `378c45f`.

## Objective

Harden the existing server-side Airtable concept-state integration without changing its route contract, and allow the School of Motesart production origin through the existing CORS helper.

## Approved implementation scope

- `src/lib/airtable-client.ts`
- `src/lib/concept-state-server-store.ts`
- `src/app/api/concept-state/[studentInstrumentId]/[conceptId]/route.ts`
- `src/lib/cors.ts`

## Approved changes

1. In `getConfig()`, remove surrounding whitespace and leading `=` characters from the two existing Airtable environment values before validating and using them.
2. Escape double quotes in the Airtable formula parameters used by `getState` and `setState`.
3. Preserve the concept-state route contract.
4. Add the School of Motesart production site to `ALLOWED_ORIGINS`.

## Prohibited changes

No frontend, authentication, health-route, OMR, audio, environment-variable rename, dependency, or unrelated integration changes. Do not expose environment values or Airtable error bodies. Do not use `git add -A`.

## Verification

- Run the production build locally.
- Perform at most one production deploy, with a cleared build cache, after the credential gate has passed.
- Probe an unknown concept-state ID.
- Seed `verify_smoke_001` only through the approved API path and verify the concept-state round trip.
- Verify browser CORS behavior from the School of Motesart production origin.
- Follow all stop conditions and deployment rules in Amendment A1.

## Rollback

Restore Netlify deploy `69c4cf794b9a1c000825d517` if the single production deployment must be rolled back.
