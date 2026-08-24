# School of Motesart Canonical Method Contract v1.0

Status: Founder-confirmed baseline for implementation. This document is the canonical method authority for converter-visible grammar and machine teaching metadata until superseded by a later founder-approved version.

## Visible degree grammar

- Student-visible scale degrees are `1` through `7`.
- Legal upward half-numbers are exactly `1½`, `2½`, `4½`, `5½`, `6½`.
- `3½` and `7½` are forbidden.
- In the basic major-key teaching framework, `2` and `6` carry the expected minor quality; `1`, `3`, `4`, `5`, and `7` carry their founder-defined expected family/quality behavior.
- Bare numbers use the canonical Motesart quality expected at that degree.
- `M` and `m` are exception markers only when actual chord quality differs from the expected quality at that degree.
  - Normal minor 2: `2`
  - Major 2: `2M`
  - Normal major 4: `4`
  - Minor 4: `4m`
- Dominant seventh uses superscript `⁷`, e.g. `5⁷`, `1⁷`.
- Minor-key songs keep the minor tonic as `1`.

## Family metadata

Student-facing `3` and `7` remain visually simple. Family/inversion intelligence belongs in machine-readable metadata.

Minimum canonical family metadata:

```json
{
  "3": {"family": "1"},
  "7": {"family": "5"}
}
```

This metadata must not force extra visible notation into student charts.

## Source preservation and ambiguity

Pipeline:

`source material -> preserved musical representation -> canonical Motesart translation -> validation -> teaching metadata -> approved student display`

The converter is a translation engine, not the source of doctrine.

It must never silently simplify, guess, flatten harmony, or convert ambiguity into certainty.

Canonical source states:

- `valid`
- `valid_source_ambiguous`
- `invalid`

`valid_source_ambiguous` preserves the source text/structure and requires teacher review. It is neither silently normalized nor automatically rejected.

## Branding gate

Every converter-produced chart, PDF, preview, handout, export, or attachment intended for review or delivery must use the official Motesart Converter logo and attribution `Motesart Technologies`.

A converter artifact is not student-ready or golden-fixture-complete if official branding is missing.

## Fail-closed rules

- Forbidden degrees must never appear in successful canonical output.
- Unsupported harmony kinds must not be silently approximated to a simpler legal chord.
- Invalid canonical output must fail closed; it must not be returned as a successful conversion.
- `kind="none"` must never be rewritten as the root degree. Exact no-chord spelling remains pending founder decision.

## Pending founder-decided display details

These items remain intentionally unresolved and must not be guessed in code:

- Exact no-chord token spelling.
- Exact canonical printed forms for advanced seventh/extension cases beyond the founder-confirmed forms.
- Any additional display conventions not present in the controlling master key or later founder amendment.

## Governance

Historical lessons and historical converter outputs remain evidence and must not be silently rewritten. Current production behavior must point to this methodology version (or a later founder-approved successor) so curriculum, converter, practice assets, teaching metadata, analytics, and golden fixtures share one authority.
