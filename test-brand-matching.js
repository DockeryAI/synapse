#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testBrandMatching() {
  console.log('🔍 Testing brand matching logic...');
  console.log('=' .repeat(60));

  // Step 1: Check existing OpenDialog brand
  console.log('\n📊 Step 1: Current OpenDialog brand details...');
  const { data: existingBrand, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !existingBrand) {
    console.log('❌ No brand found in database');
    return;
  }

  console.log('✅ Existing brand details:');
  console.log(`   ID: ${existingBrand.id}`);
  console.log(`   Name: ${existingBrand.name}`);
  console.log(`   Website: ${existingBrand.website}`);
  console.log(`   Industry: ${existingBrand.industry}`);

  // Step 2: Test various URL inputs that might be used
  const testUrls = [
    'https://opendialog.ai',
    'opendialog.ai',
    'https://www.opendialog.ai',
    'www.opendialog.ai',
    '',
    'https://demo.com',
    'My Business',
    null
  ];

  console.log('\n🧪 Step 2: Testing getOrCreateBrand with different URLs...');

  for (const testUrl of testUrls) {
    console.log(`\n  Testing URL: "${testUrl}"`);

    // Simulate normalization like the service does
    const normalizedUrl = testUrl && testUrl.startsWith('http') ? testUrl : `https://${testUrl || ''}`;
    console.log(`   Normalized: "${normalizedUrl}"`);

    // Check if this would match the existing brand
    const { data: matchingBrands, error: findError } = await supabase
      .from('brands')
      .select('*')
      .eq('website', normalizedUrl)
      .limit(1);

    if (findError) {
      console.log(`   ❌ Query error: ${findError.message}`);
      continue;
    }

    if (matchingBrands && matchingBrands.length > 0) {
      console.log(`   ✅ WOULD USE EXISTING: ${matchingBrands[0].name} (${matchingBrands[0].id})`);
    } else {
      console.log(`   ❌ WOULD CREATE NEW BRAND (no match for "${normalizedUrl}")`);
    }
  }

  // Step 3: Test what happens if UVP flow uses the EXACT same website
  console.log('\n🎯 Step 3: Testing with EXACT existing website...');
  const exactWebsite = existingBrand.website;

  console.log(`   Exact website: "${exactWebsite}"`);

  // This is what the UVP flow should pass to ensure brand reuse
  console.log('\n✅ SOLUTION: UVP flow should use:');
  console.log(`   website: "${exactWebsite}"`);
  console.log(`   name: "OpenDialog" (or any name)`);
  console.log(`   industry: "Software Publishers" (or any industry)`);
  console.log('\n💡 This will reuse the existing brand instead of creating new ones');

  // Step 4: Show the problem scenarios
  console.log('\n🚨 PROBLEM SCENARIOS (create new brands):');
  console.log('   - User enters different URL');
  console.log('   - User enters no URL (websiteUrl is empty)');
  console.log('   - URL normalization doesn\'t match exactly');
  console.log('\n🔧 FIX: Force UVP flow to use existing OpenDialog brand');
}

testBrandMatching().catch(console.error);