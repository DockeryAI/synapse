#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUVPAfterCompletion() {
  const correctBrandId = '001e28bd-afa4-43e1-a262-7a459330cd01'; // OpenDialog brand

  console.log('🔍 Checking UVP data after completion...');
  console.log('=' .repeat(60));
  console.log(`Brand ID: ${correctBrandId}`);

  // Check marba_uvps table
  console.log('\n📋 1. MARBA UVPs Table:');
  const { data: uvps, error: uvpError } = await supabase
    .from('marba_uvps')
    .select('*')
    .eq('brand_id', correctBrandId)
    .order('created_at', { ascending: false });

  if (uvpError) {
    console.log('❌ Error querying UVPs:', uvpError.message);
  } else if (uvps.length === 0) {
    console.log('❌ NO UVP records found');
  } else {
    console.log(`✅ Found ${uvps.length} UVP record(s):`);
    uvps.forEach((uvp, i) => {
      console.log(`\n  UVP ${i + 1}:`);
      console.log(`    ID: ${uvp.id}`);
      console.log(`    Created: ${uvp.created_at}`);
      console.log(`    Value Prop: ${uvp.value_proposition_statement?.substring(0, 100)}...`);
      console.log(`    Target Customer: ${uvp.target_customer?.customerProfiles?.[0]?.title || 'Not set'}`);
    });
  }

  // Check buyer_personas table
  console.log('\n👥 2. Buyer Personas Table:');
  const { data: personas, error: personaError } = await supabase
    .from('buyer_personas')
    .select('*')
    .eq('brand_id', correctBrandId)
    .order('created_at', { ascending: false});

  if (personaError) {
    console.log('❌ Error querying personas:', personaError.message);
  } else if (personas.length === 0) {
    console.log('❌ NO buyer persona records found');
  } else {
    console.log(`✅ Found ${personas.length} buyer persona(s):`);
    personas.forEach((persona, i) => {
      console.log(`\n  Persona ${i + 1}:`);
      console.log(`    ID: ${persona.id}`);
      console.log(`    Created: ${persona.created_at}`);
      console.log(`    Name: ${persona.persona_name}`);
      console.log(`    Archetype: ${persona.archetype || 'Not set'}`);
    });
  }

  // Check value_propositions table
  console.log('\n💡 3. Value Propositions Table:');
  const { data: valueProps, error: vpError } = await supabase
    .from('value_propositions')
    .select('*')
    .eq('brand_id', correctBrandId)
    .order('created_at', { ascending: false});

  if (vpError) {
    console.log('❌ Error querying value props:', vpError.message);
  } else if (valueProps.length === 0) {
    console.log('❌ NO value proposition records found');
  } else {
    console.log(`✅ Found ${valueProps.length} value proposition(s):`);
    valueProps.forEach((vp, i) => {
      console.log(`\n  Value Prop ${i + 1}:`);
      console.log(`    ID: ${vp.id}`);
      console.log(`    Created: ${vp.created_at}`);
      console.log(`    Title: ${vp.title || 'Untitled'}`);
    });
  }

  // Check core_truth_insights table
  console.log('\n🎯 4. Core Truth Insights Table:');
  const { data: insights, error: insightError } = await supabase
    .from('core_truth_insights')
    .select('*')
    .eq('brand_id', correctBrandId)
    .order('created_at', { ascending: false });

  if (insightError) {
    console.log('❌ Error querying insights:', insightError.message);
  } else if (insights.length === 0) {
    console.log('❌ NO core truth insight records found');
  } else {
    console.log(`✅ Found ${insights.length} core truth insight(s):`);
    insights.forEach((insight, i) => {
      console.log(`\n  Insight ${i + 1}:`);
      console.log(`    ID: ${insight.id}`);
      console.log(`    Created: ${insight.created_at}`);
      console.log(`    Category: ${insight.category || 'Uncategorized'}`);
    });
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`   UVP Records: ${uvps?.length || 0}`);
  console.log(`   Buyer Personas: ${personas?.length || 0}`);
  console.log(`   Value Props: ${valueProps?.length || 0}`);
  console.log(`   Core Truth Insights: ${insights?.length || 0}`);

  const totalRecords = (uvps?.length || 0) + (personas?.length || 0) + (valueProps?.length || 0) + (insights?.length || 0);

  if (totalRecords === 0) {
    console.log('\n❌ NO UVP DATA FOUND - UVP completion did not save to database');
    console.log('\n🚨 DIAGNOSIS: Brand ID fix worked, but UVP auto-save may have failed');
    console.log('   - Check browser logs for save errors during UVP synthesis');
    console.log('   - Verify UVP synthesis step completed properly');
    console.log('   - Check for RLS policy blocking saves');
  } else {
    console.log('\n✅ UVP DATA FOUND - Checking what\'s missing...');
    if ((personas?.length || 0) === 0) {
      console.log('   ⚠️  Missing buyer personas (main V6 error)');
    }
    if ((uvps?.length || 0) === 0) {
      console.log('   ⚠️  Missing main UVP record');
    }
  }
}

checkUVPAfterCompletion().catch(console.error);