/**
 * Cleanup Brand Data Script
 *
 * Deletes all brand-related data from Supabase to start fresh
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const brandId = '001e28bd-afa4-43e1-a262-7a459330cd01'; // OpenDialog brand ID

async function cleanupBrandData() {
  console.log('🧹 Starting brand data cleanup...');
  console.log(`Target Brand ID: ${brandId}`);

  try {
    // 1. Delete buyer personas
    console.log('\n1️⃣ Deleting buyer personas...');
    const { error: personasError, count: personasCount } = await supabase
      .from('buyer_personas')
      .delete({ count: 'exact' })
      .eq('brand_id', brandId);

    if (personasError) {
      console.error('❌ Error deleting buyer personas:', personasError);
    } else {
      console.log(`✅ Deleted ${personasCount || 0} buyer personas`);
    }

    // 2. Delete UVP data
    console.log('\n2️⃣ Deleting UVP data...');
    const { error: uvpError, count: uvpCount } = await supabase
      .from('marba_uvps')
      .delete({ count: 'exact' })
      .eq('brand_id', brandId);

    if (uvpError) {
      console.error('❌ Error deleting UVP data:', uvpError);
    } else {
      console.log(`✅ Deleted ${uvpCount || 0} UVP records`);
    }

    // 3. Delete UVP sessions
    console.log('\n3️⃣ Deleting UVP sessions...');
    const { error: sessionsError, count: sessionsCount } = await supabase
      .from('uvp_sessions')
      .delete({ count: 'exact' })
      .eq('brand_id', brandId);

    if (sessionsError) {
      console.error('❌ Error deleting UVP sessions:', sessionsError);
    } else {
      console.log(`✅ Deleted ${sessionsCount || 0} UVP sessions`);
    }

    // 4. Delete value propositions
    console.log('\n4️⃣ Deleting value propositions...');
    const { error: valuePropsError, count: valuePropsCount } = await supabase
      .from('value_propositions')
      .delete({ count: 'exact' })
      .eq('brand_id', brandId);

    if (valuePropsError) {
      console.error('❌ Error deleting value propositions:', valuePropsError);
    } else {
      console.log(`✅ Deleted ${valuePropsCount || 0} value propositions`);
    }

    // 5. Delete core truth insights
    console.log('\n5️⃣ Deleting core truth insights...');
    const { error: coreTruthError, count: coreTruthCount } = await supabase
      .from('core_truth_insights')
      .delete({ count: 'exact' })
      .eq('brand_id', brandId);

    if (coreTruthError) {
      console.error('❌ Error deleting core truth insights:', coreTruthError);
    } else {
      console.log(`✅ Deleted ${coreTruthCount || 0} core truth insights`);
    }

    // 6. Delete business insights
    console.log('\n6️⃣ Deleting business insights...');
    const { error: insightsError, count: insightsCount } = await supabase
      .from('business_insights')
      .delete({ count: 'exact' })
      .eq('brand_id', brandId);

    if (insightsError) {
      console.error('❌ Error deleting business insights:', insightsError);
    } else {
      console.log(`✅ Deleted ${insightsCount || 0} business insights`);
    }

    // 7. Clear brand cache/localStorage
    console.log('\n7️⃣ Clearing localStorage cache...');
    console.log('Please clear these localStorage items manually:');
    console.log('- marba_session_id');
    console.log('- marba_uvp_pending');
    console.log('- marba_uvp_*');
    console.log('- marba_buyer_personas_*');
    console.log('- buyerPersonas');
    console.log('- synapse_buyer_personas');
    console.log('- temp_brand_id');
    console.log('- temp_brand_user_id');

    console.log('\n🎉 Brand data cleanup completed!');
    console.log('\n📝 Summary:');
    console.log(`   - Buyer personas: ${personasCount || 0} deleted`);
    console.log(`   - UVP records: ${uvpCount || 0} deleted`);
    console.log(`   - UVP sessions: ${sessionsCount || 0} deleted`);
    console.log(`   - Value propositions: ${valuePropsCount || 0} deleted`);
    console.log(`   - Core truth insights: ${coreTruthCount || 0} deleted`);
    console.log(`   - Business insights: ${insightsCount || 0} deleted`);

    console.log('\n🔄 Next steps:');
    console.log('1. Refresh your browser or clear localStorage manually');
    console.log('2. The V6 sidebar should now be empty');
    console.log('3. Run a new UVP onboarding to generate fresh data');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupBrandData();