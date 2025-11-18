# AI Proxy Edge Function

Universal AI proxy for secure server-side API calls to multiple AI providers.

## Security Benefits

This Edge Function solves a critical security issue: **API keys must never be exposed in client-side JavaScript**. By proxying all AI requests through this server-side function, API keys remain secure in Supabase Edge Function secrets.

### Before (INSECURE):
```typescript
// ❌ WRONG: API key exposed in client bundle
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}` // EXPOSED!
  }
});
```

### After (SECURE):
```typescript
// ✅ CORRECT: API key stays server-side
const response = await fetch('${VITE_SUPABASE_URL}/functions/v1/ai-proxy', {
  headers: {
    'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});
```

## Supported Providers

- **OpenRouter** - Access to Claude, GPT-4, and 200+ models
- **Perplexity** - Research and real-time information
- **OpenAI** - GPT models (fallback/alternative)

## Setup & Deployment

### 1. Set Environment Secrets

In Supabase Dashboard: Settings → Edge Functions → Secrets

```bash
# Required secrets (at least one provider)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
```

Or via CLI:
```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-key-here
supabase secrets set PERPLEXITY_API_KEY=pplx-your-key-here
supabase secrets set OPENAI_API_KEY=sk-proj-your-key-here
```

### 2. Deploy Function

```bash
supabase functions deploy ai-proxy
```

### 3. Test Deployment

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-proxy \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openrouter",
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

## API Reference

### Request Format

```typescript
interface AIProxyRequest {
  provider: 'openrouter' | 'perplexity' | 'openai';  // Required
  model: string;                                      // Required
  messages: Array<{                                   // Required
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;                               // Optional (default: 0.7)
  max_tokens?: number;                                // Optional
  stream?: boolean;                                   // Optional (default: false)
}
```

### Response Format

**Success:**
```json
{
  "id": "gen-...",
  "model": "anthropic/claude-3.5-sonnet",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

**Error:**
```json
{
  "error": "API key not configured for provider: openrouter",
  "provider": "openrouter"
}
```

## Usage Examples

### Example 1: OpenRouter (Claude Sonnet)

```typescript
const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Generate a UVP for a bakery.' }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
});

const data = await response.json();
const aiResponse = data.choices[0].message.content;
```

### Example 2: Perplexity (Research)

```typescript
const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'perplexity',
    model: 'llama-3.1-sonar-large-128k-online',
    messages: [
      { role: 'user', content: 'What are the latest trends in B2B SaaS marketing?' }
    ]
  })
});

const data = await response.json();
const research = data.choices[0].message.content;
```

### Example 3: OpenAI (GPT-4)

```typescript
const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'user', content: 'Analyze this customer feedback...' }
    ],
    temperature: 0.5
  })
});

const data = await response.json();
const analysis = data.choices[0].message.content;
```

## Migrating Existing Code

### Before (Client-side API calls):

```typescript
// ❌ INSECURE
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});
```

### After (Edge Function proxy):

```typescript
// ✅ SECURE
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});
```

**Key changes:**
1. URL: `openrouter.ai/api/...` → `${VITE_SUPABASE_URL}/functions/v1/ai-proxy`
2. Authorization: Use Supabase anon key instead of provider API key
3. Body: Add `provider` field, keep other fields the same

## Error Handling

```typescript
try {
  const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: 'Hello!' }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('AI Proxy Error:', error);
    throw new Error(error.error || 'AI request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;

} catch (error) {
  console.error('Failed to call AI proxy:', error);
  throw error;
}
```

## Local Development

Test locally with Supabase CLI:

```bash
# Start local Edge Function
supabase functions serve ai-proxy

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ai-proxy \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openrouter",
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

## Security Notes

1. **Never use `VITE_` prefix for AI provider API keys** - This exposes them in the client bundle
2. **Always store API keys in Supabase Edge Function secrets** - They stay server-side
3. **Use `VITE_SUPABASE_ANON_KEY` for auth** - This is public and safe to expose
4. **Monitor usage** - Set up billing alerts for your AI providers

## Troubleshooting

### "API key not configured for provider"
- Ensure secrets are set in Supabase Dashboard or via CLI
- Redeploy function after adding secrets: `supabase functions deploy ai-proxy`

### "Provider returned error: 401"
- Check that API key is valid
- Verify key has correct permissions for the provider

### "Provider returned error: 429"
- Rate limit reached on provider
- Implement exponential backoff in client code
- Consider request queuing

### CORS errors
- Ensure you're using POST method
- Check that `Authorization` header is included
- Verify Supabase URL is correct

## Migration Progress

As of Week 1 security migration:
- ✅ Edge Function created
- 🔄 18 files to migrate (UVP, Industry, Intelligence, Synapse)
- ⏳ 18 remaining files (Week 2)

## Related Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Perplexity API Docs](https://docs.perplexity.ai/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [SECURITY_AUDIT_REPORT.md](../../../SECURITY_AUDIT_REPORT.md) - Full security audit
- [WEEK1_BUILD_STRATEGY.md](../../../WEEK1_BUILD_STRATEGY.md) - Migration plan
