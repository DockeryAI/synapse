#!/bin/bash
# Script to fix Date to string conversions in TypeScript test files

echo "Fixing Date/string type mismatches in test files..."

# Fix campaign-arc-generator.test.ts
sed -i.bak \
  -e "s/startDate: new Date('2024-01-01')/startDate: '2024-01-01T00:00:00.000Z'/g" \
  -e "s/new Date('2024-01-15')/'2024-01-15T00:00:00.000Z'/g" \
  -e "s/new Date('2024-01-01')/'2024-01-01T00:00:00.000Z'/g" \
  src/__tests__/v2/services/campaign-arc-generator.test.ts

# Fix all test files with Date instances
find src/__tests__ -name "*.test.ts*" -type f -exec sed -i.bak \
  -e "s/new Date('\\([0-9-]*\\)')/'\1T00:00:00.000Z'/g" \
  {} \;

# Clean up backup files
find src/__tests__ -name "*.bak" -delete

# Find files that still use .getTime() on strings (need manual fixing)
echo "Checking for remaining .getTime() issues..."
grep -r "\.getTime()" src/__tests__/v2/ | grep -v ".bak" || echo "No .getTime() issues found"

echo "Done! Running TypeScript check..."
npx tsc --noEmit 2>&1 | grep -c "error TS"
