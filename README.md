# MSFG Webinars

Interactive mortgage-education webinars for Mountain State Financial Group, hosted at
https://msfgmortgage.com/webinars/.

| Folder | What it is | Ships at |
|---|---|---|
| `first-time-homebuyer/deck/` | The Homebuyer's Playbook interactive deck | `/webinars/homebuyers-webinar/` |
| `va-loans/deck/` | Understanding VA Loans interactive deck | `/webinars/va/` |
| `cd-webinar/` | Loan Estimate and Closing Disclosure interactive viewer | `/webinars/le-cd/` |
| `site/` | Site shell, deploy manifest, build script, and deploy runbook | artifact root |
| `first-time-homebuyer/*.md` | "Page Two" script and research project (content only, not deployed) | — |
| `Homebuyers-Webinar/`, `presentation-system/` | Earlier v1.0 generation, superseded by the decks above | — |
| `docs/superpowers/` | Design specs, implementation plans, and validation records | — |

## Build and deploy

Local, from the repository root:

```bash
node site/build.mjs
```

See [`site/README.md`](site/README.md) for the full build, preview, deploy, and
rollback runbook.

## Tests

Local, from the repository root:

```bash
node --test site/tests/build.test.mjs
node --test first-time-homebuyer/deck/tests/*.test.mjs
node --test va-loans/deck/tests/*.test.mjs
node --test cd-webinar/tests/*.test.mjs
```

The `cd-webinar` render-reproducibility test needs Poppler (`pdftoppm`) installed.

## Standards

`ABOUT.md`, `PROJECT_GOALS.md`, `DESIGN_RULES.md`, and `MPLEMENTATION_RULES.md` hold
the brand, audience, design, and implementation rules every webinar follows.
