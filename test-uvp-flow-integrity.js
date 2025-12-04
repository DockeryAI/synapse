#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testUVPFlowIntegrity() {
  const brandId = '001e28bd-afa4-43e1-a262-7a459330cd01';

  console.log('🚨 URGENT: Testing if my changes broke the UVP flow...');
  console.log('=' .repeat(60));

  // Check current UVP data
  const { data: uvps, error } = await supabase
    .from('marba_uvps')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('❌ ERROR querying UVP:', error.message);
    return;
  }

  if (uvps.length === 0) {
    console.log('❌ NO UVP FOUND - UVP flow may be broken');
    return;
  }

  const uvp = uvps[0];
  console.log('✅ Latest UVP found:');
  console.log(`   ID: ${uvp.id}`);
  console.log(`   Created: ${uvp.created_at}`);
  console.log(`   Value Prop: ${uvp.value_proposition_statement?.substring(0, 80)}...`);

  // Check critical UVP components
  const hasValueProp = !!uvp.value_proposition_statement;
  const hasTargetCustomer = !!uvp.target_customer;
  const hasKeyBenefit = !!uvp.key_benefit;
  const hasUniqueSolution = !!uvp.unique_solution;

  console.log('\n🔍 UVP Component Check:');
  console.log(`   Value Proposition: ${hasValueProp ? '✅' : '❌'}`);
  console.log(`   Target Customer: ${hasTargetCustomer ? '✅' : '❌'}`);
  console.log(`   Key Benefit: ${hasKeyBenefit ? '✅' : '❌'}`);
  console.log(`   Unique Solution: ${hasUniqueSolution ? '✅' : '❌'}`);

  const uvpIntact = hasValueProp && hasTargetCustomer && hasKeyBenefit && hasUniqueSolution;

  // Check buyer personas separately
  const { data: personas, error: personaError } = await supabase
    .from('buyer_personas')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  console.log('\n👥 Buyer Personas Check:');
  if (personaError) {
    console.log(`   ❌ Error: ${personaError.message}`);
  } else {
    console.log(`   Count: ${personas.length}`);
    if (personas.length > 0) {
      console.log(`   Latest: ${personas[0].persona_name} (${personas[0].created_at})`);
    }
  }

  console.log('\n' + '=' .repeat(60));

  if (uvpIntact) {
    console.log('✅ UVP FLOW IS INTACT - Core UVP data is complete');
    if (personas.length === 0) {
      console.log('⚠️  Issue is ONLY with persona saving, not UVP synthesis');
    } else {
      console.log('✅ Both UVP and personas are working');
    }
  } else {
    console.log('🚨 UVP FLOW MAY BE BROKEN - Missing core components');
    console.log('   Need to revert changes and fix persona issue differently');
  }
}

testUVPFlowIntegrity().catch(console.error);