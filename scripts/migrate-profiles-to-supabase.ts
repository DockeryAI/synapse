// Migration Script: Upload ALL Enhanced Industry Profiles to Supabase
// Source: multipass + enhanced-profiles from industry-enhancement output
// Target: Supabase industry_profiles table
// Run: npx tsx scripts/migrate-profiles-to-supabase.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Source directories containing profiles (multipass has priority - more complete)
const PROFILES_DIRS = [
  '/Users/byronhudson/brandock/industry-enhancement/output/multipass',
  '/Users/byronhudson/brandock/industry-enhancement/output/enhanced-profiles'
];

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ProfileData {
  industry: string;
  industry_name: string;
  naics_code: string;
  category: string;
  subcategory: string;
  research_brief: any;
  customer_triggers?: any;
  campaign_templates?: any;
  tiktok_content_templates?: any;
  twitter_content_templates?: any;
  [key: string]: any;
}

async function findProfiles(): Promise<Map<string, string>> {
  // Use Map to deduplicate by industry slug (multipass takes priority)
  const profileMap = new Map<string, string>();

  for (const profilesDir of PROFILES_DIRS) {
    if (!fs.existsSync(profilesDir)) {
      console.log(`   ⚠️ Directory not found: ${profilesDir}`);
      continue;
    }

    const entries = fs.readdirSync(profilesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Multipass structure: dir/final-profile.json
        const profilePath = path.join(profilesDir, entry.name, 'final-profile.json');
        if (fs.existsSync(profilePath)) {
          const slug = entry.name.toLowerCase().replace(/_/g, '-');
          if (!profileMap.has(slug)) {
            profileMap.set(slug, profilePath);
          }
        }
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Enhanced-profiles structure: profile.json directly
        const profilePath = path.join(profilesDir, entry.name);
        const slug = entry.name.replace('.json', '').toLowerCase().replace(/_/g, '-');
        if (!profileMap.has(slug)) {
          profileMap.set(slug, profilePath);
        }
      }
    }
  }

  return profileMap;
}

async function migrateProfiles() {
  console.log('🚀 Starting Industry Profile Migration to Supabase');
  console.log(`   Sources:`);
  PROFILES_DIRS.forEach(dir => console.log(`     - ${dir}`));
  console.log(`   Target: Supabase industry_profiles table\n`);

  // Find all profile files (deduplicated)
  const profileMap = await findProfiles();
  console.log(`📁 Found ${profileMap.size} unique profile files to migrate\n`);

  if (profileMap.size === 0) {
    console.error('❌ No profiles found! Check the source directories.');
    process.exit(1);
  }

  // First, get count of existing profiles
  const { count: existingCount } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Existing profiles in Supabase: ${existingCount || 0}`);

  // Delete existing profiles
  console.log('\n🗑️  Deleting existing profiles...');
  const { error: deleteError } = await supabase
    .from('industry_profiles')
    .delete()
    .neq('id', 'DO_NOT_DELETE'); // This will delete all rows

  if (deleteError) {
    console.error('❌ Failed to delete existing profiles:', deleteError);
    // Continue anyway - might be no profiles to delete
  } else {
    console.log('   ✓ Existing profiles deleted');
  }

  // Process and insert profiles
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const [slug, profilePath] of profileMap) {
    try {
      const profileJson = fs.readFileSync(profilePath, 'utf-8');
      const profile: ProfileData = JSON.parse(profileJson);

      // Use the slug from the map (already normalized)
      const id = slug;

      // Count templates
      const tiktokCount = profile.tiktok_content_templates?.length || 0;
      const twitterCount = profile.twitter_content_templates?.length || 0;
      const campaignCount = Object.keys(profile.campaign_templates || {}).length;
      const templateCount = tiktokCount + twitterCount + campaignCount;

      const { error } = await supabase
        .from('industry_profiles')
        .upsert({
          id,
          name: profile.industry_name,
          naics_code: profile.naics_code || null,
          profile_data: profile,
          is_active: true,
          business_count: 0,
          template_count: templateCount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        errorCount++;
        errors.push(`${profile.industry_name}: ${error.message}`);
        console.log(`   ❌ ${profile.industry_name}`);
      } else {
        successCount++;
        console.log(`   ✓ ${profile.industry_name} (${profile.naics_code || 'no NAICS'})`);
      }
    } catch (err) {
      errorCount++;
      errors.push(`${profilePath}: ${err}`);
      console.log(`   ❌ Error reading ${profilePath}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`   ✓ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📁 Total processed: ${profileMap.size}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   - ${e}`));
  }

  // Verify final count
  const { count: finalCount } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Final profile count in Supabase: ${finalCount}`);

  // Sample verification
  const { data: sample } = await supabase
    .from('industry_profiles')
    .select('id, name, naics_code, template_count')
    .limit(5);

  if (sample && sample.length > 0) {
    console.log('\n📋 Sample profiles:');
    sample.forEach(p => {
      console.log(`   - ${p.name} (${p.naics_code || 'no NAICS'}) - ${p.template_count} templates`);
    });
  }

  console.log('\n🎉 Migration complete!');
}

// Run the migration
migrateProfiles().catch(console.error);
