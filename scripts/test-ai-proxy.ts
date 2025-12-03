#!/usr/bin/env tsx

/**
 * Test script to verify ai-proxy Edge Function is working
 * Emulates what the industry profile generator does
 */

import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}
const AI_PROXY_URL = `${SUPABASE_URL}/functions/v1/ai-proxy`

async function testAiProxy() {
  console.log('🧪 Testing ai-proxy Edge Function...\n')

  console.log('URL:', AI_PROXY_URL)
  console.log('Provider: openrouter')
  console.log('Model: anthropic/claude-opus-4.1\n')

  const requestBody = {
    provider: 'openrouter',
    model: 'anthropic/claude-opus-4.1',
    messages: [
      {
        role: 'user',
        content: 'Respond with exactly: "AI Proxy is working correctly"'
      }
    ],
    temperature: 0.7,
    max_tokens: 100
  }

  console.log('📤 Making request...\n')

  try {
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Response Status:', response.status)
    console.log('Response Headers:')
    response.headers.forEach((value, key) => {
      if (key.includes('access-control') || key === 'content-type') {
        console.log(`  ${key}: ${value}`)
      }
    })
    console.log('')

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error Response:', errorText)
      process.exit(1)
    }

    const data = await response.json()

    console.log('✅ Success!\n')
    console.log('Response Data:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')

    // Extract the actual message
    if (data.choices && data.choices[0]?.message?.content) {
      console.log('🤖 AI Response:', data.choices[0].message.content)
    }

    console.log('\n✅ ai-proxy is working correctly!')
    console.log('CORS headers are present and the function is responding.')

  } catch (error: any) {
    console.error('❌ Test Failed:', error.message)

    if (error.message.includes('CORS')) {
      console.error('\n🔴 CORS Error detected - the Edge Function deployment may not have propagated yet.')
      console.error('Wait 30 seconds and try again.')
    }

    process.exit(1)
  }
}

testAiProxy()
