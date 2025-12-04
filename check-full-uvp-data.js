#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAllUVPData() {
  const brandId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Your test brand

  console.log('🔍 Checking all UVP-related data for brand:', brandId);
  console.log('=' .repeat(60));

  // Check marba_uvps table
  console.log('\n📋 MARBA UVPs Table:');
  const { data: uvps, error: uvpError } = await supabase
    .from('marba_uvps')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (uvpError) {
    console.log('❌ Error querying UVPs:', uvpError.message);
  } else if (uvps.length === 0) {
    console.log('❌ No UVP records found');
  } else {
    console.log(`✅ Found ${uvps.length} UVP record(s):`);
    uvps.forEach((uvp, i) => {
      console.log(`\n  UVP ${i + 1}:`);
      console.log(`    ID: ${uvp.id}`);
      console.log(`    Created: ${uvp.created_at}`);
      console.log(`    Target Audience: ${uvp.target_audience || 'null'}`);
      console.log(`    Pain Point: ${uvp.pain_point ? uvp.pain_point.substring(0, 100) + '...' : 'null'}`);
      console.log(`    Solution: ${uvp.solution ? uvp.solution.substring(0, 100) + '...' : 'null'}`);
      console.log(`    Unique Mechanism: ${uvp.unique_mechanism ? uvp.unique_mechanism.substring(0, 100) + '...' : 'null'}`);
      console.log(`    Proof: ${uvp.proof ? uvp.proof.substring(0, 100) + '...' : 'null'}`);
      console.log(`    Objection Handling: ${uvp.objection_handling ? uvp.objection_handling.substring(0, 100) + '...' : 'null'}`);
    });
  }

  // Check value_propositions table
  console.log('\n\n💡 Value Propositions Table:');
  const { data: valueProps, error: vpError } = await supabase
    .from('value_propositions')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (vpError) {
    console.log('❌ Error querying Value Props:', vpError.message);
  } else if (valueProps.length === 0) {
    console.log('❌ No value proposition records found');
  } else {
    console.log(`✅ Found ${valueProps.length} value proposition(s):`);
    valueProps.forEach((vp, i) => {
      console.log(`\n  Value Prop ${i + 1}:`);
      console.log(`    ID: ${vp.id}`);
      console.log(`    Created: ${vp.created_at}`);
      console.log(`    Title: ${vp.title || 'null'}`);
      console.log(`    Description: ${vp.description ? vp.description.substring(0, 100) + '...' : 'null'}`);
      console.log(`    Target Segment: ${vp.target_segment || 'null'}`);
    });
  }

  // Check core_truth_insights table
  console.log('\n\n🎯 Core Truth Insights Table:');
  const { data: insights, error: insightError } = await supabase
    .from('core_truth_insights')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (insightError) {
    console.log('❌ Error querying Core Truth Insights:', insightError.message);
  } else if (insights.length === 0) {
    console.log('❌ No core truth insight records found');
  } else {
    console.log(`✅ Found ${insights.length} core truth insight(s):`);
    insights.forEach((insight, i) => {
      console.log(`\n  Insight ${i + 1}:`);
      console.log(`    ID: ${insight.id}`);
      console.log(`    Created: ${insight.created_at}`);
      console.log(`    Category: ${insight.category || 'null'}`);
      console.log(`    Insight: ${insight.insight ? insight.insight.substring(0, 150) + '...' : 'null'}`);
      console.log(`    Confidence: ${insight.confidence_score || 'null'}`);
    });
  }

  // Check buyer_personas table (for completeness)
  console.log('\n\n👥 Buyer Personas Table:');
  const { data: personas, error: personaError } = await supabase
    .from('buyer_personas')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (personaError) {
    console.log('❌ Error querying Buyer Personas:', personaError.message);
  } else if (personas.length === 0) {
    console.log('❌ No buyer persona records found');
  } else {
    console.log(`✅ Found ${personas.length} buyer persona(s):`);
    personas.forEach((persona, i) => {
      console.log(`\n  Persona ${i + 1}:`);
      console.log(`    ID: ${persona.id}`);
      console.log(`    Created: ${persona.created_at}`);
      console.log(`    Name: ${persona.persona_name || 'null'}`);
      console.log(`    Archetype: ${persona.archetype || 'null'}`);
    });
  }

  // Check UVP sessions
  console.log('\n\n📊 UVP Sessions (localStorage backup):');
  console.log('(Note: These are stored in browser localStorage, not database)');

  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`   UVP Records: ${uvps?.length || 0}`);
  console.log(`   Value Props: ${valueProps?.length || 0}`);
  console.log(`   Core Truth Insights: ${insights?.length || 0}`);
  console.log(`   Buyer Personas: ${personas?.length || 0}`);

  if ((uvps?.length || 0) > 0 || (valueProps?.length || 0) > 0 || (insights?.length || 0) > 0) {
    console.log('\n✅ UVP data IS being saved to database (not just personas issue)');
  } else {
    console.log('\n❌ NO UVP data found in database - broader saving issue');
  }
}

checkAllUVPData().catch(console.error);