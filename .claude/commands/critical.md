# Add a file to the Critical Files list

When the user types `/critical <file_path>`, analyze the file and add it to the Critical Files section in `.buildrunner/ARCHITECTURE.md`.

## Steps

1. **Verify file exists** - Read the file to confirm it's valid
2. **Analyze criticality metrics:**
   - Count imports: `grep -r "from.*<filename>" src/ --include="*.ts" --include="*.tsx" | wc -l`
   - Count lines: `wc -l <file_path>`
   - Check for critical patterns: exported contexts, hooks, types, DB connections
3. **Determine category** based on file location and purpose:
   - CORE: `lib/`, types, main entry points
   - CONTEXTS: `contexts/`
   - HOOKS: `hooks/`
   - SERVICES: `services/`
   - PAGES: `pages/`
   - CONFIG: `config/`
4. **Add to ARCHITECTURE.md** in the appropriate table within the Critical Files section
5. **Confirm addition** with the file's metrics

## Arguments

$ARGUMENTS - The file path to add (relative to project root, e.g., `src/hooks/useAuth.ts`)

## Example

User: `/critical src/hooks/useNewFeature.ts`

Output:
```
Analyzing src/hooks/useNewFeature.ts...
- Imported by: 12 files
- Lines: 245
- Category: HOOKS

Added to Critical Files in ARCHITECTURE.md:
| src/hooks/useNewFeature.ts | 12 | 245 | [description based on analysis] |
```
