# HANDOFF v2 — Homebuyer Webinar (Seth's full change list) — for a LOCAL Claude Code session

You run on Zachary's Mac (`/Users/zacharyzink/MSFG/Webinars`). A cloud session prepared this and
the two attached assets but cannot reach the local files or AWS. Do this end‑to‑end.

## ⚠️ Edit the RIGHT deck (this caused a production revert once)
Live site **msfgmortgage.com/webinars/homebuyers-webinar/** deploys from the **single‑file build**:
`Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/webinars/homebuyers-webinar/`
(`index.html` + `script.js` + `styles.css`, plus `assets/` and `downloads/`). That folder is a git
repo with **no remote** and **uncommitted edits** — those edits are the real live content. **Edit
here. Do NOT touch `first-time-homebuyer/deck/`** (separate modular redesign, not live).
Amplify: app `msfg-webinars`, appId `d1u9vaaso8yrd4`, region `us-east-1`, branch `main`.
Slide numbers below are Seth's references against the CURRENT live deck — match by content, since a
few changes insert/remove slides.

## Attached assets (in this folder)
- `john-doe-worksheet.png` — the example cost breakdown for the new slide (borrower **John Doe**,
  MSFG‑branded, generic example — no loan officer). `john-doe-worksheet.html` is the editable source if you want to tweak.
- `presentation-qr.svg` / `.png` — QR encoding `https://msfgmortgage.com/webinars/homebuyers-webinar/`
  for the QR slide. (Seth's branded QR image can replace it if it encodes the same URL.)

---

## GLOBAL
**G1 — Logo clipping (all slides).** Two separate problems on the footer wordmark:
  - **Bottom cut‑off on some resolutions** (Seth's main complaint) — the footer logo is clipped at
    the slide's bottom edge at certain aspect ratios. In `styles.css`, find the footer/logo rules;
    likely fixes: remove a fixed footer height / `overflow:hidden`, add bottom padding/safe‑area, or
    stop absolutely positioning it flush to the bottom. Test at 16:9, laptop, and a short window.
  - **"E in STATE" horizontal clip** — the MOUNTAIN**STATE** wordmark's final E is cut (see the logo
    Seth pasted — it reads "MOUNTAINSTATI"). If it's an SVG, widen its `viewBox` right edge ~4%; if
    an `<img>`/background, add width / remove the crop.
  Verify both visually after.

---

## SLIDE 1 (opening / contact)
- **Make the contact lines clickable:**
  - `303-883-8519` → `<a href="tel:+13038838519">303-883-8519</a>`
  - `Seth.angell@msfg.us` → `<a href="mailto:Seth.angell@msfg.us">Seth.angell@msfg.us</a>`
  - `info@msfgmortgage.com` → `<a href="mailto:info@msfgmortgage.com">info@msfgmortgage.com</a>`
- **Photo:** replace Seth's picture with his **new headshot** (Seth provided it — bald, light beard,
  gray suit, light‑blue shirt, light background). Save it into the deck's assets
  (e.g. `assets/portraits/seth-angell.jpg`), point slide 1 at it, and match the current portrait's
  crop/aspect (face centered). It's high‑res — resize to ~800px on the long side for web.

## SLIDE 3 (Rent vs Buy → "Buying")
Replace the equity bullet with: **"Equity builds two ways — paying down principal and appreciation."**

## SLIDE 4 (What's actually in the payment)
- Remove the bullet **"Refinancing resets the clock — a new 30‑year loan starts over…"**
- Remove the bullet **"A special assessment."**

## SLIDE 6 (Most Common Loan Programs)
- Remove the **Jumbo** card + popout. Lay the remaining four as a **2×2 grid**: top **Conventional ·
  USDA**, bottom **FHA · VA**. If subhead says "Five…," change to **Four**.

## ★ NEW SLIDE — insert between slide 6 and slide 7
Topic: **closing costs vs. prepaid items**, and what a borrower may pay **before** closing.
Suggested copy (lay it out to match neighboring slides):
- Eyebrow: *Before you close* · Headline: **Closing costs vs. prepaid items**
- **Closing costs** — one‑time fees to set up the loan (appraisal, title, lender/third‑party
  services). Paid once, at closing.
- **Prepaid items** — your own money paid ahead: first‑year homeowners insurance, prepaid interest,
  and escrow deposits for taxes & insurance. **Not fees.**
- **Paid up front (before closing):** Credit report · Appraisal · Inspection · Earnest money
- **MSFG note:** *"We don't charge for the credit report, and we defer the appraisal fee until
  closing — so before closing you're usually only out your inspection and earnest money."*
- **Graphic:** embed `john-doe-worksheet.png` (label it "Example — actual charges vary").

## SLIDE 7 (Cash to close)
- **Heading →** **"Cash to close: Where it can come from"**
- Remove the **"Download the checklist"** link.
- Remove the **Agent Credits** card + popout.
- Rename **Savings → "Checking & Savings"** (keep its rules).
- Add cards **Investment Accounts** and **Retirement Accounts** (popout copy in Appendix). Keep the
  **2‑1 Buydowns** card.
- Final order: Checking & Savings · Investment Accounts · Retirement Accounts · Gift Funds · Seller
  Credits · 2‑1 Buydowns · Down Payment Assistance.

## SLIDE 8 (Closing costs are not cash to close)
- **Remove this slide entirely.** (Supersedes the earlier "reword the subhead" note — Seth doesn't
  want the slide.)

## SLIDE 9 (Meet the players)
- Add a connector line **Lender → Insurance** and **Processor → Insurance**, matching the existing
  connector style/endpoints.

## SLIDE 11 & 12 (Don't / Do)
- Remove the **"Download the Dos and Don'ts PDF"** link on both.
- **Slide 11 only:** change **"Quit or give notice before your loan closes"** →
  **"Quit your job or give notice before your loan closes."**

## SLIDE 13 (Don't assume the lowest rate wins)
Change the refinancing bullet to: **"Refinancing ends the loan early and could restart amortization."**

## SLIDE 14 (small assumptions)
- Remove the subhead **"Tap any one for what actually happens."**
- Reword the card **"They're all about the same — I'll use one lender."** → **"I'll just use my bank."**
  (popout copy in Appendix).
- Remove the cards **"I'm approved, so I'm done."** and **"I'll wait until I have twenty percent."**
- **Result: 4 cards** — pre‑approved‑once‑I‑find‑a‑house · I'll‑just‑use‑my‑bank · closing‑costs ·
  builder's‑incentive.

## SLIDE 15 (Questions → "Should I lock my rate?")
Remove the float‑down mention: **"Generally once you're under contract. A lock holds your rate while
the loan is in process — ask how long it lasts and what happens if closing runs past it."**

## SLIDE 16 (QR)
- Add the QR (`presentation-qr.svg`) so people can open the presentation on their phone. Caption it
  e.g. *"Scan to open this presentation."*

## SCHEDULE / APPOINTMENT button
- Add a **"Schedule a Consultation"** button next to **Apply Now**. For now it just emails Seth:
  `<a href="mailto:seth.angell@msfg.us?subject=Homebuyer%20Webinar%20—%20Schedule%20a%20Consultation">Schedule a Consultation</a>`
- (Later: swap the `mailto:` for a real booking URL when Seth provides one.)

---

## Appendix — popout copy
**Investment Accounts** — "The rules":
- Brokerage, stocks, and mutual funds count — a recent statement documents them
- To use the money you sell the assets, then show the sale and the deposit
- For reserves, underwriting may count only part of the balance, not the full amount
- _Note:_ You don't have to sell to **prove** reserves — only to **spend** them.

**Retirement Accounts** — "The rules":
- Vested 401(k) and IRA balances count — a statement documents them
- To use the funds, document the withdrawal or loan and the money landing in your account
- A 401(k) loan payment can count in your DTI; a withdrawal may bring taxes or penalties
- _Note:_ Weigh the tax hit with your advisor **before** you pull from retirement.

**Checking & Savings** — keep the existing "Savings" rules; only the title changes.

**"I'll just use my bank."** popout:
- _What actually happens:_ A bank offers its own products; fees and pricing can run thousands higher at the same rate
- _Do instead:_ Get more than one Loan Estimate the same day and compare fees
- _Do instead:_ A broker shops many lenders for you — and it counts as one credit pull

---

## Build, deploy, cleanup
1. Make edits in the export working tree; drop `john-doe-worksheet.png` and `presentation-qr.svg`
   into that deck's `assets/` and reference them.
2. Test locally (`python3 -m http.server` in the export folder).
3. Rebuild the artifact — zip from the export root (`index.html`, `amplify.yml`, `webinars/**`;
   exclude `.git/`, `tmp/`, `node_modules/`).
4. Deploy (runbook in `first-time-homebuyer/deck/DEPLOY.md`):
   ```bash
   APP=d1u9vaaso8yrd4; BR=main; ZIP=Homebuyers-Webinar/Export/site-deploy-$(date +%F).zip
   OUT=$(aws amplify create-deployment --app-id $APP --branch-name $BR --output json)
   JOB=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['jobId'])")
   URL=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['zipUploadUrl'])")
   curl -H "Content-Type: application/zip" --upload-file "$ZIP" "$URL"
   aws amplify start-deployment --app-id $APP --branch-name $BR --job-id "$JOB"
   ```
5. Hard‑refresh the live URL; spot‑check slides 1, 2, 3, 4, 6, the new slide, 7, 9, 11, 13, 14, 15, 16.
6. **Cleanup:** commit the export repo and push it to a remote — right now the live site's source is
   uncommitted in a repo with no backup.

## Still pending from Seth
- A real **booking URL** (until then the Schedule button emails Seth).
  (Seth's new slide‑1 headshot has been provided — use the file Seth sent.)
