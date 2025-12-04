/**
 * Check Database Data Script
 *
 * Checks what UVP and buyer persona data is actually in Supabase
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

async function checkDatabaseData() {
  console.log('🔍 Checking database for UVP and buyer persona data...');
  console.log(`Brand ID: ${brandId}\n`);

  try {
    // 1. Check UVP data in marba_uvps table
    console.log('1️⃣ Checking UVP data in marba_uvps...');
    const { data: uvpData, error: uvpError } = await supabase
      .from('marba_uvps')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (uvpError) {
      console.error('❌ Error fetching UVP data:', uvpError);
    } else {
      console.log(`✅ Found ${uvpData?.length || 0} UVP records`);
      if (uvpData && uvpData.length > 0) {
        const latest = uvpData[0];
        console.log(`   📅 Latest UVP created: ${latest.created_at}`);
        console.log(`   📝 Value proposition: ${latest.value_proposition_statement?.substring(0, 100)}...`);
        console.log(`   🎯 Target customer: ${latest.target_customer?.customer_name || 'Not specified'}`);
        console.log(`   🏢 Products/Services: ${latest.products_services?.categories?.length || 0} categories`);
      }
    }

    // 2. Check buyer personas
    console.log('\n2️⃣ Checking buyer personas...');
    const { data: personasData, error: personasError } = await supabase
      .from('buyer_personas')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (personasError) {
      console.error('❌ Error fetching buyer personas:', personasError);
    } else {
      console.log(`✅ Found ${personasData?.length || 0} buyer personas`);
      if (personasData && personasData.length > 0) {
        personasData.forEach((persona, index) => {
          console.log(`   ${index + 1}. ${persona.persona_name} (${persona.role?.title || 'No title'})`);
          console.log(`      📅 Created: ${persona.created_at}`);
        });
      } else {
        console.log('   🚫 No buyer personas found in database');
      }
    }

    // 3. Check UVP sessions
    console.log('\n3️⃣ Checking UVP sessions...');
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('uvp_sessions')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (sessionsError) {
      console.error('❌ Error fetching UVP sessions:', sessionsError);
    } else {
      console.log(`✅ Found ${sessionsData?.length || 0} UVP sessions`);
      if (sessionsData && sessionsData.length > 0) {
        sessionsData.forEach((session, index) => {
          console.log(`   ${index + 1}. Session ${session.session_id.substring(0, 8)}... created ${session.created_at}`);
          console.log(`      Status: ${session.stage || 'Unknown'}`);
        });
      }
    }

    // 4. Check value propositions table
    console.log('\n4️⃣ Checking value propositions table...');
    const { data: valuePropsData, error: valuePropsError } = await supabase
      .from('value_propositions')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (valuePropsError) {
      console.error('❌ Error fetching value propositions:', valuePropsError);
    } else {
      console.log(`✅ Found ${valuePropsData?.length || 0} value propositions`);
      if (valuePropsData && valuePropsData.length > 0) {
        valuePropsData.forEach((vp, index) => {
          console.log(`   ${index + 1}. ${vp.proposition_text?.substring(0, 80)}...`);
        });
      }
    }

    // 5. Check core truth insights
    console.log('\n5️⃣ Checking core truth insights...');
    const { data: coreTruthData, error: coreTruthError } = await supabase
      .from('core_truth_insights')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (coreTruthError) {
      console.error('❌ Error fetching core truth insights:', coreTruthError);
    } else {
      console.log(`✅ Found ${coreTruthData?.length || 0} core truth insights`);
      if (coreTruthData && coreTruthData.length > 0) {
        const latest = coreTruthData[0];
        console.log(`   📝 Core truth: ${latest.core_truth?.substring(0, 100)}...`);
        console.log(`   📅 Created: ${latest.created_at}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   - UVP Records: ${uvpData?.length || 0}`);
    console.log(`   - Buyer Personas: ${personasData?.length || 0}`);
    console.log(`   - UVP Sessions: ${sessionsData?.length || 0}`);
    console.log(`   - Value Propositions: ${valuePropsData?.length || 0}`);
    console.log(`   - Core Truth Insights: ${coreTruthData?.length || 0}`);

    if ((uvpData?.length || 0) === 0) {
      console.log('\n🚨 ISSUE: No UVP data found in marba_uvps table!');
      console.log('This suggests the UVP save operation is failing.');
    }

    if ((personasData?.length || 0) === 0) {
      console.log('\n🚨 ISSUE: No buyer personas found in buyer_personas table!');
      console.log('This confirms the persona validation/save issue.');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  }
}

// Run the check
checkDatabaseData();