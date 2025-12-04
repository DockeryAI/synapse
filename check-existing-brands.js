#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkExistingBrands() {
  console.log('🔍 Checking all brands in database...');
  console.log('=' .repeat(60));

  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name, website, industry, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.log('❌ Error querying brands:', error.message);
    return;
  }

  if (brands.length === 0) {
    console.log('❌ NO brands found in database');
    console.log('\n💡 This explains why UVP data isn\'t saving!');
    console.log('   The UVP flow is trying to save with a brand ID that doesn\'t exist.');
    return;
  }

  console.log(`✅ Found ${brands.length} brand(s):`);
  console.log('');

  brands.forEach((brand, i) => {
    console.log(`Brand ${i + 1}:`);
    console.log(`  ID: ${brand.id}`);
    console.log(`  Name: ${brand.name || 'Unnamed'}`);
    console.log(`  Website: ${brand.website || 'None'}`);
    console.log(`  Industry: ${brand.industry || 'None'}`);
    console.log(`  Created: ${brand.created_at}`);
    console.log('');
  });

  // Check the specific brand ID being used
  console.log('🎯 Checking the specific brand ID from UVP flow...');
  const targetBrandId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const { data: targetBrand, error: targetError } = await supabase
    .from('brands')
    .select('*')
    .eq('id', targetBrandId)
    .maybeSingle();

  if (targetError) {
    console.log('❌ Error checking target brand:', targetError.message);
  } else if (!targetBrand) {
    console.log('❌ Target brand ID NOT FOUND:', targetBrandId);
    console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
    console.log('   The UVP flow is using a brand ID that doesn\'t exist in the database.');
    console.log('   This is why NO UVP data (including personas) is being saved.');
  } else {
    console.log('✅ Target brand found:', targetBrand.name);
  }
}

checkExistingBrands().catch(console.error);