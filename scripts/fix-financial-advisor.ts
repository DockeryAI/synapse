/**
 * Fix Financial Advisor display name in database
 *
 * Run: npx tsx scripts/fix-financial-advisor.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixFinancialAdvisor() {
  console.log('🔧 Fixing Financial Advisor display name...');

  try {
    // 1. Update all 523930 entries to "Financial Advisor" in naics_codes table
    const { data: updated1, error: error1 } = await supabase
      .from('naics_codes')
      .update({
        title: 'Financial Advisor',
        keywords: ['financial advisor', 'financial planner', 'wealth manager', 'investment advisor', 'financial planning', 'wealth management', 'retirement planning'],
        has_full_profile: true,
        popularity: 31
      })
      .eq('code', '523930')
      .select();

    if (error1) {
      console.error('❌ Error updating Financial Planning:', error1);
    } else {
      console.log(`✅ Updated Financial Planning → Financial Advisor (${updated1?.length || 0} rows)`);
      if (updated1 && updated1.length > 0) {
        console.log('   Updated rows:', updated1);
      }
    }

    // 2. Check if there are other 523930 entries to update
    const { data: verification, error: error3 } = await supabase
      .from('naics_codes')
      .select('*')
      .eq('code', '523930')
      .order('popularity', { ascending: false });

    if (error3) {
      console.error('❌ Error verifying:', error3);
    } else {
      console.log('\n📊 Current entries for NAICS 523930:');
      verification?.forEach((row: any) => {
        console.log(`  - ${row.title} (popularity: ${row.popularity})`);
        console.log(`    Keywords: ${row.keywords?.join(', ')}`);
      });
    }

    console.log('\n✅ Done! Refresh the page to see the changes.');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixFinancialAdvisor();
