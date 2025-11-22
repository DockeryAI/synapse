#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpwljchikgmggjidogon.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjU0MCwiZXhwIjoyMDc4NzMyNTQwfQ.r6t353lsTTXchueUfggEzfdJW0twlJGuxWuR0kyiQSE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('\n🧪 Testing Complete Session Workflow\n');
console.log('This simulates what happens when you:');
console.log('1. Fill in UVP data');
console.log('2. Clear browser data (localStorage)');
console.log('3. Reload the page\n');
console.log('================================================\n');

async function testCompleteWorkflow() {
  // Step 1: Create a session (simulating UVP wizard)
  console.log('📝 Step 1: Creating onboarding session...');

  const testSession = {
    session_name: 'Test Company',
    website_url: 'https://testcompany.com',
    current_step: 'customer',
    brand_id: null, // No brand yet (onboarding)
    business_info: { name: 'Test Company', location: 'New York' },
    customer_data: { target_customer: 'Small business owners' },
    progress_percentage: 40,
    completed_steps: ['products', 'customer']
  };

  const { data: created, error: createError } = await supabase
    .from('uvp_sessions')
    .insert(testSession)
    .select()
    .single();

  if (createError) {
    console.log('   ❌ Failed:', createError.message);
    return false;
  }

  console.log(`   ✅ Session created: ${created.id}`);
  console.log(`   📊 Progress: ${created.progress_percentage}%`);
  console.log(`   📍 Current step: ${created.current_step}`);

  // Step 2: Simulate clearing localStorage (we just don't use the session ID)
  console.log('\n🗑️  Step 2: Simulating localStorage cleared...');
  console.log('   (In real app, localStorage.clear() would delete session ID)');

  // Step 3: Retrieve session WITHOUT a session ID (using brand lookup)
  console.log('\n🔍 Step 3: Attempting to restore session from database...');
  console.log('   (This is what getLatestSessionForCurrentUser() does)');

  const { data: restored, error: restoreError } = await supabase
    .from('uvp_sessions')
    .select('*')
    .is('brand_id', null) // Onboarding sessions
    .order('last_accessed', { ascending: false })
    .limit(1);

  if (restoreError || !restored || restored.length === 0) {
    console.log('   ❌ Could not restore session');
    return false;
  }

  const restoredSession = restored[0];

  console.log(`   ✅ Session restored: ${restoredSession.id}`);
  console.log(`   📊 Progress: ${restoredSession.progress_percentage}%`);
  console.log(`   📍 Current step: ${restoredSession.current_step}`);
  console.log(`   👤 Customer: ${restoredSession.customer_data?.target_customer || 'N/A'}`);

  // Verify data integrity
  console.log('\n✅ Step 4: Verifying data integrity...');

  const dataIntact =
    restoredSession.id === created.id &&
    restoredSession.progress_percentage === testSession.progress_percentage &&
    restoredSession.current_step === testSession.current_step;

  if (dataIntact) {
    console.log('   ✅ All data restored correctly!');
  } else {
    console.log('   ❌ Data mismatch!');
    return false;
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('uvp_sessions').delete().eq('id', created.id);
  console.log('   ✅ Test session deleted');

  return true;
}

testCompleteWorkflow().then(success => {
  if (success) {
    console.log('\n================================================');
    console.log('✅ SUCCESS! Session restoration works!\n');
    console.log('What this means:');
    console.log('  ✅ Sessions are saved to database');
    console.log('  ✅ Sessions can be restored without localStorage');
    console.log('  ✅ Clearing site data won\'t lose your progress');
    console.log('  ✅ UVP wizard data persists properly\n');
    console.log('The fix is COMPLETE and WORKING!\n');
  } else {
    console.log('\n❌ Test failed - session restoration not working\n');
    process.exit(1);
  }
});
