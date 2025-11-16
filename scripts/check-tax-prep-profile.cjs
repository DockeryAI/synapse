const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkTaxPrepProfile() {
  console.log('🔍 Checking for Tax Preparation profile (NAICS 541213)...\n');

  const { data, error } = await anonClient
    .from('industry_profiles')
    .select('*')
    .eq('naics_code', '541213')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('❌ Tax Preparation profile NOT FOUND in database');
      console.log('   NAICS Code: 541213');
      console.log('   This explains why it\'s regenerating every time!\n');
      console.log('💡 The profile generation may have succeeded, but saving to database failed.');
      console.log('   The code catches save errors and continues (line 206 in OnDemandProfileGeneration.ts)');
      console.log('   Check the browser console for save errors when generating.\n');
    } else {
      console.error('❌ Database error:', error);
    }
    return;
  }

  console.log('✅ Tax Preparation profile FOUND!');
  console.log('\nProfile details:');
  console.log('  NAICS Code:', data.naics_code);
  console.log('  Title:', data.title);
  console.log('  Description:', data.description);
  console.log('  Generated On Demand:', data.generated_on_demand);
  console.log('  Generated At:', data.generated_at);
  console.log('  Has Profile Data:', !!data.profile_data);
  console.log('  Profile Data Keys:', data.profile_data ? Object.keys(data.profile_data).length : 0);

  if (data.profile_data) {
    console.log('\n  Available fields in profile_data:');
    const keys = Object.keys(data.profile_data);
    keys.slice(0, 10).forEach(key => {
      const value = data.profile_data[key];
      const preview = Array.isArray(value)
        ? `[${value.length} items]`
        : typeof value === 'string'
          ? value.substring(0, 50) + '...'
          : typeof value === 'object'
            ? '[object]'
            : value;
      console.log(`    - ${key}: ${preview}`);
    });
    if (keys.length > 10) {
      console.log(`    ... and ${keys.length - 10} more fields`);
    }
  }
}

checkTaxPrepProfile().catch(console.error);
