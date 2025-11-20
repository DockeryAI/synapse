import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteFlow() {
  console.log('🧪 Testing complete profile generation + save flow...\n');

  const naicsCode = '524126';
  const industryName = 'Direct Property & Casualty Insurance';

  // 1. Delete existing profile to start fresh
  console.log('1️⃣  Cleaning up existing test data...');
  await supabase.from('industry_profiles').delete().eq('naics_code', naicsCode);
  console.log('   ✅ Clean slate\n');

  // 2. Call Edge Function to generate profile
  console.log('2️⃣  Calling Edge Function to generate profile...');
  const testPrompt = `Generate a brief industry profile for ${industryName} (NAICS: ${naicsCode}).

Include:
- industry: ${industryName}
- industry_name: ${industryName}
- description: 2-3 sentences
- emotional_triggers: ["Trust", "Security", "Protection"]
- avoid_words: ["cheap", "discount", "budget"]

Return as JSON object.`;

  const startTime = Date.now();

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Synapse Test'
    },
    body: JSON.stringify({
      provider: 'openrouter',
      model: 'anthropic/claude-opus-4.1',
      messages: [{ role: 'user', content: testPrompt }],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    console.error('   ❌ Edge Function failed:', response.status);
    return false;
  }

  const data = await response.json();
  const elapsed = Date.now() - startTime;
  console.log(`   ✅ Profile generated in ${(elapsed / 1000).toFixed(1)}s\n`);

  // Extract JSON from response
  let profileData;
  try {
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    profileData = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
    console.log('   ✅ Parsed profile data\n');
  } catch (error) {
    console.error('   ❌ Failed to parse JSON:', error);
    return false;
  }

  // 3. Save to database (same logic as actual code)
  console.log('3️⃣  Saving profile to database...');

  const profileId = industryName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const record = {
    id: profileId,
    name: industryName,
    naics_code: naicsCode,
    profile_data: profileData,
    is_active: true,
    business_count: 0,
    template_count: 0
  };

  const { data: saveData, error: saveError } = await supabase
    .from('industry_profiles')
    .upsert(record, { onConflict: 'id' })
    .select();

  if (saveError) {
    console.error('   ❌ Save failed:', saveError.message);
    return false;
  }

  console.log('   ✅ Profile saved successfully\n');

  // 4. Verify it's in database
  console.log('4️⃣  Verifying profile is in database...');

  const { data: verifyData, error: verifyError } = await supabase
    .from('industry_profiles')
    .select('*')
    .eq('naics_code', naicsCode)
    .eq('is_active', true)
    .maybeSingle();

  if (verifyError || !verifyData) {
    console.error('   ❌ Verification failed');
    return false;
  }

  console.log('   ✅ Profile verified in database');
  console.log('   📊 Profile ID:', verifyData.id);
  console.log('   📊 NAICS Code:', verifyData.naics_code);
  console.log('   📊 Created:', verifyData.created_at, '\n');

  // 5. Clean up
  console.log('5️⃣  Cleaning up test data...');
  await supabase.from('industry_profiles').delete().eq('naics_code', naicsCode);
  console.log('   ✅ Test data removed\n');

  return true;
}

testCompleteFlow()
  .then(success => {
    console.log('='.repeat(50));
    if (success) {
      console.log('✅ COMPLETE FLOW TEST PASSED');
      console.log('');
      console.log('Profile generation → save → verify all working!');
      console.log('Onboarding will work correctly now.');
    } else {
      console.log('❌ COMPLETE FLOW TEST FAILED');
    }
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ TEST CRASHED:', err);
    process.exit(1);
  });
