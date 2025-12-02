# OpenRouter Parallel Architecture Build Plan

## Overview
Implement multi-account OpenRouter key rotation via the ai-proxy Edge Function to maximize throughput and eliminate rate limit bottlenecks across all LLM operations in Synapse.

## Keys Available (4 total)
- `OPENROUTER_API_KEY_1` - Primary (existing, also as OPENROUTER_API_KEY)
- `OPENROUTER_API_KEY_2` - byronhudson@gmail.com
- `OPENROUTER_API_KEY_3` - Byhudson@yahoo.com
- `OPENROUTER_API_KEY_4` - byron.hudson@opendialog.ai

## Architecture

### Routing: All API calls go through Edge Functions only
- NO direct browser-to-OpenRouter calls
- ai-proxy Edge Function handles all key rotation server-side
- Client passes `keyIndex` parameter to select which key to use

### ai-proxy Edge Function (`supabase/functions/ai-proxy/index.ts`)
**ALREADY SUPPORTS key rotation:**
- Accepts `keyIndex` parameter (0-3)
- Uses `OPENROUTER_API_KEY_${keyIndex + 1}` for each index
- Falls back to default key if numbered key not found
- Supports parallel processing when multiple requests use different keyIndex values

### Client Integration (`src/lib/openrouter.ts`)
**UPDATED to support:**
- `keyIndex` optional parameter in ChatOptions
- `parallelChat()` for concurrent requests with automatic key distribution
- `parallelChatWithPartialResults()` for fault-tolerant parallel execution

### Integration Points

| Service | File | Current State | Impact |
|---------|------|---------------|--------|
| Trigger Synthesis | `llm-trigger-synthesizer.service.ts` | Uses keyIndex | 4x throughput ✅ |
| Content Generation | `content-generation.service.ts` | Uses ai-proxy | Ready for parallel ✅ |
| V5 AI Enhancer | `ai-enhancer.service.ts` | Uses ai-proxy | Ready for parallel ✅ |
| All other services | Various | Use ai-proxy | Ready for parallel ✅ |

## Implementation Status

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] ai-proxy Edge Function already supports keyIndex (lines 67-78)
- [x] lib/openrouter.ts updated with keyIndex and parallelChat functions
- [x] Keys added to local .env for reference

### Phase 2: Deploy Keys to Supabase ⏳ PENDING
- [ ] Add OPENROUTER_API_KEY_1 to Supabase Edge Function secrets
- [ ] Add OPENROUTER_API_KEY_2 to Supabase Edge Function secrets
- [ ] Add OPENROUTER_API_KEY_3 to Supabase Edge Function secrets
- [ ] Add OPENROUTER_API_KEY_4 to Supabase Edge Function secrets
- [ ] Deploy ai-proxy Edge Function

### Phase 3: Use Parallel Features ⏳ READY
Services can now use parallel processing by:
1. Using `parallelChat()` from lib/openrouter.ts
2. Passing `keyIndex` to individual chat() calls
3. Making concurrent requests with different keyIndex values

## Speed Gains Expected

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| V5 Trigger Synthesis | Sequential | 4 parallel | ~4x faster |
| Content Batch (4 posts) | Sequential | 4 parallel | ~4x faster |
| Content Batch (8 posts) | Rate limited | Distributed | No delays |
| Rate Limit Recovery | Wait | Failover | Instant |

## Deployment Commands

```bash
# Add secrets to Supabase (run from project root)
supabase secrets set OPENROUTER_API_KEY_1="sk-or-v1-..."
supabase secrets set OPENROUTER_API_KEY_2="sk-or-v1-..."
supabase secrets set OPENROUTER_API_KEY_3="sk-or-v1-..."
supabase secrets set OPENROUTER_API_KEY_4="sk-or-v1-..."

# Deploy the Edge Function
supabase functions deploy ai-proxy
```

## Risk Mitigation
- No quality degradation (same models, same prompts)
- Graceful fallback if any key fails (to default OPENROUTER_API_KEY)
- Logging for all key usage and errors
- No changes to prompt engineering or output processing

## Success Metrics
- Zero rate limit errors during normal operation
- 4x throughput for LLM-heavy operations
- Sub-second key failover on errors
