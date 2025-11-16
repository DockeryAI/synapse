#!/usr/bin/env node

/**
 * View the full profile data for a NAICS code
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function viewProfile(naicsCode) {
  console.log(`\n🔍 Fetching profile for NAICS ${naicsCode}...\n`);

  try {
    const { data, error } = await supabase
      .from('industry_profiles')
      .select('*')
      .eq('naics_code', naicsCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Profile NOT found in database\n');
        return;
      }
      console.error('❌ Database error:', error.message);
      return;
    }

    if (data) {
      console.log('✅ Profile Found!\n');
      console.log('📋 Metadata:');
      console.log(`   NAICS Code: ${data.naics_code}`);
      console.log(`   Title: ${data.title}`);
      console.log(`   Description: ${data.description ? data.description.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`   On-Demand: ${data.generated_on_demand}`);
      console.log(`   Generated: ${data.generated_at || data.created_at}`);
      console.log(`   Avoid Words: ${data.avoid_words?.length || 0} words`);

      if (data.profile_data) {
        console.log('\n📦 Profile Data (JSONB):');
        const keys = Object.keys(data.profile_data);
        console.log(`   Total fields: ${keys.length}`);
        console.log(`   Fields: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);

        // Show a few sample fields
        if (data.profile_data.industry) {
          console.log(`\n   📌 Industry: ${data.profile_data.industry}`);
        }
        if (data.profile_data.power_words) {
          console.log(`   📌 Power Words: ${data.profile_data.power_words.slice(0, 5).join(', ')}${data.profile_data.power_words.length > 5 ? '...' : ''}`);
        }
        if (data.profile_data.customer_triggers) {
          const triggers = Array.isArray(data.profile_data.customer_triggers)
            ? data.profile_data.customer_triggers
            : data.profile_data.customer_triggers.triggers || [];
          console.log(`   📌 Customer Triggers: ${triggers.length} triggers`);
        }
      } else {
        console.log('\n⚠️  No profile_data found (empty JSONB)');
      }
      console.log('');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

const naicsCode = process.argv[2] || '621330';
viewProfile(naicsCode);
