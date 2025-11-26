#!/bin/bash

# ============================================================================
# Sync API Keys from .env to Supabase Edge Function Secrets
# ============================================================================
# This script reads API keys from your local .env file and sets them as
# secrets in Supabase Edge Functions using the Supabase CLI
#
# Usage: ./scripts/sync-api-keys.sh
# ============================================================================

set -e

echo "🔄 Syncing API Keys to Supabase Edge Functions..."
echo "================================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and add your API keys."
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not installed!"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Parse the .env file more safely
# This avoids executing any malformed lines
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Remove quotes from value if present
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"

    # Export the variable
    export "$key=$value"
done < .env

echo ""
echo "📝 Setting Edge Function Secrets..."
echo "-----------------------------------"

# Array of API keys to sync (without VITE_ prefix)
declare -a API_KEYS=(
    "OPENROUTER_API_KEY"
    "OPENAI_API_KEY"
    "PERPLEXITY_API_KEY"
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
    "HUME_API_KEY"
    "HUME_SECRET_KEY"
)

# Counter for tracking progress
SUCCESS_COUNT=0
SKIP_COUNT=0
FAIL_COUNT=0

# Sync each API key
for KEY_NAME in "${API_KEYS[@]}"; do
    # Get the value of the environment variable
    KEY_VALUE="${!KEY_NAME}"

    if [ -z "$KEY_VALUE" ] || [ "$KEY_VALUE" = "your_"* ] || [ "$KEY_VALUE" = "sk-"* ] && [ ${#KEY_VALUE} -lt 10 ]; then
        echo "⏩ Skipping $KEY_NAME (not configured)"
        ((SKIP_COUNT++))
    else
        # Mask the key for display (show first 8 chars only)
        MASKED_VALUE="${KEY_VALUE:0:8}..."

        echo -n "🔑 Setting $KEY_NAME ($MASKED_VALUE)... "

        if supabase secrets set "$KEY_NAME=$KEY_VALUE" 2>/dev/null; then
            echo "✅"
            ((SUCCESS_COUNT++))
        else
            echo "❌ Failed"
            ((FAIL_COUNT++))
        fi
    fi
done

echo ""
echo "================================================"
echo "📊 Summary:"
echo "  ✅ Successfully set: $SUCCESS_COUNT secrets"
echo "  ⏩ Skipped (not configured): $SKIP_COUNT"
if [ $FAIL_COUNT -gt 0 ]; then
    echo "  ❌ Failed: $FAIL_COUNT"
fi

# Deploy the Edge Functions that use these secrets
echo ""
echo "🚀 Deploying Edge Functions..."
echo "-----------------------------------"

# Array of Edge Functions to deploy
declare -a EDGE_FUNCTIONS=(
    "ai-proxy"
    "fetch-youtube"
    "fetch-serper"
    "fetch-weather"
    "fetch-news"
    "fetch-seo-metrics"
    "fetch-outscraper"
    "apify-proxy"
    "scrape-website"
    "analyze-website-ai"
    "reddit-oauth"
)

DEPLOY_SUCCESS=0
DEPLOY_FAIL=0

for FUNCTION in "${EDGE_FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$FUNCTION" ]; then
        echo -n "📦 Deploying $FUNCTION... "
        if supabase functions deploy "$FUNCTION" --no-verify-jwt 2>/dev/null; then
            echo "✅"
            ((DEPLOY_SUCCESS++))
        else
            echo "❌ Failed"
            ((DEPLOY_FAIL++))
        fi
    fi
done

echo ""
echo "================================================"
echo "🎉 Sync Complete!"
echo ""
echo "📊 Deployment Summary:"
echo "  ✅ Successfully deployed: $DEPLOY_SUCCESS functions"
if [ $DEPLOY_FAIL -gt 0 ]; then
    echo "  ❌ Failed deployments: $DEPLOY_FAIL"
fi

echo ""
echo "✨ Your API keys are now available to Edge Functions!"
echo ""
echo "🔍 To verify secrets are set:"
echo "   supabase secrets list"
echo ""
echo "🧪 To test Edge Functions:"
echo "   npm run test:edge-functions"
echo ""
echo "🚀 Ready to use your app with all APIs enabled!"