#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLatestUVP() {
  const correctBrandId = '001e28bd-afa4-43e1-a262-7a459330cd01';

  console.log('🔍 Checking LATEST UVP data after fresh run...');
  console.log('=' .repeat(60));

  // Check for ALL UVP records for this brand (ordered by creation time)
  const { data: uvps, error } = await supabase
    .from('marba_uvps')
    .select('*')
    .eq('brand_id', correctBrandId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Error querying UVPs:', error.message);
    return;
  }

  console.log(`📊 Found ${uvps.length} UVP record(s) for brand ${correctBrandId}:`);

  uvps.forEach((uvp, i) => {
    console.log(`\n${i === 0 ? '🆕' : '📋'} UVP ${i + 1} ${i === 0 ? '(LATEST)' : ''}:`);
    console.log(`    ID: ${uvp.id}`);
    console.log(`    Created: ${uvp.created_at}`);
    console.log(`    Value Prop: ${uvp.value_proposition_statement?.substring(0, 80)}...`);

    // Check if target_customer has data
    const targetCustomer = uvp.target_customer;
    if (targetCustomer && typeof targetCustomer === 'object') {
      const profiles = targetCustomer.customerProfiles || [];
      console.log(`    Target Customer: ${profiles.length > 0 ? profiles[0].title : 'No profiles'}`);
      console.log(`    Industry: ${targetCustomer.industry || 'Not set'}`);
    } else {
      console.log(`    Target Customer: Not set or invalid format`);
    }

    // Check if transformation_goal has data
    const transformationGoal = uvp.transformation_goal;
    if (transformationGoal && typeof transformationGoal === 'object') {
      console.log(`    Transformation: ${transformationGoal.title || transformationGoal.description || 'Not set'}`);
    } else {
      console.log(`    Transformation: Not set`);
    }
  });

  // Check buyer personas again
  console.log('\n👥 Buyer Personas Status:');
  const { data: personas, error: personaError } = await supabase
    .from('buyer_personas')
    .select('*')
    .eq('brand_id', correctBrandId)
    .order('created_at', { ascending: false });

  if (personaError) {
    console.log('❌ Error querying personas:', personaError.message);
  } else {
    console.log(`   ${personas.length === 0 ? '❌' : '✅'} ${personas.length} buyer persona(s) found`);
    if (personas.length > 0) {
      personas.slice(0, 3).forEach((persona, i) => {
        console.log(`     ${i + 1}. ${persona.persona_name} (${persona.created_at})`);
      });
    }
  }

  console.log('\n' + '=' .repeat(60));

  if (uvps.length === 0) {
    console.log('🚨 NO UVP DATA FOUND - Fresh UVP run did not save');
  } else if (personas.length === 0) {
    console.log('⚠️ UVP saved but NO BUYER PERSONAS - This is why V6 shows "UVP Required"');
    console.log('   The V6 page specifically requires buyer personas to load the sidebar');
  } else {
    console.log('✅ Both UVP and buyer personas found - investigate V6 loading logic');
  }
}

checkLatestUVP().catch(console.error);