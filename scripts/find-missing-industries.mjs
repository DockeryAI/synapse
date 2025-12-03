import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 Finding industry profiles that aren\'t showing in the selector...\n');

// Get all industry profiles
const { data: profiles, error: profileError } = await supabase
  .from('industry_profiles')
  .select('id, name, naics_code, is_active')
  .eq('is_active', true)
  .order('name');

if (profileError) {
  console.error('❌ Error fetching profiles:', profileError.message);
  process.exit(1);
}

// Get all naics codes
const { data: naicsCodes, error: naicsError } = await supabase
  .from('naics_codes')
  .select('code, title, has_full_profile')
  .order('title');

if (naicsError) {
  console.error('❌ Error fetching naics_codes:', naicsError.message);
  process.exit(1);
}

// Create lookup maps
const profilesByName = new Map();
const profilesByNaics = new Map();
profiles.forEach(p => {
  profilesByName.set(p.name.toLowerCase(), p);
  if (p.naics_code) {
    profilesByNaics.set(p.naics_code, p);
  }
});

const naicsByTitle = new Map();
const naicsByCode = new Map();
naicsCodes.forEach(n => {
  naicsByTitle.set(n.title.toLowerCase(), n);
  naicsByCode.set(n.code, n);
});

// Find missing profiles
const missingFromNaics = [];
const mismatchedStatus = [];

profiles.forEach(profile => {
  const naicsByName = naicsByTitle.get(profile.name.toLowerCase());
  const naicsByCodeMatch = profile.naics_code ? naicsByCode.get(profile.naics_code) : null;

  if (!naicsByName && !naicsByCodeMatch) {
    // Profile exists but not in naics_codes at all
    missingFromNaics.push(profile);
  } else if (naicsByName && !naicsByName.has_full_profile) {
    // In naics_codes but not marked as having full profile
    mismatchedStatus.push({
      profile,
      naicsEntry: naicsByName
    });
  }
});

// Report findings
console.log('📊 DATABASE STATUS:');
console.log(`   Total profiles in industry_profiles: ${profiles.length}`);
console.log(`   Total entries in naics_codes: ${naicsCodes.length}`);
console.log('');

if (missingFromNaics.length > 0) {
  console.log(`❌ ${missingFromNaics.length} PROFILES MISSING FROM naics_codes (won't show in dropdown):\n`);

  // Group by category for better organization
  const byCategory = {};
  missingFromNaics.forEach(p => {
    // Try to guess category from name
    let category = 'Other Services';
    if (p.name.includes('Health') || p.name.includes('Medical') || p.name.includes('Dental') || p.name.includes('Care')) {
      category = 'Healthcare';
    } else if (p.name.includes('Restaurant') || p.name.includes('Food') || p.name.includes('Bakery') || p.name.includes('Coffee')) {
      category = 'Food Service';
    } else if (p.name.includes('Retail') || p.name.includes('Store') || p.name.includes('Shop')) {
      category = 'Retail';
    } else if (p.name.includes('Salon') || p.name.includes('Spa') || p.name.includes('Beauty')) {
      category = 'Personal Services';
    } else if (p.name.includes('Real Estate') || p.name.includes('Property')) {
      category = 'Real Estate';
    } else if (p.name.includes('Construction') || p.name.includes('Contractor')) {
      category = 'Construction';
    } else if (p.name.includes('Law') || p.name.includes('Legal') || p.name.includes('Attorney')) {
      category = 'Legal Services';
    }

    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(p);
  });

  Object.entries(byCategory).forEach(([category, profiles]) => {
    console.log(`   ${category}:`);
    profiles.forEach(p => {
      console.log(`     - ${p.name} (id: ${p.id}, naics: ${p.naics_code || 'none'})`);
    });
  });
}

if (mismatchedStatus.length > 0) {
  console.log(`\n⚠️  ${mismatchedStatus.length} entries have mismatched has_full_profile status:\n`);
  mismatchedStatus.forEach(({ profile, naicsEntry }) => {
    console.log(`   - ${profile.name}: profile exists but naics_codes.has_full_profile = false`);
  });
}

if (missingFromNaics.length === 0 && mismatchedStatus.length === 0) {
  console.log('✅ All profiles are properly synchronized!');
} else {
  console.log('\n📝 To fix, I\'ll generate SQL to add all missing entries...');
}

// Generate SQL to fix
if (missingFromNaics.length > 0) {
  console.log('\n-- SQL TO ADD MISSING PROFILES TO naics_codes:');
  console.log('-- Copy and run in Supabase Dashboard\n');

  const sqlStatements = missingFromNaics.map(p => {
    const code = p.naics_code || `CUSTOM-${p.id}`;
    const keywords = p.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter(w => w.length > 2);

    return `INSERT INTO naics_codes (code, title, category, keywords, has_full_profile, popularity)
VALUES ('${code}', '${p.name.replace(/'/g, "''")}', 'Professional Services',
        ARRAY[${keywords.map(k => `'${k}'`).join(', ')}], true, 5)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  has_full_profile = true;`;
  });

  console.log(sqlStatements.join('\n\n'));
}