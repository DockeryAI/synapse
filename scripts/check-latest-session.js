#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpwljchikgmggjidogon.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjU0MCwiZXhwIjoyMDc4NzMyNTQwfQ.r6t353lsTTXchueUfggEzfdJW0twlJGuxWuR0kyiQSE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 CHECKING DATABASE FOR YOUR SESSION...\n');
console.log('This queries the ACTUAL Supabase database');
console.log('NOT localStorage, NOT browser cache\n');
console.log('================================================\n');

async function checkLatestSessions() {
  // Get the most recent sessions from the database
  const { data: sessions, error } = await supabase
    .from('uvp_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('❌ Database query failed:', error.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('❌ NO SESSIONS FOUND IN DATABASE\n');
    return;
  }

  console.log(`✅ FOUND ${sessions.length} SESSIONS IN DATABASE\n`);

  // Show the most recent one in detail
  const latest = sessions[0];
  const now = new Date();
  const updated = new Date(latest.updated_at);
  const secondsAgo = Math.floor((now - updated) / 1000);

  console.log('📋 MOST RECENT SESSION (from database):');
  console.log('================================================');
  console.log(`Session ID: ${latest.id}`);
  console.log(`Session Name: ${latest.session_name}`);
  console.log(`Website URL: ${latest.website_url}`);
  console.log(`Brand ID: ${latest.brand_id || 'NULL (onboarding session)'}`);
  console.log(`Current Step: ${latest.current_step}`);
  console.log(`Progress: ${latest.progress_percentage}%`);
  console.log(`Updated: ${secondsAgo} seconds ago`);
  console.log(`Created: ${new Date(latest.created_at).toLocaleString()}`);
  console.log(`Last Accessed: ${new Date(latest.last_accessed).toLocaleString()}`);

  console.log('\n📊 SESSION DATA:');
  console.log('================================================');

  if (latest.business_info) {
    console.log('Business Info:', JSON.stringify(latest.business_info, null, 2));
  }

  if (latest.products_data) {
    console.log('Products Data:', JSON.stringify(latest.products_data, null, 2));
  }

  if (latest.customer_data) {
    console.log('Customer Data:', JSON.stringify(latest.customer_data, null, 2));
  }

  if (latest.transformation_data) {
    console.log('Transformation Data:', JSON.stringify(latest.transformation_data, null, 2));
  }

  if (latest.solution_data) {
    console.log('Solution Data:', JSON.stringify(latest.solution_data, null, 2));
  }

  if (latest.benefit_data) {
    console.log('Benefit Data:', JSON.stringify(latest.benefit_data, null, 2));
  }

  if (latest.complete_uvp) {
    console.log('Complete UVP:', JSON.stringify(latest.complete_uvp, null, 2));
  }

  console.log('\n📝 COMPLETED STEPS:', latest.completed_steps || []);

  console.log('\n================================================');
  console.log('✅ THIS DATA IS IN THE DATABASE');
  console.log('✅ NOT in localStorage');
  console.log('✅ Will survive clearing site data\n');

  // Show all sessions
  if (sessions.length > 1) {
    console.log(`\n📜 ALL ${sessions.length} SESSIONS IN DATABASE:`);
    console.log('================================================');
    sessions.forEach((s, i) => {
      const age = Math.floor((now - new Date(s.updated_at)) / 1000);
      console.log(`${i + 1}. ${s.session_name} (${age}s ago) - ${s.current_step} - ${s.progress_percentage}%`);
    });
    console.log('');
  }
}

checkLatestSessions();
