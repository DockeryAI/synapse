import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jpwljchikgmggjidogon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTY1NDAsImV4cCI6MjA3ODczMjU0MH0.At0TEROiEHP2XZQ7ccEErLa2qUG6LtGFwDJl4ukpTuo'
);

console.log('\n🔍 Checking for tax-related industries...\n');

// Check naics_codes table
console.log('=== NAICS CODES TABLE ===');
const { data: naicsData, error: naicsError } = await supabase
  .from('naics_codes')
  .select('code, title, keywords, has_full_profile')
  .or('title.ilike.%tax%,title.ilike.%accounting%,title.ilike.%bookkeep%,title.ilike.%cpa%,keywords.cs.{tax,accounting,bookkeeping,cpa,preparation}');

if (naicsError) {
  console.error('❌ Error checking naics_codes:', naicsError.message);
} else if (naicsData && naicsData.length > 0) {
  console.log(`✅ Found ${naicsData.length} tax-related entries in naics_codes:`);
  naicsData.forEach(row => {
    console.log(`  - ${row.title} (${row.code}) - has_full_profile: ${row.has_full_profile}`);
    if (row.keywords?.length > 0) {
      console.log(`    Keywords: ${row.keywords.slice(0, 5).join(', ')}`);
    }
  });
} else {
  console.log('❌ No tax-related entries found in naics_codes table');
}

// Check industry_profiles table
console.log('\n=== INDUSTRY PROFILES TABLE ===');
const { data: profileData, error: profileError } = await supabase
  .from('industry_profiles')
  .select('id, name, naics_code')
  .or('name.ilike.%tax%,name.ilike.%accounting%,name.ilike.%bookkeep%,name.ilike.%cpa%,id.ilike.%tax%,id.ilike.%accounting%');

if (profileError) {
  console.error('❌ Error checking industry_profiles:', profileError.message);
} else if (profileData && profileData.length > 0) {
  console.log(`✅ Found ${profileData.length} tax-related profiles:`);
  profileData.forEach(row => {
    console.log(`  - ${row.name} (id: ${row.id}, naics: ${row.naics_code})`);
  });
} else {
  console.log('❌ No tax-related profiles found in industry_profiles table');
}

console.log('\n📊 Summary:');
if ((!naicsData || naicsData.length === 0) && (!profileData || profileData.length === 0)) {
  console.log('⚠️  No tax-related industries found in either table!');
  console.log('   This is why "tax" search shows no results');
  console.log('\n📝 To fix:');
  console.log('   1. Add tax-related entries to naics_codes table');
  console.log('   2. Or type "Tax Preparation" and press Enter to generate on-demand');
}