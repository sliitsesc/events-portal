#!/usr/bin/env bash
# Generates a contribution table from GitHub PR data so volunteer work can be
# checked against evidence (linked issue, real code changed, review outcome).
#
# Usage: scripts/contribution-report.sh [--maintainers "user1,user2"] > docs/CONTRIBUTIONS_AUTO.md
# Requires: gh (authenticated), jq
set -euo pipefail

MAINTAINERS=""
if [[ "${1:-}" == "--maintainers" ]]; then MAINTAINERS="${2:-}"; fi

# Files that don't count as authored work.
NOISE='^(package-lock\.json|\.history/|\.next/|node_modules/)'

gh pr list --state all --limit 25 --json \
  number,title,author,state,createdAt,mergedAt,commits,reviews,files,closingIssuesReferences,additions,deletions \
| jq -r --arg noise "$NOISE" --arg maint "$MAINTAINERS" '
  def real_files: [.files[] | select(.path | test($noise) | not)];
  def real_lines: (real_files | map(.additions + .deletions) | add // 0);
  def approvals:  [.reviews[] | select(.state == "APPROVED" and .author.login != null)] | length;
  def changes_req:[.reviews[] | select(.state == "CHANGES_REQUESTED")] | length;
  def flags:
    [ (if (.closingIssuesReferences | length) == 0 then "no-linked-issue" else empty end),
      (if real_lines < 5 then "trivial-diff" else empty end),
      (if (.commits | length) == 1 and real_lines > 300 then "single-large-commit" else empty end),
      (if (real_files | length) == 0 then "noise-only" else empty end),
      (if approvals == 0 and .state == "MERGED" then "merged-without-approval" else empty end),
      (if (.files | map(select(.path | startswith(".history/"))) | length) > 0 then "touches-.history" else empty end)
    ] | join(", ");

  ($maint | split(",") | map(select(length > 0))) as $m
  | [ .[] | select(.author.login as $a | ($m | index($a)) | not) ] as $prs
  | "| Contributor | PRs | Merged | Issues closed | Real lines (+/-) | Review rounds | Flags |",
    "|---|---|---|---|---|---|---|",
    ( $prs | group_by(.author.login)[]
      | { who: .[0].author.login,
          prs: length,
          merged: (map(select(.state == "MERGED")) | length),
          issues: (map(.closingIssuesReferences | map("#\(.number)")) | flatten | unique | join(" ")),
          lines: (map(real_lines) | add),
          rounds: (map(changes_req) | add),
          flags: (map(flags | split(", ") | map(select(length > 0))) | flatten | group_by(.) | map("\(.[0]) ×\(length)") | join(", ")) }
      | "| @\(.who) | \(.prs) | \(.merged) | \(.issues) | \(.lines) | \(.rounds) | \(.flags) |" )
'
