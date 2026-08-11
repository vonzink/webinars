# v4 — LOCKED. This is the shipping version.

The live outline is `outline/00-master-outline.md` plus `outline/01`–`10`.
This file records what changed and why, so future edits don't undo hard-won
decisions.

## Lineage

- **v1** — topic-ordered draft. Rejected: it was a table of contents.
- **v2** — reordered around the four buyer fears; stories, polls, embedded demos.
- **v3** — canonical example, portable artifacts, named objections, tiered CTA.
- **v4** — production hardening: compression points, demo fallbacks, Colorado
  depth, sourced statistics, replay/accessibility plan, distributed mistakes,
  presenter failure modes.

## Decisions that must not be reverted

1. **One canonical example throughout.** $450,000 / 5% down / $427,500 / 30-yr
   fixed / hypothetical 6.500%. Never introduce a second house. See
   `references/canonical-example.md`. Changing this breaks 30+ slides.
2. **Calculators appear during teaching, never as a closing pitch.**
3. **The unconditional CTA stays.** Free Loan Estimate review for anyone, from any
   lender, with no obligation. It is the proof of the entire thesis. If it is ever
   cut, the webinar becomes the thing it was built to replace.
4. **No urgency language.** No "rates are going up." No countdown. No scarcity.
   Slide 5 promises this out loud, which means breaking it is visible.
5. **Every module ends in a portable artifact.**
6. **Objections that cut against my own interest stay in** (renting can be right;
   the builder's lender sometimes genuinely wins).

## Known open items before first delivery

- [ ] NMLS IDs (individual + company) — placeholders `[NMLS #______]` throughout
- [ ] Confirm CHFA program terms and current DPA availability on delivery date
- [ ] Run `prompts/06-fact-check.md` — all `VERIFY` flags in `research/`
- [ ] Compliance sign-off — `prompts/05-compliance-review.md`
- [ ] Record calculator demo fallback screenshots into `images/`
- [ ] Build the 5 PDFs from `downloads/*.html`
