import { createClient } from '@supabase/supabase-js';
import { COMPLETE_NAICS_CODES } from '../src/data/complete-naics-codes';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncStaticNaics() {
  console.log('\n=== Syncing 400+ Static NAICS Codes ===\n');

  console.log(`Static NAICS codes in code: ${COMPLETE_NAICS_CODES.length}`);

  // Get all existing NAICS codes
  const { data: existingNaics } = await supabase
    .from('naics_codes')
    .select('code, title, has_full_profile');

  const existingCodes = new Map(existingNaics?.map(n => [n.code, n]) || []);
  console.log(`Existing NAICS codes in database: ${existingCodes.size}`);

  // Deduplicate COMPLETE_NAICS_CODES by code (prioritize has_full_profile=true)
  const deduplicatedCodes = new Map<string, typeof COMPLETE_NAICS_CODES[0]>();
  COMPLETE_NAICS_CODES.forEach(naics => {
    const existing = deduplicatedCodes.get(naics.naics_code);
    if (!existing || (naics.has_full_profile && !existing.has_full_profile)) {
      deduplicatedCodes.set(naics.naics_code, naics);
    }
  });

  console.log(`Deduplicated NAICS codes: ${deduplicatedCodes.size} (from ${COMPLETE_NAICS_CODES.length})`);

  // Find static codes not in database
  const missingStatic = Array.from(deduplicatedCodes.values()).filter(naics => !existingCodes.has(naics.naics_code));

  console.log(`Missing static NAICS codes: ${missingStatic.length}\n`);

  if (missingStatic.length === 0) {
    console.log('✅ All static NAICS codes already in database!');
    return;
  }

  console.log('Sample of missing codes:');
  console.table(missingStatic.slice(0, 10).map(naics => ({
    code: naics.naics_code,
    name: naics.display_name,
    category: naics.category,
    hasProfile: naics.has_full_profile
  })));

  console.log('\n=== Adding Missing Static NAICS Codes ===\n');

  // Add missing codes in batches of 50
  const batchSize = 50;
  let added = 0;
  let errors = 0;

  for (let i = 0; i < missingStatic.length; i += batchSize) {
    const batch = missingStatic.slice(i, i + batchSize);

    const entries = batch.map(naics => ({
      code: naics.naics_code,
      title: naics.display_name,
      category: naics.category,
      keywords: naics.keywords || [],
      has_full_profile: naics.has_full_profile,
      popularity: naics.popularity || 1
    }));

    const { error } = await supabase
      .from('naics_codes')
      .upsert(entries, {
        onConflict: 'code'
      });

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      added += batch.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Added ${batch.length} codes (${added}/${missingStatic.length})`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Successfully added: ${added}`);
  console.log(`Errors: ${errors}`);

  // Final verification
  const { count } = await supabase
    .from('naics_codes')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal NAICS codes in database: ${count}`);
  console.log(`Unique NAICS codes in source: ${deduplicatedCodes.size}`);

  if (count >= deduplicatedCodes.size) {
    console.log('\n✅ All static NAICS codes synced!');
  } else {
    console.log(`\n⚠️  Still missing ${deduplicatedCodes.size - (count || 0)} codes`);
  }
}

syncStaticNaics();
