import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function testEdgeFunction() {
  console.log('🧪 Testing ai-proxy Edge Function with profile generation...\n');
  console.log('Edge Function URL:', `${supabaseUrl}/functions/v1/ai-proxy`);
  console.log('Using Claude Opus 4.1');
  console.log('Timeout: 150 seconds\n');

  const startTime = Date.now();

  // Shorter prompt for testing (not full profile generation)
  const testPrompt = `Generate a brief industry profile for Direct Property & Casualty Insurance (NAICS: 524126).

Include:
1. industry: Direct Property & Casualty Insurance
2. industry_name: Direct Property & Casualty Insurance
3. description: 2-3 sentences about the industry
4. emotional_triggers: Array of 3-5 triggers
5. avoid_words: Array of 3-5 words to avoid

Return as JSON object.`;

  const requestBody = {
    provider: 'openrouter',
    model: 'anthropic/claude-opus-4.1',
    messages: [
      {
        role: 'user',
        content: testPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  };

  console.log('📤 Sending request to Edge Function...\n');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Synapse Test'
      },
      body: JSON.stringify(requestBody)
    });

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  Response received in ${(elapsed / 1000).toFixed(1)}s\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function returned error:');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return false;
    }

    const data = await response.json();

    console.log('✅ Edge Function responded successfully!');
    console.log('\n📊 Response data:');
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...\n');

    // Check if response has expected structure
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('✅ Response structure is valid (OpenRouter format)');
      console.log('\n📝 Generated content preview:');
      const content = data.choices[0].message.content;
      console.log(content.substring(0, 300) + '...\n');
      return true;
    } else {
      console.error('❌ Response structure is invalid');
      return false;
    }

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ Request failed after ${(elapsed / 1000).toFixed(1)}s`);
    console.error('Error:', error instanceof Error ? error.message : String(error));

    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('\n🔍 This looks like a CORS or network error');
    }

    return false;
  }
}

testEdgeFunction()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ EDGE FUNCTION TEST PASSED');
      console.log('Profile generation will work during onboarding');
    } else {
      console.log('❌ EDGE FUNCTION TEST FAILED');
      console.log('Profile generation will NOT work during onboarding');
    }
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ TEST CRASHED:', err);
    process.exit(1);
  });
