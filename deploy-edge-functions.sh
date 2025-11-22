#!/bin/bash

echo "🚀 Deploying Edge Functions for Secure API Key Storage"
echo "======================================================"
echo ""

# Deploy all edge functions
echo "📦 Deploying fetch-youtube..."
supabase functions deploy fetch-youtube

echo ""
echo "📦 Deploying fetch-outscraper..."
supabase functions deploy fetch-outscraper

echo ""
echo "📦 Deploying fetch-serper..."
supabase functions deploy fetch-serper

echo ""
echo "======================================================"
echo "✅ Deployment complete!"
echo ""
echo "🔐 Now set the API keys in Supabase secrets:"
echo ""
echo "supabase secrets set YOUTUBE_API_KEY=AIzaSyCB29PRSIgUiDxWz8szAtDnx-I1pZXEveY"
echo "supabase secrets set OUTSCRAPER_API_KEY=\$(grep OUTSCRAPER_API_KEY .env | cut -d '=' -f2)"
echo "supabase secrets set SERPER_API_KEY=\$(grep SERPER_API_KEY .env | cut -d '=' -f2)"
echo ""
echo "Or go to: Supabase Dashboard → Settings → Edge Functions → Secrets"
echo "======================================================"
