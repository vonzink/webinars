# PROJECT.md — Page Two

**v5 (LIVE).** *Page Two — What Nobody Explains About Buying Your First Home.*
38:00 taught + 20:00 live Q&A · 47 slides · **4,700-word script cap.**

> v4 was torn down and rebuilt — see [versions/v5/TEARDOWN.md](versions/v5/TEARDOWN.md).
> It was a 58-minute webinar labeled 40, its best content sat in the attrition
> trough, and its affordability module was polite instead of true.

## 1. The thesis

Most mortgage education is a sales presentation wearing a lab coat. It explains
just enough to make the borrower feel dependent, and stops exactly where the
useful part begins. This project inverts that: teach until the audience no longer
needs the teacher, and trust that competence produces more business than
confusion does.

Zach Zink's operating belief, made into content: **educating borrowers creates
trust; pressure destroys it.**

## 2. Success criteria

The webinar succeeds if:

| # | Criterion | How it's measured |
|---|---|---|
| 1 | The audience becomes measurably more confident | Pre/post confidence poll (Poll 1 vs. exit survey), target +3 on a 1–10 scale |
| 2 | They can *do* something, not just recall it | ≥40% download at least one tool; ≥15% complete the homework |
| 3 | It doesn't feel like a pitch | Exit survey: "Did this feel like a sales presentation?" — target ≤10% yes |
| 4 | It holds attention | ≥65% still present at minute 35 |
| 5 | It earns trust, not urgency | Loan Estimate reviews requested (the no-strings CTA) > booked calls. If this ratio inverts, the content drifted. |
| 6 | It's correct | Zero factual corrections required post-delivery |

Criterion 5 is the honest one. If the free-review requests dry up and only booked
calls remain, the webinar has quietly become a funnel and needs to be re-cut.

## 3. Audience

First-time homebuyers, **23–45**, primarily Colorado.

What is actually true about them:
- Most have **never spoken to a lender**. The first call feels like an exam they
  didn't study for.
- They believe they need **20% down**. This is the single largest false blocker.
- They cannot distinguish a good deal from a bad one, and they know it. That
  helplessness is the source of the anxiety, not the math.
- They are afraid of a **permanent, expensive mistake** — this is the emotional
  center of the whole event.
- They don't know what questions to ask, so they ask none, and then agree to things.
- Many are comparing against a **builder's preferred lender** and cannot evaluate
  whether the incentive is real.
- Half will watch the **replay**, not the live event.

What they are *not*: stupid, uninterested in detail, or unwilling to do homework.
Underestimating them is the failure mode of every webinar in this category. Teach
up.

## 4. Voice

- Plain language. Every term defined **the first time it's spoken**, in under 10 words.
- Numbers said out loud, not just shown — replay viewers and anyone half-listening.
- Say the uncomfortable thing. Renting is sometimes correct. FHA is sometimes worse
  than it looks. The builder's lender sometimes genuinely wins. Saying this is the
  cheapest credibility available.
- No hype, no scarcity, no countdown, no "rates are going up."
- Warm, direct, a little funny. Never smug about jargon the audience doesn't know —
  the jargon is the industry's fault, not theirs.

## 5. Constraints

**Hard**
- **38:00 taught, and the binding constraint is a 4,700-word script cap — not a
  clock.** Minutes are the wrong unit; v4 died of a 7,000-word script. If rehearsal
  runs long, cut sentences. Never talk faster.
- Live Q&A extends past 38:00. Taught content does not.
- Educational only: no rate quotes, no offers, no commitment to lend.
- Every number labeled hypothetical; NMLS + Equal Housing on required slides.
- Colorado-specific claims must be verified on the delivery date.
- One canonical example, no exceptions (`references/canonical-example.md`).

**Soft**
- 47 slides ±3.
- Any single module droppable to a 20-minute standalone.
- Rebuildable as a 60-minute version using the `[EXP-#]` expansion markers.

## 6. Deliverables

- [x] Complete outline, module by module — `outline/`
- [x] Minute-by-minute run of show — `outline/00-master-outline.md`
- [x] Full speaker script — `script/full-script.md`
- [x] The 7 slides carrying the v5 argument — `versions/v5/hero-slides.md`
- [ ] **Remaining 40 slides renumbered to v5** — mapped in `versions/v5/hero-slides.md`,
      not yet re-emitted. `slides/*.md` is v4 numbering.
- [x] 7 stories — `knowledge/stories.md`
- [x] 5 polls — `knowledge/polls.md`
- [x] 4 exercises — `outline/` (in-module) + `knowledge/`
- [x] Visual direction — `diagrams/`, `images/`, `branding/`
- [x] Transitions — `outline/` per module + `script/transitions.md`
- [x] FAQ + objections + myths — `knowledge/`
- [x] Homework — `outline/10-cta.md`
- [x] 5 downloads — `downloads/`
- [x] Tiered call-to-action — `outline/10-cta.md`
- [x] Research + statistics with citations — `research/`, `statistics/`
- [x] Reusable prompt library — `prompts/`

## 7. The three calculators

Zach's own tools, used as teaching instruments:

| Tool | Where | What it proves |
|---|---|---|
| Budget Calculator | Module 3, slide 027 | The gap between *approved* and *comfortable* |
| APR Calculator | Module 5, slide 047 | The lowest rate is not the cheapest loan |
| Amortization Calculator | Module 5, slide 051 | Where the money actually goes, and the $100 lever |

Each has a scripted run-book and a static fallback in `resources/`.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Runs long | 5 declared cut points (`[CUT-1..5]`), 5 printed checkpoint times |
| Calculator fails live | Pre-rendered fallback slide + scripted bridge line for each |
| Someone demands a live rate quote | Scripted redirect in `speaker_notes/delivery-guide.md` |
| Stats go stale | `VERIFY` flags + fact-check prompt re-run per delivery |
| Colorado program terms change | CHFA slide framed as a landscape, verified per delivery |
| Drifts into a pitch over time | Success criterion #5 monitors the ratio directly |
| Dead chat | Seeded questions per AMA break |

## 9. Non-goals

- Not a refinance, investor, or move-up-buyer class.
- Not legal, tax, or investment advice.
- Not a rate-shopping event.
- Not a replacement for a real pre-approval conversation.
