#!/usr/bin/env node

console.log('🧪 Testing UVP fix for 10 customer profiles...');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpwljchikgmggjidogon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTY1NDAsImV4cCI6MjA3ODczMjU0MH0.At0TEROiEHP2XZQ7ccEErLa2qUG6LtGFwDJl4ukpTuo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFix() {
  try {
    console.log('1. Checking database BEFORE running UVP flow...');

    // Check current state
    const { data: beforeUvps, error: uvpError } = await supabase
      .from('marba_uvps')
      .select('id, target_customer, created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (beforeUvps?.length > 0) {
      const uvp = beforeUvps[0];
      console.log('   Most recent UVP ID:', uvp.id);
      console.log('   Created:', uvp.created_at);

      if (uvp.target_customer) {
        if (typeof uvp.target_customer === 'object') {
          if (Array.isArray(uvp.target_customer)) {
            console.log('   ✅ target_customer is array with', uvp.target_customer.length, 'items');
          } else if (uvp.target_customer.customerProfiles) {
            console.log('   ✅ customerProfiles array with', uvp.target_customer.customerProfiles.length, 'profiles');
          } else {
            console.log('   ❌ target_customer is single object (not array)');
            console.log('   Structure keys:', Object.keys(uvp.target_customer));
          }
        } else {
          console.log('   ❌ target_customer is string/primitive:', typeof uvp.target_customer);
        }
      }
    } else {
      console.log('   No UVPs found in database');
    }

    const { data: beforePersonas, error: personaError } = await supabase
      .from('buyer_personas')
      .select('id, name, brand_id')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('   Current buyer personas count:', beforePersonas?.length || 0);

    console.log('\n📝 Fix Applied:');
    console.log('   ✅ Modified synthesizeCompleteUVP call to use all customer profiles');
    console.log('   ✅ Uses refinedData.selectedCustomers array instead of single selectedCustomerProfile');
    console.log('   ✅ Creates array of CustomerProfile objects with statement property');
    console.log('   ✅ Falls back to single profile if refinedData.selectedCustomers is empty');

    console.log('\n🔧 NEXT STEPS TO TEST:');
    console.log('   1. Go to http://localhost:3002/ in browser');
    console.log('   2. Click "Onboarding" in sidebar');
    console.log('   3. Complete UVP flow and select 10 customer profiles');
    console.log('   4. Check browser console for: "[UVP Flow] Using X customer profiles for synthesis"');
    console.log('   5. Run this script again after UVP completion to verify database');

    console.log('\n🎯 EXPECTED RESULTS:');
    console.log('   • Console should show "Using 10 customer profiles for synthesis"');
    console.log('   • Database should have target_customer with 10 customer profiles');
    console.log('   • Buyer personas should be generated from all 10 profiles');
    console.log('   • V6ContentPage should show all 10 personas in sidebar');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFix();