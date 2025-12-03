# BR3 Debug Skill

Auto-invoked when errors occur to provide debugging assistance.

## What This Skill Does

1. Reads error output
2. Checks `.buildrunner/autodebug.yaml` for debug config
3. Suggests fixes based on error patterns

## Common Error Patterns

- Import errors → Check package.json / requirements.txt
- Type errors → Check TypeScript config
- RLS errors → Check Supabase policies
- API errors → Check edge function logs
