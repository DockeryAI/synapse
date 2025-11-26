#!/bin/bash

# Deploy all Edge Functions to Supabase
# This script deploys all functions found in supabase/functions/

echo "🚀 Starting deployment of all Edge Functions..."
echo "================================================"

# Get the list of all functions
FUNCTIONS_DIR="supabase/functions"
FUNCTIONS=$(ls -d $FUNCTIONS_DIR/*/ | xargs -n 1 basename)

# Counter for tracking progress
TOTAL=$(echo "$FUNCTIONS" | wc -l | tr -d ' ')
CURRENT=0
SUCCESS=0
FAILED=0

echo "Found $TOTAL functions to deploy"
echo ""

# Deploy each function
for FUNCTION in $FUNCTIONS; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL] Deploying function: $FUNCTION"
    echo "----------------------------------------"

    if supabase functions deploy "$FUNCTION" --no-verify-jwt; then
        echo "✅ Successfully deployed $FUNCTION"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "❌ Failed to deploy $FUNCTION"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

# Summary
echo "================================================"
echo "📊 Deployment Summary:"
echo "   Total functions: $TOTAL"
echo "   ✅ Successful: $SUCCESS"
if [ $FAILED -gt 0 ]; then
    echo "   ❌ Failed: $FAILED"
else
    echo "   ❌ Failed: 0"
fi
echo "================================================"

if [ $FAILED -eq 0 ]; then
    echo "🎉 All functions deployed successfully!"
    exit 0
else
    echo "⚠️  Some functions failed to deploy. Please check the errors above."
    exit 1
fi