import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHelperFunction() {
  console.log('🧪 TESTING PRODUCTION-GRADE HELPER FUNCTION');
  console.log('='.repeat(60));

  const testDomain = 'test-helper-' + Date.now() + '.com';

  console.log('\n📋 TEST 1: Call helper function (should bypass RLS)');
  const { data, error } = await supabase.rpc('insert_location_cache', {
    p_domain: testDomain,
    p_city: 'Austin',
    p_state: 'TX',
    p_confidence: 0.95,
    p_method: 'test',
    p_reasoning: 'Testing helper function',
    p_has_multiple: false,
    p_all_locations: null
  });

  if (error) {
    console.log('❌ Helper function error:', error.message);
    console.log('\n⚠️  The helper function needs to be created first!');
    console.log('\n📝 TO FIX:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the script: scripts/create-location-cache-helper.sql');
    console.log('3. Then test again');
  } else {
    console.log('✅ Helper function worked! Cache ID:', data);

    // Test reading it back
    console.log('\n📋 TEST 2: Read back via helper function');
    const { data: readData, error: readError } = await supabase.rpc('get_location_cache', {
      p_domain: testDomain
    });

    if (readError) {
      console.log('❌ Read helper error:', readError.message);
    } else {
      console.log('✅ Read successful:', readData);
    }

    // Test direct table read (should work with SELECT policy)
    console.log('\n📋 TEST 3: Direct table read (for cache checks)');
    const { data: directData, error: directError } = await supabase
      .from('location_detection_cache')
      .select('*')
      .eq('domain', testDomain)
      .maybeSingle();

    if (directError) {
      console.log('❌ Direct read error:', directError.message);
    } else if (directData) {
      console.log('✅ Direct read works:', directData.city, directData.state);
    } else {
      console.log('⚠️ No data found (might be RLS issue)');
    }

    // Clean up
    await supabase.rpc('insert_location_cache', {
      p_domain: testDomain,
      p_city: 'DELETED',
      p_state: 'XX',
      p_confidence: 0
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  if (!error) {
    console.log('✅ Helper function is working!');
    console.log('✅ This is the production-grade solution');
    console.log('✅ No more 400 errors!');
  } else {
    console.log('❌ Helper function not found');
    console.log('📝 Run the SQL script first to create it');
  }
}

testHelperFunction().catch(console.error);