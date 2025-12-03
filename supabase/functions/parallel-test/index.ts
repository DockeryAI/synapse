/**
 * Parallel Test Edge Function
 *
 * Tests TRUE parallelism with 4 different OpenRouter API keys
 * Each call is a simple "say hi" to minimize response time
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-opus-4.5'; // Test with same model as production

function getApiKey(keyIndex: number): string {
  const numberedKey = Deno.env.get(`OPENROUTER_API_KEY_${keyIndex + 1}`);
  if (numberedKey && numberedKey.length > 10) {
    return numberedKey;
  }
  const defaultKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!defaultKey) {
    throw new Error('No API key available');
  }
  return defaultKey;
}

async function simpleCall(keyIndex: number, startTime: number): Promise<{ keyIndex: number; startedAt: number; completedAt: number; duration: number }> {
  const startedAt = Date.now() - startTime;
  console.log(`[Call ${keyIndex + 1}] STARTED at +${startedAt}ms`);

  const apiKey = getApiKey(keyIndex);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://synapse-smb.com',
      'X-Title': 'Parallel Test',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: `Say "Hello from key ${keyIndex + 1}" in exactly 5 words.` }],
      max_tokens: 50,
      temperature: 0,
    }),
  });

  const completedAt = Date.now() - startTime;
  const duration = completedAt - startedAt;

  console.log(`[Call ${keyIndex + 1}] COMPLETED at +${completedAt}ms (took ${duration}ms)`);

  return { keyIndex: keyIndex + 1, startedAt, completedAt, duration };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('========================================');
  console.log('PARALLEL TEST - 4 CALLS WITH 4 KEYS');
  console.log('========================================');

  // Log which keys are available
  for (let i = 1; i <= 4; i++) {
    const key = Deno.env.get(`OPENROUTER_API_KEY_${i}`);
    console.log(`Key ${i}: ${key ? `${key.slice(0, 10)}...${key.slice(-4)}` : 'NOT SET'}`);
  }

  try {
    // Fire ALL 4 calls simultaneously
    console.log('\n>>> FIRING ALL 4 CALLS NOW <<<\n');

    const results = await Promise.all([
      simpleCall(0, startTime),
      simpleCall(1, startTime),
      simpleCall(2, startTime),
      simpleCall(3, startTime),
    ]);

    const totalTime = Date.now() - startTime;

    console.log('\n========================================');
    console.log('RESULTS:');
    console.log('========================================');
    results.forEach(r => {
      console.log(`Key ${r.keyIndex}: started +${r.startedAt}ms, completed +${r.completedAt}ms, duration ${r.duration}ms`);
    });
    console.log(`\nTOTAL TIME: ${totalTime}ms`);
    console.log(`If parallel: should be ~max(durations) ≈ ${Math.max(...results.map(r => r.duration))}ms`);
    console.log(`If sequential: should be ~sum(durations) ≈ ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
    console.log('========================================');

    return new Response(
      JSON.stringify({
        success: true,
        totalTime,
        results,
        analysis: {
          maxDuration: Math.max(...results.map(r => r.duration)),
          sumDuration: results.reduce((sum, r) => sum + r.duration, 0),
          isParallel: totalTime < results.reduce((sum, r) => sum + r.duration, 0) * 0.6,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Test failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

console.log('[Parallel-Test] Ready');
