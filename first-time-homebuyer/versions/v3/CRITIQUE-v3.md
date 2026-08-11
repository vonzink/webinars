# Critique Pass 3 — against v3

Reviewer lens: *"Assume this ships. Where does it actually break in a live room?"*

v3 = v2 + canonical example + portable artifacts + named objections + 3 AMA
breaks + tiered CTA. It is good. These are the remaining production-level defects.

### Defect 1 — The timing does not survive contact with a live audience

70 slides in 40:00 is 34 seconds per slide *with zero slippage*. Live demos always
run long. A single good chat question eats 90 seconds.

**Fix:** Build the deck with declared **compression points** — pre-designated
material that can be dropped live without breaking continuity, and pre-designated
expansion material if running early. Marked `[CUT-1]` … `[CUT-5]` and `[EXP-1]` …
`[EXP-3]` in the slide files. Also: a hard checkpoint time printed on 5 slides
(the "you should be here at ___" marker) so recovery is possible mid-stream.

### Defect 2 — The three live calculator demos are three single points of failure

If the calculator doesn't load, three of the strongest moments die on stage.

**Fix:** Every demo gets a static fallback slide with the finished output
pre-rendered, plus a scripted line to bridge. Documented per demo in `resources/`.

### Defect 3 — Colorado specificity is asserted but thin

The audience is Colorado. v3 mentions CHFA once. That is a missed differentiator —
statewide and metro DPA programs are exactly the information first-time buyers
cannot find and cannot evaluate.

**Fix:** Dedicated CHFA/DPA research file and a full slide, framed as a landscape
(state / metro / county / employer-based), with the honest caveat that program
terms and funding change and must be verified on the date of use.

### Defect 4 — Statistics are used as decoration

Numbers cited without source and date are how educational content quietly becomes
wrong. This deck will be presented repeatedly over months.

**Fix:** Every statistic carries source + publication year + a `VERIFY` flag, and
lives in `research/` and `statistics/`, not just on the slide. A dedicated
fact-check prompt (`prompts/06-fact-check.md`) re-runs before each delivery.
Anything I cannot source gets cut, not softened.

### Defect 5 — No accessibility or replay plan

Roughly half of registrants watch the replay, not the live event. The deck is
built for the live room only.

**Fix:** Chapter markers at every module boundary, all numbers spoken aloud rather
than only shown, contrast and minimum type size specified in the brand guidelines,
and a replay-specific CTA slide.

### Defect 6 — "Top Mistakes" at minute 36 is the weakest placement of the best content

The mistakes list is the most shareable, most memorable segment. Burying it in the
fatigue zone wastes it.

**Fix:** Keep the consolidated list at 36:00 for the recap, but *seed* each mistake
at the moment it becomes relevant earlier in the deck ("that's mistake #4, hold
onto it"). The closing list then functions as retrieval practice, which is what
actually drives retention — not as first exposure.

### Defect 7 — No stated failure mode for the presenter

**Fix:** `speaker_notes/delivery-guide.md` covering: what to do when chat is dead,
when one person dominates, when someone asks for a rate quote on camera (a
compliance trap), and when a question is outside my lane.

→ Produces **v4 (LOCKED)**. Ship v4.
