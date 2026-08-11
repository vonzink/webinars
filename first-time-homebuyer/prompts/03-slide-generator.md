# Prompt 03 — Slide Generator

Generate slide files in this repo's format. One file per slide.

---

```
Generate slide files for a mortgage education webinar. One file per slide, using
EXACTLY the structure below. Do not add sections. Do not omit sections.

## INPUT
- Module outline: [PASTE OR PATH]
- Canonical example: [PATH — every number must come from here]
- Slide range: [e.g. 040–051]
- Time budget for the range: [e.g. 6:30]

## FORMAT — every slide file, exactly this

---
# Slide NNN

**Module:** [n — name] · **Time:** [MM:SS] · **Duration:** [Ns]

## Purpose
One sentence. What this slide changes in the audience's head. If you can't write
this in one sentence, the slide is doing two jobs and should be two slides.

## Headline
The words on screen. Short. Written to be READ IN TWO SECONDS while the presenter
keeps talking. If it takes longer to read than to say, it's too long.

## On-slide content
Only what appears visually. Bullets, tables, numbers. Nothing the presenter says
but the audience doesn't see.

## Graphic
What the designer builds. Specific enough to execute without asking a question.

## Animation
The build sequence, click by click. "None" is a valid and often correct answer.

## Speaker notes
What is actually said. Written as SPOKEN language, not written language —
contractions, sentence fragments, the way a person talks. Mark pauses. Mark where
to slow down. This is a script, not a summary.

## Transition
The exact sentence that leads to the next slide. Transitions are content — a deck
where every transition is "so, next..." reads as a list, not an argument.

## References
Which research file backs each claim on this slide.

## Compliance
Required disclaimers, on-slide labeling, and anything that must not be said.
Write "None" only if the slide contains no numbers and no claims.
---

## HARD RULES

1. EVERY number comes from the canonical example file. Never invent one. If you
   need a number that isn't there, say so instead of making it up.
2. Every term is defined the first time it appears, in under 10 words.
3. Any slide with a rate, payment, or cost carries a hypothetical-illustration
   label ON THE SLIDE, not just in the notes.
4. Headlines are claims, not labels. "APR isn't your interest rate" beats
   "Understanding APR." A label tells them the topic; a claim makes them want the
   next sentence.
5. Speaker notes say numbers OUT LOUD. Half the audience is on the replay, and
   some of them aren't looking at the screen.
6. One slide, one idea. Two ideas is two slides.
7. Keep to the time budget. Sum your durations and state the total. If it exceeds
   the budget, say so rather than quietly compressing the notes.
8. Mark any slide that could be cut live as [CUT-n], and any that could expand as
   [EXP-n].

## VOICE
Plain. Direct. Occasionally funny. Never condescending — the jargon is the
industry's fault, not the audience's. Say the uncomfortable thing when it's true.
```

---

## Notes

- **Rule 4 is the one that most changes the feel of a deck.** A deck of labels
  reads like a textbook. A deck of claims reads like an argument.
- Rule 1 is the one models break most often. If a needed number is missing from the
  canonical example, that's a signal to add it *to the canonical file first*.
- The transition field is not optional. Generating slides without transitions
  produces a list of facts.
