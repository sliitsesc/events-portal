# Volunteer Contribution Tracker

Purpose: separate genuine work from noise during volunteer training. Every row
must be backed by a PR link. The auto-metrics come from
`scripts/contribution-report.sh`; the review columns are filled in by the
reviewer (Development Head), never by the volunteer.

## 1. Issue roster

Update when an issue is claimed, opened as PR, and merged.

| Issue | Title | Level | Volunteer | Claimed | PR | Status | Reviewer verdict |
|---|---|---|---|---|---|---|---|
| #20 | Add to Calendar Button | Easy | | | | Open | |
| #21 | Event Capacity Progress Bar | Easy | | | | Open | |
| #22 | Event Search & Category Filter | Intermediate | | | | Open | |
| #23 | Admin Stats Dashboard | Intermediate | | | | Open | |
| #24 | Volunteer Task Board | Advanced | | | | Open | |
| #25 | Cancel Ticket & Seat Release | Intermediate | | | | Open | |
| #26 | Social Sharing & OpenGraph | Easy | | | | Open | |
| #27 | User Profile Settings | Intermediate | | | | Open | |
| #28 | Post-Event Feedback | Intermediate | | | | Open | |
| #29 | Kiosk Mode Scanner | Advanced | | | | Open | |

Status values: Open, Claimed, In review, Changes requested, Merged, Dropped.

## 2. Genuine-work scorecard (per merged PR)

Score each 0-2 in review. Total out of 10.

| PR | Volunteer | Meets all acceptance criteria | Explains own code in review | Handles edge cases | Follows repo conventions | Tested by hand (screenshots/steps in PR) | Total |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

Reading the score: 8-10 strong, 5-7 coach and give another issue, 0-4 or any
"cannot explain own code" is a red flag for copied or generated work.

## 3. Auto-metrics (from GitHub)

Regenerate with:

```bash
scripts/contribution-report.sh --maintainers "AuthnSapuarachchi,Sathufit,pawan-live" > docs/CONTRIBUTIONS_AUTO.md
```

Lines in `package-lock.json`, `.history/`, `.next/` and `node_modules/` are not
counted. Flags to look at:

| Flag | Meaning |
|---|---|
| no-linked-issue | PR does not close an issue (use `Closes #N` in the PR body) |
| trivial-diff | Under 5 real changed lines |
| noise-only | Only lockfile/history/generated files changed |
| single-large-commit | One commit with 300+ lines, often pasted in bulk |
| merged-without-approval | Merged with no approving review |
| out-of-scope | Changed files outside the linked issue's paths (see `.github/issue-scope.json`) |
| touches-package.json | Dependencies may have been added; check the PR |
| touches-.history | Committed editor-history files |

The same checks (large single commit, new dependencies, out-of-scope files) run on every PR as non-blocking warnings in the "PR hygiene" workflow summary, so the reviewer sees them before the walkthrough.

## 4. Integrity checks before approving

- Ask the volunteer to walk through the diff and change one thing live.
- The PR description lists what was tested and how.
- Commits are spread over time, not one dump.
- Only files relevant to the issue changed.
- Unfamiliar dependencies were not added.
