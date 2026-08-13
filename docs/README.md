# FIN-A Wallet — Documentation Map

Status: **current** — reflects the repository at commit `bed2a4b` (2026-08-13, ALP-34). This file is
the index for every knowledge document in the repo: what exists, what status it carries, and who
owns it. The README's docs table mirrors this map — keep the two in sync.

## The map

| File                            | Status               | Owner                 | Content                                                                                                                     |
| ------------------------------- | -------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                     | Current              | team                  | Entry point: what the prototype is, how to run it, architecture overview, known shortcuts                                   |
| `docs/README.md`                | Current              | Knowledge Curator     | This map                                                                                                                    |
| `docs/backend-architecture.md`  | Draft (ALP-6)        | Architecture Recorder | The planned NetBank backend: schemas, BaaS mapping, migration path                                                          |
| `docs/multi-user-model.md`      | Decided (ALP-7)      | Architecture Recorder | The decision behind ALP-6: how FIN-A users map to NetBank accounts                                                          |
| `docs/frontend-architecture.md` | Current              | Architecture Recorder | The frontend as it actually is: MVVM contract, platform-seam layering, navigation, testing, RN port story                   |
| `docs/data-layer.md`            | In progress (ALP-34) | API Documenter        | Data/API surface: `core/data` repositories + mock fixtures, `core/stores` contracts, `core/money`, NetBank replacement path |
| `docs/developer-guide.md`       | In progress (ALP-34) | Code Explainer        | Setup, structure walkthrough, how to add a screen/feature, real file references                                             |
| `CHANGELOG.md`                  | Current (ALP-34)     | Changelog Agent       | What actually shipped, from git history                                                                                     |
| `DESIGN.md`                     | Current (stale name) | team                  | UI layout & visual design guide; still says "EasyPay", predates the FIN-A rename (see flags)                                |
| `AGENTS.md` / `CLAUDE.md`       | Current              | team                  | Working guidelines for agents / Claude Code                                                                                 |

Statuses are ordered: **Draft** → **Decided** → **Current**. "In progress (ALP-34)" means the file
is planned in the current documentation effort and not yet committed — flip it to **Current** when
it lands.

## Source-of-truth rules

- **Money, screens, navigation** — the code is the truth (`src/core/money`, `src/core/navigation/screens.ts`).
  Docs describe code; when they disagree, the code wins and the doc is wrong.
- **Backend design** — `docs/backend-architecture.md` is the design; `docs/multi-user-model.md` is
  the decision it builds on. A new backend claim lives in the architecture doc, never in a comment.
- **Doc statuses** — `docs/README.md` and the README's docs table are the only two places a doc's
  status is recorded. Update both in the same commit.

## Duplicates and contradictions (reconciliation status)

1. **Screen count drift — reconciled.** README's Testing section said "47 screens"; `ScreenParams`
   in `src/core/navigation/screens.ts` has **48** keys (`insights`, added with spending insights,
   pushed it over). Fixed in the README docs-table refresh (commit for ALP-34).
2. **`DESIGN.md` uses the old app name — flagged, not fixed.** It references "EasyPay" and never
   "FIN-A". It is a visual guide, not architecture, so the naming drift is cosmetic; whoever owns
   the design language should rename it or retire it. No replacement doc exists, so it stays.
3. **`AGENTS.md` has an uncommitted working-tree edit** (seen by the Architecture Recorder at
   `bed2a4b`; not on this branch). Until it is committed or reverted, agent guidelines differ
   between machines — owner: team, before the next `npm run verify` runs end-to-end.

## Maintenance rules

- **Adding a doc**: create it, then add a row here and in the README docs table in the **same
  commit**. A doc with no map row is unregistered.
- **Moving or renaming a doc**: update both tables and every in-repo link to it. Never delete a doc
  without confirming its replacement exists and is linked.
- **Resolving a contradiction**: fix the stale side in the same commit that fixes the code, and
  note the change in the commit message.
- **Knowledge in comments/heads**: if a durable decision lives only in an issue comment or a
  person's head, capture it in the owning doc — this repo's docs are the memory, not the comment
  threads.
