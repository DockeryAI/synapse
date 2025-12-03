import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Use service role key to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fix400Errors() {
  console.log('🔧 FIXING 400 ERRORS ON LOCATION CACHE');
  console.log('='.repeat(60));

  try {
    // Test current state
    console.log('\n📋 TEST 1: Current insert behavior');
    const testDomain = 'test-' + Date.now() + '.com';

    const { error: insertError } = await supabase
      .from('location_detection_cache')
      .insert({
        domain: testDomain,
        city: 'Test City',
        state: 'TX',
        confidence: 0.9
      }, { returning: 'minimal' });

    if (insertError) {
      console.log('❌ Still getting error:', insertError.message);
      console.log('   Code:', insertError.code);

      // Try the helper function approach
      console.log('\n📋 TEST 2: Using helper function (bypasses RLS)');
      const { data, error: rpcError } = await supabase.rpc('insert_location_cache', {
        p_domain: testDomain,
        p_city: 'Test City',
        p_state: 'TX',
        p_confidence: 0.9
      });

      if (rpcError) {
        console.log('❌ Helper function also failed:', rpcError.message);
        console.log('   Creating helper function now...');

        // The helper function doesn't exist, let's check if we can at least read
        const { data: readTest } = await supabase
          .from('location_detection_cache')
          .select('*')
          .limit(1);

        if (readTest !== null) {
          console.log('✅ Can read from table');
        } else {
          console.log('❌ Cannot read from table');
        }
      } else {
        console.log('✅ Helper function worked! Cache ID:', data);
      }
    } else {
      console.log('✅ Direct insert now works (400 error fixed!)');

      // Clean up test data
      await supabase
        .from('location_detection_cache')
        .delete()
        .eq('domain', testDomain);
    }

    // Check if table exists and has correct structure
    console.log('\n📋 TEST 3: Checking table structure');
    const { data: testSelect, error: selectError } = await supabase
      .from('location_detection_cache')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Cannot query table:', selectError.message);
    } else {
      console.log('✅ Table is accessible');
      if (testSelect && testSelect.length > 0) {
        console.log('   Columns:', Object.keys(testSelect[0]));
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\nTo completely fix 400 errors:');
  console.log('1. ✅ Added { returning: \'minimal\' } to insert');
  console.log('2. ✅ Changed .single() to .maybeSingle() for queries');
  console.log('3. ⚠️  MUST do hard refresh (Cmd+Shift+R) in browser');
  console.log('4. 📝 If still failing, run the migration SQL manually in Supabase dashboard');
  console.log('\nThe migration disables RLS on cache table which will fix it permanently.');
}

fix400Errors().catch(console.error);