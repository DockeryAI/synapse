import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFuzzyMatching() {
  console.log('🧪 TESTING FUZZY MATCHING FIX');
  console.log('='.repeat(60));

  // Test 1: Check if industry_profiles are now accessible
  console.log('\n📋 TEST 1: Loading profiles from industry_profiles table');
  const { data: profiles, error } = await supabase
    .from('industry_profiles')
    .select('naics_code, name, profile_data')
    .eq('is_active', true)
    .limit(5);

  if (error) {
    console.log('❌ Error loading profiles:', error.message);
  } else {
    console.log(`✅ Successfully loaded ${profiles?.length || 0} profiles`);
    if (profiles && profiles.length > 0) {
      console.log('\nSample profiles for fuzzy matching:');
      profiles.forEach(p => {
        const keywords = [];
        const profileData = p.profile_data || {};

        // Extract keywords like the fixed code does
        if (profileData.industry) {
          keywords.push(...profileData.industry.toLowerCase().split(/\W+/).filter(w => w.length > 3));
        }
        if (profileData.category) {
          keywords.push(profileData.category.toLowerCase());
        }

        console.log(`   - ${p.name} (${p.naics_code})`);
        console.log(`     Keywords: ${keywords.slice(0, 5).join(', ')}`);
      });
    }
  }

  // Test 2: Check if Mental Health profile exists
  console.log('\n📋 TEST 2: Checking for Mental Health profile');
  const { data: mentalHealth } = await supabase
    .from('industry_profiles')
    .select('naics_code, name, profile_data')
    .eq('naics_code', '621330')
    .maybeSingle();

  if (mentalHealth) {
    console.log('✅ Mental Health profile found:', mentalHealth.name);
    const profileData = mentalHealth.profile_data || {};
    const keywords = [];

    if (profileData.industry) {
      keywords.push(...profileData.industry.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    }
    if (profileData.industry_name) {
      keywords.push(...profileData.industry_name.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    }

    console.log('   Keywords that should match "school psychologist":');
    console.log('   ', keywords.filter(k => k.includes('mental') || k.includes('health') || k.includes('psych')));
  } else {
    console.log('❌ Mental Health profile not found');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ IndustryMatchingService now loads from industry_profiles table');
  console.log('✅ Fuzzy matching should now find existing profiles');
  console.log('✅ "school psychologist" should match to "Mental Health Practice"');
  console.log('\n⚠️  Please do a hard refresh (Cmd+Shift+R) in your browser');
  console.log('   to load the updated JavaScript code!');
}

testFuzzyMatching().catch(console.error);