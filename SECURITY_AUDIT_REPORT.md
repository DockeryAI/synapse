# 🔴 CRITICAL SECURITY AUDIT REPORT
**Date**: 2025-11-18
**Status**: DO NOT DEPLOY TO PRODUCTION
**Risk Level**: CRITICAL - API keys exposed in frontend bundle

---

## Executive Summary

**36 files** are currently exposing sensitive API keys through the `VITE_` prefix, making them accessible to anyone with browser DevTools. **25 direct API calls** to OpenRouter from the frontend. This creates an immediate security vulnerability and uncontrollable API costs if deployed.

### Current State
- ✅ **8 Edge Functions** implemented (proper server-side proxies)
- ✅ Repository git history cleaned
- ✅ Netlify site taken down
- 🔴 **36 services** calling OpenRouter API directly from frontend with exposed `VITE_OPENROUTER_API_KEY`
- 🔴 `.env.example` uses `VITE_` prefix for ALL sensitive keys (incorrect pattern)
- 🔴 Frontend code has hardcoded API calls in 25+ locations

---

## 🔍 Detailed Audit Findings

### 1. Exposed API Keys in Codebase (36 occurrences)

#### UVP Wizard Services (6 files)
- `src/components/uvp-wizard/UVPWizard.tsx` - Direct OpenRouter call with exposed key
- `src/services/uvp-wizard/openrouter-ai.ts` - Exposed API key
- `src/services/uvp-wizard/website-analyzer.ts` - Exposed API key
- `src/services/uvp-wizard/rhodes-ai.ts` - Exposed API key
- `src/services/uvp-wizard/SmartUVPExtractor.ts` - Exposed API key
- `src/services/uvp-wizard/perplexity-api.ts` - Exposed API key + OpenAI fallback

#### Industry Detection Services (4 files)
- `src/services/industry/OnDemandProfileGeneration.ts` - Exposed API key
- `src/services/industry/IndustryProfileGenerator.service.ts` - Exposed API key
- `src/services/industry/NAICSDetector.service.ts` - Exposed API key
- `src/services/industry/IndustryCodeDetectionService.ts` - Exposed API key

#### Intelligence Services (2 files)
- `src/services/intelligence/product-scanner.service.ts` - Exposed API key
- `src/services/intelligence/website-analyzer.service.ts` - Exposed API key

#### Synapse Content Generation (6 files)
- `src/services/synapse/SynapseGenerator.ts` - Exposed API key
- `src/services/synapse/analysis/ContrarianAngleDetector.ts` - Exposed API key + throws error
- `src/services/synapse/ConnectionDiscoveryEngine.ts` - Exposed API key + warning
- `src/services/synapse/_ARCHIVED/orchestra/BreakthroughModelOrchestra.ts` - Exposed API key
- `src/services/synapse/_ARCHIVED/models/PerplexityModel.ts` - Exposed API key
- `src/services/synapse/_ARCHIVED/models/AnthropicModel.ts` - Exposed API key
- `src/services/synapse/_ARCHIVED/models/OpenAIModel.ts` - Exposed API key
- `src/services/synapse/_ARCHIVED/models/GoogleModel.ts` - Exposed API key

#### Other Services (2 files)
- `src/services/parallel-intelligence.service.ts` - Exposed API key
- `src/services/buyer-journey-ai.service.ts` - Exposed API key

#### Core Libraries (2 files)
- `src/lib/openrouter.ts` - Exposed API key + warning
- `src/vite-env.d.ts` - Type definition exposes key pattern

#### Test Files (1 file)
- `src/test/setup.ts` - Test environment setup (acceptable for testing)

### 2. Direct OpenRouter API Calls (25 occurrences)
All calls to `https://openrouter.ai/api/v1/chat/completions` from frontend code with exposed bearer tokens.

### 3. `.env.example` Security Issues

**Incorrectly Exposed Keys** (should NOT have VITE_ prefix):
```
Line 42: VITE_OPENROUTER_API_KEY
Line 43: OPENROUTER_API_KEY
Line 49: VITE_OPENAI_API_KEY
Line 50: OPENAI_API_KEY
Line 55-58: VITE_HUME_API_KEY, HUME_API_KEY, VITE_HUME_SECRET_KEY, HUME_SECRET_KEY
Line 63-64: VITE_PERPLEXITY_API_KEY, PERPLEXITY_API_KEY
Line 73-74: VITE_APIFY_API_KEY, APIFY_API_KEY
Line 79-80: VITE_OUTSCRAPER_API_KEY, OUTSCRAPER_API_KEY
Line 85-86: VITE_SERPER_API_KEY, SERPER_API_KEY
Line 91-92: VITE_SEMRUSH_API_KEY, SEMRUSH_API_KEY
Line 97-98: VITE_YOUTUBE_API_KEY, YOUTUBE_API_KEY
Line 103-104: VITE_NEWS_API_KEY, NEWS_API_KEY
Line 109-110: VITE_WEATHER_API_KEY, WEATHER_API_KEY
Line 123-128: VITE_REDDIT_* keys
```

