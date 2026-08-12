# Slide 5 Budget Visuals

Date: 2026-08-12
Status: Approved for implementation

## Objective

Update the current fifth audience slide, `budget-comfort`, while preserving its title and presenter-only media behavior:

- eyebrow: `Budget`
- title: `Keep the payment in your comfort zone`
- add the two supplied PNGs as optional presenter visuals;
- remove the builder-incentive bullet and its matching speaker-note discussion.

## Slide Copy

Keep these three audience bullets:

1. `Don't become house poor — the guidelines ask if you'll repay, not if you'll be okay`
2. `Protect quality of life — leave room for disposable income and emergencies`
3. `The payment can change after you close`

Remove this audience bullet:

`Builder incentives can create negative equity — dangerous for a first-time buyer who moves sooner than expected`

Remove the matching builder-incentive explanation from this slide's speaker notes. Keep the remaining speaker-note explanation about qualification versus the buyer's actual comfort level.

This change is scoped only to Slide 5. It does not remove the later `The builder's incentive is free money` card from the separate mistakes slide.

## Myth Popout Copy Lock

In the `myth-20-down` popout, keep the closing note exactly:

`Mortgage insurance on a conventional loan is removable.`

The phrase `it's a phase, not a sentence` must not appear in the HTML presenter content or the PowerPoint content mirror. The current working source and deployed presenter already contain the approved final sentence, so implementation adds regression coverage to prevent the removed phrase from returning; no redundant source edit is required unless verification finds a mismatch.

Historical handoff notes, planning documents, scripts, and archived slide sources are records of earlier versions and remain out of scope.

## Optional Presenter Visuals

Copy the supplied files without recompression or visual changes:

| Presenter label | Source | Deck asset |
| --- | --- | --- |
| `Budget Smart` | `/Users/zacharyzink/Desktop/budget.png` | `assets/presenter/slide-05/budget-smart.png` |
| `Debt-to-Income (DTI)` | `/Users/zacharyzink/Desktop/DTI.png` | `assets/presenter/slide-05/debt-to-income.png` |

Expected source properties:

- `budget.png`: 1536 by 1024 PNG, SHA-256 `0128267ab6f1be348598dc10726280f9527a72f8f4bce57d4905ff0857ef09f7`
- `DTI.png`: 1122 by 1402 PNG, SHA-256 `6936b636540652a68dcb9edca99c6cf573ffa2f40c1d009e06d6e19bb5e62dcf`

Register both assets against slide ID `budget-comfort` in `content/presenter-media.js`. The presenter can open either visual through the same draggable and resizable graph window used by Slides 2 and 3.

The PNGs must not be embedded in the audience slide, preloaded by the audience page, added to the PowerPoint, or opened automatically. They appear only after a presenter chooses one.

## Presenter Label

Replace the hard-coded presenter heading `Slide 2 graphs` with the general heading `Optional visuals` whenever the current slide has registered presenter media. Preserve the existing count and button-list behavior.

This label change applies consistently to Slides 2, 3, and 5; it does not alter which visuals are available on any slide.

## Source Consistency

Update both representations of the Slide 5 content:

- `content/slides.js`, which drives the HTML webinar;
- `build_pptx.py`, which mirrors slide content for PowerPoint generation.

The optional PNGs remain HTML-presenter assets only and are not added to the generated PowerPoint.

## Verification

Use test-first implementation and verify:

1. Slide 5 contains exactly the three retained bullets and no builder-incentive bullet.
2. Slide 5 speaker notes no longer mention builder incentives.
3. The later mistakes-slide builder-incentive card remains unchanged.
4. `budget-comfort` exposes exactly `Budget Smart` and `Debt-to-Income (DTI)` in the presenter.
5. Both registered files exist, decode as PNGs, and match their source SHA-256 hashes.
6. The audience slide does not contain or preload either optional visual.
7. Each presenter button opens the correct image in the existing draggable and resizable media popout.
8. Advancing slides closes the media popout through the existing behavior.
9. The presenter heading reads `Optional visuals` on every slide with registered media.
10. Existing Slide 2 and Slide 3 presenter visuals remain unchanged.
11. The full deck test suite, JavaScript syntax checks, `git diff --check`, and browser console review pass.
12. The `You need 20% down` popout ends with the exact approved mortgage-insurance sentence in both content representations, with no occurrence of the removed phrase in runtime content.

## Deployment Boundary

This phase implements and locally verifies the Slide 5 change. It does not publish another production Amplify bundle unless production deployment is separately requested after review.

## Non-goals

- No changes to the title, subtitle, or three retained Slide 5 bullets.
- No changes to the calculator.
- No changes to Slide 2 or Slide 3 visual membership.
- No removal of the later builder-incentive mistakes card.
- No audience-facing gallery, thumbnails, or automatic visual display.
- No visual editing, cropping, recompression, or regeneration of the supplied PNGs.
- No unrelated slide, presenter, PowerPoint, or production-site changes.
