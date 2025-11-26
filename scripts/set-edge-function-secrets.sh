#!/bin/bash

# Set API secrets for Supabase Edge Functions
# This script reads from .env and sets secrets in Supabase

echo "🔐 Setting up Edge Function Secrets..."
echo "================================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please create it from .env.example"
    exit 1
fi

# Source the .env file to load variables
set -a
source .env
set +a

echo "📝 Found .env file, extracting API keys..."
echo ""

# List of all API key variables (without VITE_ prefix, as they're server-side only)
API_KEYS=(
    "OPENROUTER_API_KEY"
    "PERPLEXITY_API_KEY"
    "OPENAI_API_KEY"
    "HUME_API_KEY"
    "HUME_SECRET_KEY"
    "APIFY_API_KEY"
    "OUTSCRAPER_API_KEY"
    "SERPER_API_KEY"
    "SEMRUSH_API_KEY"
    "YOUTUBE_API_KEY"
    "NEWS_API_KEY"
    "WEATHER_API_KEY"
    "REDDIT_CLIENT_ID"
    "REDDIT_CLIENT_SECRET"
    "REDDIT_USER_AGENT"
)

# Count for tracking
TOTAL=${#API_KEYS[@]}
SUCCESS=0
FAILED=0
SKIPPED=0

echo "Found $TOTAL API keys to configure"
echo ""

# Set each secret
for KEY_NAME in "${API_KEYS[@]}"; do
    echo "Processing: $KEY_NAME"

    # Get the value of the variable
    KEY_VALUE="${!KEY_NAME}"

    # Check if the key has a value
    if [ -z "$KEY_VALUE" ] || [[ "$KEY_VALUE" == *"your"* ]] || [[ "$KEY_VALUE" == *"here"* ]]; then
        echo "   ⏭️  Skipping $KEY_NAME (not configured or placeholder value)"
        SKIPPED=$((SKIPPED + 1))
    else
        # Set the secret in Supabase
        if supabase secrets set "$KEY_NAME=$KEY_VALUE" 2>/dev/null; then
            # Mask the value for security
            MASKED_VALUE="${KEY_VALUE:0:8}...${KEY_VALUE: -4}"
            echo "   ✅ Set $KEY_NAME (${MASKED_VALUE})"
            SUCCESS=$((SUCCESS + 1))
        else
            echo "   ❌ Failed to set $KEY_NAME"
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo ""
echo "================================================"
echo "📊 Secret Configuration Summary:"
echo "   Total keys: $TOTAL"
echo "   ✅ Configured: $SUCCESS"
if [ $SKIPPED -gt 0 ]; then
    echo "   ⏭️  Skipped (not set): $SKIPPED"
fi
if [ $FAILED -gt 0 ]; then
    echo "   ❌ Failed: $FAILED"
fi
echo "================================================"

# Deploy the secrets to make them available
echo ""
echo "🚀 Making secrets available to Edge Functions..."

# We need to restart functions for secrets to take effect
# This is done automatically by Supabase

echo ""
if [ $SUCCESS -gt 0 ]; then
    echo "✅ Successfully configured $SUCCESS API secrets!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the Edge Functions with: npm run test:edge-functions"
    echo "   2. Check function logs in Supabase Dashboard"
    echo "   3. Verify API responses in the application"

    if [ $SKIPPED -gt 0 ]; then
        echo ""
        echo "⚠️  Note: $SKIPPED API keys were skipped because they're not configured."
        echo "   To use all features, add the missing keys to your .env file."
    fi
else
    echo "⚠️  No API secrets were configured. Please check your .env file."
fi

echo ""
echo "================================================"
echo "🔗 View your Edge Functions at:"
echo "   https://supabase.com/dashboard/project/jpwljchikgmggjidogon/functions"
echo "================================================"