**Correctly Public Keys** (safe to have VITE_ prefix):
```
Line 13: VITE_SUPABASE_URL ✅
Line 14: VITE_SUPABASE_ANON_KEY ✅ (this is designed to be public)
```

**NEVER expose with VITE_ prefix:**
```
Line 15: VITE_SUPABASE_SERVICE_ROLE_KEY ❌ CRITICAL - Full database access!
```

---

## 🚨 Existing Secure Edge Functions

Good news! You already have 8 properly secured Edge Functions:

1. **analyze-website-ai** - AI website analysis proxy
2. **scrape-website** - Web scraping proxy
3. **fetch-weather** - Weather API proxy
4. **generate-content** - Content generation proxy
5. **enrich-with-synapse** - Synapse enrichment proxy
6. **reddit-oauth** - Reddit OAuth handler
7. **fetch-news** - News API proxy
8. **fetch-seo-metrics** - SEO metrics proxy

These functions correctly use `Deno.env.get()` to fetch keys server-side.

---

## 📋 Migration Action Plan

### PHASE 1: Immediate Security (PRE-DEPLOYMENT) - 1-2 Days

#### 1.1 API Key Rotation
- [ ] Revoke ALL exposed API keys immediately:
  - OpenRouter API key
  - Apify API key
  - OutScraper API key
  - Serper API key
  - All other exposed keys
- [ ] Generate new API keys
- [ ] Store new keys ONLY in Supabase Project Settings → Edge Functions → Secrets

#### 1.2 Supabase Edge Function Secrets Setup
Navigate to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Add these secrets (NO VITE_ prefix):
```bash
OPENROUTER_API_KEY=sk-or-v1-NEW_KEY_HERE
APIFY_API_KEY=apify_api_NEW_KEY_HERE
OUTSCRAPER_API_KEY=NEW_KEY_HERE
SERPER_API_KEY=NEW_KEY_HERE
SEMRUSH_API_KEY=NEW_KEY_HERE
YOUTUBE_API_KEY=NEW_KEY_HERE
NEWS_API_KEY=NEW_KEY_HERE
WEATHER_API_KEY=NEW_KEY_HERE
REDDIT_CLIENT_ID=NEW_ID_HERE
REDDIT_CLIENT_SECRET=NEW_SECRET_HERE
OPENAI_API_KEY=sk-proj-NEW_KEY_HERE
HUME_API_KEY=NEW_KEY_HERE
HUME_SECRET_KEY=NEW_SECRET_HERE
PERPLEXITY_API_KEY=pplx-NEW_KEY_HERE
```

#### 1.3 Update .env.example
Create new `.env.example` with correct security patterns (see Phase 3 for full template).

---

### PHASE 2: Backend Proxy Migration - 3-5 Days

#### 2.1 Create Universal AI Proxy Edge Function

Create `supabase/functions/ai-proxy/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { provider, messages, model, temperature } = await req.json()

    // Get API key from environment based on provider
    const apiKeys = {
      'openrouter': Deno.env.get('OPENROUTER_API_KEY'),
      'perplexity': Deno.env.get('PERPLEXITY_API_KEY'),
      'openai': Deno.env.get('OPENAI_API_KEY'),
    }

    const apiKey = apiKeys[provider]
    if (!apiKey) {
      throw new Error(`No API key configured for provider: ${provider}`)
    }

    // Proxy request to appropriate AI provider
    const endpoints = {
      'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
      'perplexity': 'https://api.perplexity.ai/chat/completions',
      'openai': 'https://api.openai.com/v1/chat/completions',
    }

    const response = await fetch(endpoints[provider], {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, model, temperature }),
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

#### 2.2 Update Frontend Services (36 files to migrate)

Replace all `import.meta.env.VITE_OPENROUTER_API_KEY` with calls to Edge Function.

**Example migration:**

**Before:**
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ messages, model })
})
```

