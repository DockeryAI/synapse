# BR3 Governance Skill

Auto-invoked when making code changes to validate against project rules.

## What This Skill Does

1. Reads `.buildrunner/governance/governance.yaml`
2. Validates changes against enforcement rules
3. Blocks commits/pushes that violate rules

## Files to Read

- `.buildrunner/governance/governance.yaml` - Project rules
- `.buildrunner/ARCHITECTURE.md` - Architecture constraints
- `.buildrunner/PROJECT_SPEC.md` - Feature specifications

## Enforcement Rules

- No blocked UI library imports
- No disabling RLS
- No direct API calls from frontend
- Feature status flow must be followed
