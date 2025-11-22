/**
 * Test script to verify brand insertion works for anonymous users
 * Run with: npx ts-node scripts/test-brand-insert.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBrandInsert() {
  console.log('Testing brand insert for anonymous user...\n');

  // Test 1: Check if we can insert without user_id
  console.log('Test 1: Insert brand without user_id');
  const { data: brand1, error: error1 } = await supabase
    .from('brands')
    .insert({
      name: 'Test Brand',
      industry: 'test',
      website: 'https://test.com',
    })
    .select('id')
    .single();

  if (error1) {
    console.error('  FAILED:', error1.message);
    if (error1.message.includes('not-null')) {
      console.log('  -> brands table requires user_id NOT NULL');
      console.log('  -> Need to ALTER TABLE brands ALTER COLUMN user_id DROP NOT NULL');
    }
  } else {
    console.log('  SUCCESS: Brand created with id:', brand1.id);

    // Cleanup
    await supabase.from('brands').delete().eq('id', brand1.id);
    console.log('  Cleaned up test brand');
  }

  // Test 2: Check marba_uvps table
  console.log('\nTest 2: Insert into marba_uvps');
  const testBrandId = '00000000-0000-0000-0000-000000000001';
  const { data: uvp, error: uvpError } = await supabase
    .from('marba_uvps')
    .insert({
      brand_id: testBrandId,
      target_customer: { test: true },
      transformation_goal: { test: true },
      unique_solution: { test: true },
      key_benefit: { test: true },
      value_proposition_statement: 'Test UVP',
    })
    .select('id')
    .single();

  if (uvpError) {
    console.error('  FAILED:', uvpError.message);
  } else {
    console.log('  SUCCESS: UVP created with id:', uvp.id);

    // Cleanup
    await supabase.from('marba_uvps').delete().eq('id', uvp.id);
    console.log('  Cleaned up test UVP');
  }

  // Test 3: Check uvp_sessions table
  console.log('\nTest 3: Insert into uvp_sessions');
  const { data: session, error: sessionError } = await supabase
    .from('uvp_sessions')
    .insert({
      brand_id: testBrandId,
      session_name: 'Test Session',
      website_url: 'https://test.com',
      current_step: 'products',
    })
    .select('id')
    .single();

  if (sessionError) {
    console.error('  FAILED:', sessionError.message);
  } else {
    console.log('  SUCCESS: Session created with id:', session.id);

    // Cleanup
    await supabase.from('uvp_sessions').delete().eq('id', session.id);
    console.log('  Cleaned up test session');
  }

  console.log('\n--- Tests Complete ---');
}

testBrandInsert().catch(console.error);