**After:**
```typescript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    provider: 'openrouter',
    messages,
    model
  })
})
```

#### 2.3 Files Requiring Migration (Priority Order)

**High Priority** (user-facing features):
1. `src/components/uvp-wizard/UVPWizard.tsx`
2. `src/services/uvp-wizard/openrouter-ai.ts`
3. `src/services/uvp-wizard/SmartUVPExtractor.ts`
4. `src/services/synapse/SynapseGenerator.ts`
5. `src/services/parallel-intelligence.service.ts`

**Medium Priority** (core services):
6. `src/services/industry/*` (4 files)
7. `src/services/intelligence/*` (2 files)
8. `src/services/synapse/analysis/ContrarianAngleDetector.ts`
9. `src/services/buyer-journey-ai.service.ts`

**Low Priority** (archived/fallback):
10. `src/services/synapse/_ARCHIVED/*` (5 files)
11. `src/lib/openrouter.ts`

---

### PHASE 3: Environment Variable Cleanup - 1 Day

#### 3.1 Create New .env.example Template

```bash
# ============================================================================
# SYNAPSE SMB PLATFORM - ENVIRONMENT VARIABLES (SECURE VERSION)
# ============================================================================
# SECURITY NOTICE:
# - VITE_ prefix = bundled into client JavaScript = PUBLIC
# - No VITE_ prefix = server-side only = PRIVATE
# - NEVER use VITE_ for API keys, secrets, or service role keys!
# ============================================================================

# ----------------------------------------------------------------------------
# ✅ PUBLIC VARIABLES (Safe to expose with VITE_ prefix)
# ----------------------------------------------------------------------------
# These are DESIGNED to be public and included in client bundle

# Supabase Public Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here  # This key is rate-limited and safe

# App Configuration
VITE_APP_NAME=Synapse
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=false
VITE_USE_MOCK_DATA=false

# ----------------------------------------------------------------------------
# 🔒 PRIVATE VARIABLES (Server-side only - NO VITE_ prefix!)
# ----------------------------------------------------------------------------
# These are accessed ONLY by Supabase Edge Functions via Deno.env.get()
# Add these to: Supabase Dashboard → Settings → Edge Functions → Secrets

# ⚠️ CRITICAL - Full database access - NEVER expose with VITE_!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_PASSWORD=your_database_password_here

# AI Services (accessed via Edge Functions only)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
HUME_API_KEY=your-key-here
HUME_SECRET_KEY=your-secret-here

# Intelligence APIs (accessed via Edge Functions only)
APIFY_API_KEY=apify_api_your-key-here
OUTSCRAPER_API_KEY=your-key-here
SERPER_API_KEY=your-key-here
SEMRUSH_API_KEY=your-key-here
YOUTUBE_API_KEY=your-key-here
NEWS_API_KEY=your-key-here
WEATHER_API_KEY=your-key-here

# Reddit API (accessed via Edge Functions only)
REDDIT_CLIENT_ID=your-client-id
REDDIT_CLIENT_SECRET=your-client-secret
REDDIT_USER_AGENT=YourApp/1.0

# Source Databases (for migration only)
MARBA_SUPABASE_URL=https://your-marba-project.supabase.co
MARBA_SUPABASE_ANON_KEY=your-key-here
MARBA_SUPABASE_SERVICE_ROLE_KEY=your-key-here

# ----------------------------------------------------------------------------
# 📝 SETUP INSTRUCTIONS
# ----------------------------------------------------------------------------
# 1. Copy this file to .env
# 2. Fill in ONLY the VITE_ variables above
# 3. Add ALL other secrets to Supabase Edge Functions Secrets
# 4. NEVER commit .env to version control
# 5. Deploy Edge Functions with: supabase functions deploy
```

#### 3.2 Delete Dangerous Environment Variables

Remove from local `.env` (if they exist):
- All `VITE_*_API_KEY` variables except Supabase public keys
- All `VITE_*_SECRET` variables
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

---

### PHASE 4: Security Verification - 1 Day

#### 4.1 Automated Security Scan

Run these commands:

```bash
# 1. Check for VITE_ API keys in source code
grep -r "VITE_.*API_KEY\|VITE_.*SECRET" src/ --exclude-dir=node_modules
# Expected: ONLY VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 2. Build production bundle
npm run build

# 3. Search compiled bundle for exposed keys
grep -r "sk-or-v1\|sk-proj-\|apify_api\|pplx-" dist/
# Expected: NO RESULTS (empty output)

# 4. Check for direct OpenRouter calls
grep -r "openrouter.ai/api" dist/
# Expected: NO RESULTS

# 5. Verify Edge Function calls
grep -r "supabase.co/functions" dist/
# Expected: MANY RESULTS (all AI calls should route through Edge Functions)
```

