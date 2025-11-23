import { createClient } from '@supabase/supabase-js';
import { COMPLETE_NAICS_CODES } from '../src/data/complete-naics-codes.js';

const supabase = createClient(
  'https://jpwljchikgmggjidogon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTY1NDAsImV4cCI6MjA3ODczMjU0MH0.At0TEROiEHP2XZQ7ccEErLa2qUG6LtGFwDJl4ukpTuo'
);

console.log('\n📥 Importing all 384 NAICS codes to database...\n');

// First, check which profiles actually exist
const { data: existingProfiles } = await supabase
  .from('industry_profiles')
  .select('id, name');

const profileIds = new Set(existingProfiles?.map(p => p.id) || []);
const profileNames = new Set(existingProfiles?.map(p => p.name.toLowerCase()) || []);

let successCount = 0;
let errorCount = 0;
let skippedCount = 0;

// Process in batches to avoid overwhelming the database
const batchSize = 50;
for (let i = 0; i < COMPLETE_NAICS_CODES.length; i += batchSize) {
  const batch = COMPLETE_NAICS_CODES.slice(i, i + batchSize);

  const naicsEntries = batch.map(naics => {
    // Check if a profile actually exists for this
    const profileId = naics.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const hasProfile = profileIds.has(profileId) ||
                      profileNames.has(naics.display_name.toLowerCase()) ||
                      naics.has_full_profile;

    return {
      code: naics.naics_code,
      title: naics.display_name,
      category: naics.category,
      keywords: naics.keywords,
      has_full_profile: hasProfile,
      popularity: naics.popularity || 1
    };
  });

  // Upsert batch (update if exists, insert if not)
  const { error } = await supabase
    .from('naics_codes')
    .upsert(naicsEntries, {
      onConflict: 'code',
      ignoreDuplicates: false
    });

  if (error) {
    console.error(`❌ Batch ${i/batchSize + 1} error:`, error.message);
    errorCount += batch.length;
  } else {
    successCount += batch.length;
    console.log(`✅ Batch ${i/batchSize + 1}: Imported ${batch.length} codes`);
  }
}

// Get final count
const { count } = await supabase
  .from('naics_codes')
  .select('*', { count: 'exact', head: true });

console.log('\n📊 Import Complete:');
console.log(`   Total in static file: ${COMPLETE_NAICS_CODES.length}`);
console.log(`   Successfully imported: ${successCount}`);
console.log(`   Errors: ${errorCount}`);
console.log(`   Final count in database: ${count}`);
console.log('\n✅ All NAICS codes are now in the database!');
console.log('   Hard refresh the page to see all ~384 industries in the dropdown');