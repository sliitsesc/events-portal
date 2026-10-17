#!/usr/bin/env bash
# Flags process-evidence problems on a PR for the reviewer. Never fails the build.
#
# Usage: scripts/pr-process-check.sh <base-sha> <head-sha> "<pr body>"
# Prints one "flag|detail" line per finding. Requires git and jq.
set -euo pipefail

BASE="$1"; HEAD="$2"; BODY="${3:-}"
SCOPE_FILE="$(dirname "$0")/../.github/issue-scope.json"
NOISE='^(package-lock\.json|\.history/|\.next/|node_modules/)'
LARGE_LINES=300

files=$(git diff --name-only "$BASE" "$HEAD")

# 1. One huge commit
commits=$(git rev-list --count "$BASE..$HEAD")
lines=$(git diff --numstat "$BASE" "$HEAD" \
  | awk -v noise="$NOISE" '$3 !~ noise { a += $1 + $2 } END { print a + 0 }')
if [[ "$commits" -eq 1 && "$lines" -gt "$LARGE_LINES" ]]; then
  echo "single-large-commit|1 commit with $lines changed lines"
fi

# 2. New dependencies (names present in HEAD's package.json but not in BASE's)
if grep -qx 'package.json' <<<"$files"; then
  names() { git show "$1:package.json" 2>/dev/null | jq -r '(.dependencies // {}) + (.devDependencies // {}) | keys[]' | sort; }
  added=$(comm -13 <(names "$BASE") <(names "$HEAD") | tr '\n' ' ')
  if [[ -n "${added// /}" ]]; then
    echo "adds-dependency|$added"
  fi
fi

# 3. Files outside the linked issue's scope
issue=$(grep -Eio '(close[sd]?|fix(e[sd])?|resolve[sd]?) +#[0-9]+' <<<"$BODY" | grep -Eo '[0-9]+' | head -1 || true)
if [[ -n "$issue" ]]; then
  prefixes=$(jq -r --arg n "$issue" '.[$n] // empty | .[]' "$SCOPE_FILE")
  if [[ -n "$prefixes" ]]; then
    outside=()
    while IFS= read -r f; do
      [[ -z "$f" || "$f" =~ $NOISE ]] && continue
      ok=0
      while IFS= read -r p; do
        [[ "$f" == "$p"* ]] && { ok=1; break; }
      done <<<"$prefixes"
      [[ $ok -eq 0 ]] && outside+=("$f")
    done <<<"$files"
    if [[ ${#outside[@]} -gt 0 ]]; then
      echo "out-of-scope|issue #$issue: ${outside[*]}"
    fi
  fi
fi
