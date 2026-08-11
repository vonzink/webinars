# references/

Citation index and the canonical example.

| File | What it is |
|---|---|
| `canonical-example.md` | **Single source of truth for every number in the deck.** Read this before editing any slide. |
| `citation-index.md` | Where each claim's source lives |

---

## The rule

If a slide contains a number, that number comes from `canonical-example.md` or from
a `research/` file with a cleared `VERIFY` flag. There is no third source.

Changing `canonical-example.md` means auditing every slide that references it — the
consistency checklist at the bottom of that file exists for exactly this.
