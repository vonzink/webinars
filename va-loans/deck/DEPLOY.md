# Deploy — msfgmortgage.com/webinars/va/

Hosted on **AWS Amplify** (manual deploy, no Git connection) — same app as the
rest of the site.

- App: `msfg-webinars` · appId `d1u9vaaso8yrd4` · region `us-east-1`
- Branch: `main` (PRODUCTION) · custom domain **msfgmortgage.com**
- Account: 116981808374 (IAM user `vonzink`)

Amplify replaces the **entire** deployment each time, so the artifact must be the
whole site (homepage + `/webinars/` + every deck), never this deck alone. The
artifact assembly process is documented in
`first-time-homebuyer/deck/DEPLOY.md` — build the site shell, add each deck
under its path, zip from the artifact root, upload via
`aws amplify create-deployment` / `start-deployment`.

This deck ships at **`/webinars/va/`** inside that artifact.

## Redeploy

The whole-site artifact is built by `site/build.mjs` and deployed with the steps in
[`site/README.md`](../../site/README.md). This deck ships at **`/webinars/va/`**
because `site/webinars.json` says so. Do not zip this folder on its own.

Local, from the repository root:

```bash
node site/build.mjs
```

Then follow the Deploy section of `site/README.md`.

## Rollback

Amplify keeps every deployment. In the Amplify console → app `msfg-webinars` →
branch `main` → Deployments, "Redeploy this version" on the prior job.

## Still pending before it's fully final

- **Schedule a Consultation** button is hidden until the booking link is supplied
  (`LINKS.bookingUrl` in `content/presenters.js`). 
- Downloadable PowerPoint is `Understanding-VA-Loans.pptx` (generated from the
  live deck content by `build_pptx.py`, output lands at
  `va-loans/Understanding-VA-Loans.pptx`).
- Presenter graphics registry (`content/presenter-media.js`) is empty — add
  VA-specific charts when ready (see README/spec for the registry shape).
