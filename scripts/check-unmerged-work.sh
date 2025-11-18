#!/bin/bash
# Safety Check: Verify all feature branches are merged before starting new work
# This prevents losing completed work from unmerged branches

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  UNMERGED WORK SAFETY CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Checking all feature branches for unmerged commits..."
echo ""

# List of all known feature branches
branches=(
  "feature/campaign-generation-pipeline"
  "feature/analytics-tracking"
  "feature/e2e-testing"
  "feature/error-handling"
  "feature/publishing-integration"
  "feature/content-mixer"
  "feature/smart-picks"
  "feature/campaign-selector"
  "feature/campaign-preview"
  "feature/uvp-extraction"
  "feature/insights-dashboard"
  "feature/business-analyzer"
  "feature/auto-scheduler"
  "feature/funnel-tracker"
  "feature/database-optimization"
)

found_unmerged=0
unmerged_branches=()

for branch in "${branches[@]}"; do
  # Check if branch exists
  if git rev-parse --verify "$branch" >/dev/null 2>&1; then
    # Count unmerged commits
    count=$(git log main.."$branch" --oneline 2>/dev/null | wc -l | tr -d ' ')

    if [ "$count" -gt "0" ]; then
      echo -e "${RED}⚠️  WARNING: $branch has $count unmerged commit(s)${NC}"
      echo ""

      # Show recent commits
      echo "   Recent commits:"
      git log main.."$branch" --oneline --color=always | head -3 | sed 's/^/   /'
      echo ""

      # Show files changed
      echo "   Files changed:"
      git diff --name-only main..."$branch" | head -10 | sed 's/^/   - /'
      file_count=$(git diff --name-only main..."$branch" | wc -l | tr -d ' ')
      if [ "$file_count" -gt 10 ]; then
        echo "   ... and $((file_count - 10)) more files"
      fi
      echo ""

      # Show merge command
      echo -e "   ${YELLOW}To merge:${NC} git merge $branch --no-ff"
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""

      found_unmerged=1
      unmerged_branches+=("$branch")
    else
      echo -e "${GREEN}✅ $branch: fully merged${NC}"
    fi
  else
    # Branch doesn't exist - that's fine
    continue
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $found_unmerged -eq 1 ]; then
  echo -e "${RED}❌ UNMERGED WORK DETECTED${NC}"
  echo ""
  echo "Found ${#unmerged_branches[@]} branch(es) with unmerged commits:"
  for branch in "${unmerged_branches[@]}"; do
    echo "  - $branch"
  done
  echo ""
  echo "⚠️  RECOMMENDATION: Merge these branches before starting new work"
  echo "   to avoid losing completed features!"
  echo ""
  echo "See: docs/development/WORKTREE_WORKFLOW.md for merge workflow"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
else
  echo -e "${GREEN}✅ ALL FEATURE BRANCHES MERGED - SAFE TO PROCEED!${NC}"
  echo ""
  echo "No unmerged work detected. You can safely start new development."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi
