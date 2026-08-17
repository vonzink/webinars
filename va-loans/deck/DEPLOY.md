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

```bash
# 1. Assemble the whole-site artifact (see first-time-homebuyer/deck/DEPLOY.md):
#    site shell (index.html, amplify.yml, webinars/index.html, linked .pptx files)
#    + first-time-homebuyer deck at /webinars/homebuyers-webinar/
#    + this deck at /webinars/va/
#    Deck files exclude dev-only items: build_pptx.py, content.json, scripts/,
#    tests/, README.md, DEPLOY.md, SLIDE_DESIGN_SPEC.md.

# 2. Zip from the artifact root (paths must be site-root relative), then:
APP=d1u9vaaso8yrd4; BR=main
OUT=$(aws amplify create-deployment --app-id $APP --branch-name $BR --output json)
JOB=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['jobId'])")
URL=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['zipUploadUrl'])")
curl -H "Content-Type: application/zip" --upload-file site.zip "$URL"
aws amplify start-deployment --app-id $APP --branch-name $BR --job-id "$JOB"
# poll: aws amplify get-job --app-id $APP --branch-name $BR --job-id $JOB --query job.summary.status
```

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