#### 4.2 Manual Testing Checklist

- [ ] UVP Wizard generates suggestions (via Edge Function)
- [ ] Campaign generation works (via Edge Function)
- [ ] Industry detection works (via Edge Function)
- [ ] No API keys visible in browser DevTools → Network tab
- [ ] No API keys in View Page Source
- [ ] Edge Function logs show successful API calls in Supabase Dashboard

#### 4.3 Production Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev vite-bundle-visualizer

# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Check for any leaked secrets in chunks
```

---

### PHASE 5: Safe Deployment - 1 Day

#### 5.1 Deploy Edge Functions

```bash
# Deploy all Edge Functions to Supabase
supabase functions deploy ai-proxy
supabase functions deploy analyze-website-ai
supabase functions deploy generate-content
# ... deploy all functions

# Verify deployment
supabase functions list
```

#### 5.2 Deploy to Netlify

**Netlify Environment Variables** (Dashboard → Site Settings → Environment Variables):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**That's it!** All other secrets are in Supabase Edge Function Secrets.

#### 5.3 Configure Custom Domain

1. Add custom domain in Netlify
2. Update CORS in Edge Functions to allow custom domain:

```typescript
// In each Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-custom-domain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

#### 5.4 Post-Deployment Verification

**Critical checks after deployment:**

1. **Load site in incognito window**
2. **Open DevTools → Network tab**
3. **Generate a campaign or UVP suggestion**
4. **Verify**:
   - [ ] All AI calls go to `*.supabase.co/functions/*`
   - [ ] NO calls to `openrouter.ai` from browser
   - [ ] NO API keys in request headers
   - [ ] Response includes AI-generated content

5. **View Page Source (Ctrl+U)**
6. **Search for**:
   - [ ] "sk-or-v1" → Should find: **0 results**
   - [ ] "sk-proj-" → Should find: **0 results**
   - [ ] "apify_api" → Should find: **0 results**
   - [ ] "VITE_OPENROUTER" → Should find: **0 results**

7. **Check Supabase Dashboard**:
   - [ ] Edge Function logs show successful requests
   - [ ] No rate limit errors
   - [ ] Billing reflects Edge Function usage (not client-side API usage)

---

## ⏱️ Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 1-2 days | Rotate keys, update Supabase secrets, update .env.example |
| Phase 2 | 3-5 days | Migrate 36 files to Edge Function proxy pattern |
| Phase 3 | 1 day | Clean up environment variables, documentation |
| Phase 4 | 1 day | Security scanning, testing, bundle analysis |
| Phase 5 | 1 day | Deploy Edge Functions, deploy to Netlify, verify |
| **TOTAL** | **7-10 days** | **Safe for single developer, thorough approach** |

---

## 🎯 Success Criteria

### Before Deployment
- ✅ Zero `VITE_*` API keys in `.env.example` (except Supabase URL/anon key)
- ✅ Zero direct OpenRouter calls from frontend code
- ✅ All AI features route through Edge Functions
- ✅ Production build contains zero API keys in JavaScript
- ✅ All API keys rotated (old ones revoked)

### After Deployment
- ✅ Site loads successfully on custom domain
- ✅ All features work correctly
- ✅ DevTools Network tab shows NO calls to openrouter.ai from browser
- ✅ Page source contains NO API keys
- ✅ Supabase billing shows Edge Function usage

---

## 🚨 Risk Assessment

| Status | Risk Level | Description |
|--------|------------|-------------|
| **Current** | 🔴 **CRITICAL** | All API keys in compiled JavaScript, accessible to anyone |
| **After Phase 2** | 🟡 **MEDIUM** | Most services secured, some legacy code remains |
| **After Phase 5** | 🟢 **LOW** | Industry-standard security, all keys server-side |

---

## 📝 Next Steps

1. **Review this audit report**
2. **Get approval for timeline and approach**
3. **Begin Phase 1: Immediate Security**
4. **Track progress in SECURITY_MIGRATION_TRACKER.md** (to be created)

---

**Report Generated**: 2025-11-18
**Last Updated**: 2025-11-18
**Auditor**: Claude Code (Automated Security Audit)
