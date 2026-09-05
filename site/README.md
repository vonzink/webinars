# msfgmortgage.com site build and deploy

Everything that ships to **msfgmortgage.com** is assembled from this folder. Amplify
replaces the whole deployment on every upload, so the artifact must always contain
the site shell plus every webinar. Never upload a single deck on its own.

| Piece | Where it lives |
|---|---|
| Site shell (homepage, webinar hub, `amplify.yml`) | `site/shell/` — mirrors the artifact root exactly |
| Which deck ships at which `/webinars/<slug>/` path | `site/webinars.json` |
| Build script | `site/build.mjs` |
| Build contract tests | `site/tests/build.test.mjs` |
| Output (ignored by git) | `dist/site/` and `dist/site.zip` |

## Build

Local, from the repository root:

```bash
node site/build.mjs
```

That writes `dist/site/` and `dist/site.zip`, strips development-only files
(tests, scripts, READMEs, review records, raw PDFs, caches), copies the PowerPoint
downloads into each deck's `downloads/` folder, and refuses to finish if any link in
the shell points at a file that isn't in the artifact or if a webinar in the manifest
has no card on the hub page.

Preview the exact artifact before deploying:

```bash
python3 -m http.server 4180 --bind 127.0.0.1 --directory dist/site
```

Then open http://127.0.0.1:4180/webinars/ in a browser.

Run the build tests (they build into a temp folder and clean up):

```bash
node --test site/tests/build.test.mjs
```

## Deploy

Hosted on **AWS Amplify**, manual deploy, no Git connection.

- App `msfg-webinars`, appId `d1u9vaaso8yrd4`, region `us-east-1`
- Branch `main` (PRODUCTION), custom domain `msfgmortgage.com`
- Account `116981808374`, IAM user `vonzink`

Local, from the repository root, after `node site/build.mjs` succeeded. Nothing to
replace; the script reads the zip it just built:

```bash
APP=d1u9vaaso8yrd4; BR=main
OUT=$(aws amplify create-deployment --app-id $APP --branch-name $BR --output json)
JOB=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['jobId'])")
URL=$(echo "$OUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['zipUploadUrl'])")
curl -H "Content-Type: application/zip" --upload-file dist/site.zip "$URL"
aws amplify start-deployment --app-id $APP --branch-name $BR --job-id "$JOB"
aws amplify get-job --app-id $APP --branch-name $BR --job-id "$JOB" --query job.summary.status
```

Re-run the last line until it reports `SUCCEED`, then spot-check:

- https://msfgmortgage.com/webinars/
- https://msfgmortgage.com/webinars/homebuyers-webinar/
- https://msfgmortgage.com/webinars/va/
- https://msfgmortgage.com/webinars/le-cd/

## Rollback

Amplify keeps every deployment. In the Amplify console, open app `msfg-webinars`,
branch `main`, Deployments, and choose **Redeploy this version** on the previous job.

## Adding a webinar

1. Put the runtime deck in its own folder with an `index.html` at the top.
2. Add an entry to `site/webinars.json` with a `slug`, `title`, `source`, and any
   `downloads` to copy in. Add folder or file names that must not ship to `exclude`.
3. Add a card to `site/shell/webinars/index.html` that links to `/webinars/<slug>/`.
4. Run `node --test site/tests/build.test.mjs` and `node site/build.mjs`. The build
   fails until the card and the manifest agree.

## Removing or renaming a webinar

Renaming a slug changes public URLs. The homebuyer deck's QR code points at
`/webinars/homebuyers-webinar/`, so treat that slug as permanent.
