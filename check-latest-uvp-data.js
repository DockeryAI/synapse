#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLatestData() {
  const brandId = '001e28bd-afa4-43e1-a262-7a459330cd01';

  console.log('🔍 Checking for latest UVP data and session activity...');
  console.log('=' .repeat(60));

  // Check UVP records with timestamps
  const { data: uvps, error: uvpError } = await supabase
    .from('marba_uvps')
    .select('*')
    .eq('brand_id', brandId)
    .order('updated_at', { ascending: false });

  console.log('\n📋 UVP Records:');
  if (uvpError || !uvps) {
    console.log('❌ Error:', uvpError);
  } else {
    uvps.forEach((uvp, i) => {
      console.log(`   ${i + 1}. ID: ${uvp.id}`);
      console.log(`      Created: ${uvp.created_at}`);
      console.log(`      Updated: ${uvp.updated_at}`);
      console.log(`      Value Prop: ${uvp.value_proposition_statement?.substring(0, 60)}...`);
    });
  }

  // Check UVP sessions with timestamps
  const { data: sessions, error: sessionError } = await supabase
    .from('uvp_sessions')
    .select('*')
    .eq('brand_id', brandId)
    .order('updated_at', { ascending: false});

  console.log('\n📋 UVP Sessions:');
  if (sessionError || !sessions) {
    console.log('❌ Error:', sessionError);
  } else {
    sessions.forEach((session, i) => {
      console.log(`   ${i + 1}. ID: ${session.id}`);
      console.log(`      Created: ${session.created_at}`);
      console.log(`      Updated: ${session.updated_at}`);
      console.log(`      Step: ${session.current_step}`);
    });
  }

  // Check buyer personas with timestamps
  const { data: personas, error: personaError } = await supabase
    .from('buyer_personas')
    .select('*')
    .eq('brand_id', brandId)
    .order('updated_at', { ascending: false});

  console.log('\n👥 Buyer Personas:');
  if (personaError || !personas) {
    console.log('❌ Error:', personaError);
  } else if (personas.length === 0) {
    console.log('❌ No buyer personas found');
  } else {
    personas.forEach((persona, i) => {
      console.log(`   ${i + 1}. ID: ${persona.id}`);
      console.log(`      Created: ${persona.created_at}`);
      console.log(`      Updated: ${persona.updated_at}`);
      console.log(`      Name: ${persona.name || 'Unnamed'}`);
    });
  }

  console.log('\n🕐 Analysis based on timestamps:');
  const latestUVP = uvps[0];
  const latestSession = sessions[0];
  const latestPersona = personas[0];

  if (latestUVP) {
    const uvpTime = new Date(latestUVP.updated_at);
    console.log(`   Latest UVP updated: ${uvpTime.toLocaleString()}`);
  }

  if (latestSession) {
    const sessionTime = new Date(latestSession.updated_at);
    console.log(`   Latest session updated: ${sessionTime.toLocaleString()}`);
  }

  if (latestPersona) {
    const personaTime = new Date(latestPersona.created_at);
    console.log(`   Latest persona created: ${personaTime.toLocaleString()}`);
  }

  const now = new Date();
  console.log(`   Current time: ${now.toLocaleString()}`);

  console.log('\n💭 Diagnosis:');
  console.log('   - If UVP updated recently but personas are old: UVP ran but persona saving failed');
  console.log('   - If both UVP and session are old: You may not have completed a full UVP flow');
  console.log('   - Check browser console during UVP completion for persona saving logs');
}

checkLatestData().catch(console.error);