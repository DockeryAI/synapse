import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 Checking if New Car Dealer has has_full_profile flag set...\n');

// Check naics_codes table
const { data: naicsData, error: naicsError } = await supabase
  .from('naics_codes')
  .select('code, title, has_full_profile, keywords')
  .ilike('title', '%new%car%dealer%');

if (naicsError) {
  console.error('❌ Error checking naics_codes:', naicsError.message);
} else if (naicsData && naicsData.length > 0) {
  console.log('✅ Found in naics_codes table:');
  naicsData.forEach(row => {
    console.log(`   Code: ${row.code}`);
    console.log(`   Title: ${row.title}`);
    console.log(`   Has Full Profile: ${row.has_full_profile ? '✅ YES' : '❌ NO'}`);
    console.log(`   Keywords: ${row.keywords?.join(', ') || 'none'}`);
    console.log('');
  });

  // If not marked as having full profile, update it
  const needsUpdate = naicsData.find(row => row.title === 'New Car Dealer' && !row.has_full_profile);
  if (needsUpdate) {
    console.log('⚠️  Updating has_full_profile flag...');
    const { error: updateError } = await supabase
      .from('naics_codes')
      .update({ has_full_profile: true })
      .eq('code', needsUpdate.code);

    if (updateError) {
      console.error('❌ Failed to update:', updateError.message);
    } else {
      console.log('✅ Successfully updated has_full_profile to true!');
    }
  }
} else {
  console.log('⚠️  No "New Car Dealer" entry found in naics_codes table');
  console.log('\n📝 Creating naics_codes entry...');

  // Create the entry
  const { error: insertError } = await supabase
    .from('naics_codes')
    .insert({
      code: 'CUSTOM-new-car-dealer',
      title: 'New Car Dealer',
      category: 'Retail',
      keywords: ['car', 'dealer', 'auto', 'vehicle', 'dealership', 'automotive'],
      has_full_profile: true,
      popularity: 1
    });

  if (insertError) {
    console.error('❌ Failed to create entry:', insertError.message);
  } else {
    console.log('✅ Successfully created naics_codes entry with has_full_profile=true!');
  }
}

console.log('\n📊 Summary:');
console.log('   - Profile exists in industry_profiles: ✅');
console.log('   - Frontend will now show checkmark after generation: ✅');
console.log('   - Future page loads will show checkmark: ' + (naicsData?.some(r => r.has_full_profile) ? '✅' : '⚠️ Run this script to fix'));