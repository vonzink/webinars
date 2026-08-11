# slides/

70 slides + 3 demo fallbacks. One file per slide.

**Format spec:** `../prompts/03-slide-generator.md`
**Every number traces to:** `../references/canonical-example.md`

---

## Index

| Range | Module | Time | Hero slides |
|---|---|---|---|
| 001–007 | 1 — Cold open & promise | 0:00–2:30 | 005 |
| 008–016 | 2 — The process | 2:30–7:00 | 010 |
| 017–029 | 3 — What can you afford | 7:00–13:00 | **022**, 019 |
| 030–039 | 4 — Down payment & programs | 13:00–18:00 | **032** |
| 040–051 | 5 — Rates, APR & buydowns | 18:00–24:30 | 045, 049, **051** |
| 052–060 | 6 — The Loan Estimate | 24:30–30:00 | **056**, 059 |
| 061–064 | 7 — Credit | 30:00–33:30 | **064** |
| 065–067 | 8 — Builder vs existing | 33:30–36:00 | **067** |
| 068–069 | 9 — The 9 mistakes | 36:00–38:30 | 069 |
| 070 | 10 — Close | 38:30–40:00 | 070 |

**Fallbacks:** `027-fallback` · `047-fallback` · `051-fallback`

---

## The three emotional-beat slides

**001 · 019 · 069** — near-black, one line of text, **no branding, no footer, no
progress indicator.**

The absence of branding is deliberate and recorded in
`../versions/v4/CHANGELOG.md`. A logo in the corner of 069 would turn the webinar's
most sincere moment into an ad.

---

## Compression and expansion

| Marker | Slide | Saves |
|---|---|---|
| `[CUT-1]` | 046 | 0:30 |
| `[CUT-2]` | 037 | 0:25 |
| `[CUT-3]` | 026 | 0:30 |
| `[CUT-4]` | 050 | 0:35 |
| `[CUT-5]` | 015 | 0:25 |

**Never cut a story, a demo, or an artifact.**

| Marker | Slide | Adds |
|---|---|---|
| `[EXP-1]` | 025 | Walk the DTI arithmetic |
| `[EXP-2]` | 056 | Read a Loan Estimate line by line |
| `[EXP-3]` | 038 | Full DPA tour |

---

## Checkpoint slides ⏱

**008 (2:30) · 017 (7:00) · 030 (13:00) · 040 (18:00) · 052 (24:30) · 061 (30:00)**

Times are printed on the slide. More than 30 seconds off, correct immediately —
don't plan to make it up.

---

## Editing rules

1. **Every number comes from `../references/canonical-example.md`.** If you need one
   that isn't there, add it *to that file first*, then audit what else it affects.
2. **Any slide with a rate, payment, or cost carries the hypothetical label
   on-slide** — not just in the notes. It is not decoration and it may not be removed
   to clean up a layout.
3. **Headlines are claims, not labels.** "APR isn't your interest rate," not
   "Understanding APR."
4. **One slide, one idea.**
5. **Speaker notes say numbers out loud.** Half the audience is on the replay.
6. **Transitions are required.** A slide without one turns the deck into a list.
7. **Recurring graphics are pixel-identical.** See `../diagrams/README.md`.

---

## Before delivery

- [ ] `[NMLS #______]` filled on 001 and 070 — **BLOCKER**
- [ ] All 🔴 VERIFY flags cleared — `../prompts/06-fact-check.md`
- [ ] Compliance pass — `../prompts/05-compliance-review.md`
- [ ] Design pass — `../prompts/04-design-review.md`
- [ ] All three fallback slides match current calculator output
- [ ] Sample Loan Estimates use fabricated data and are watermarked SAMPLE
