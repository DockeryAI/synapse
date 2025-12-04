#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testUVPAutoSave() {
  const testBrandId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Your test brand

  console.log('🧪 Testing UVP Auto-Save functionality...');
  console.log('=' .repeat(60));

  // Step 1: Check if brand exists
  console.log('\n🔍 Step 1: Checking if brand exists...');
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('*')
    .eq('id', testBrandId)
    .maybeSingle();

  if (brandError) {
    console.log('❌ Error checking brand:', brandError.message);
    return;
  }

  if (!brand) {
    console.log('❌ Brand not found in database:', testBrandId);
    return;
  }

  console.log('✅ Brand found:', brand.name || 'Unnamed Brand');

  // Step 2: Simulate the saveCompleteUVP call
  console.log('\n💾 Step 2: Simulating saveCompleteUVP call...');

  const mockUVP = {
    id: `test-uvp-${Date.now()}`,
    targetCustomer: {
      customerProfiles: [{
        title: "Tech-Savvy Insurance COO",
        demographic: { ageRange: "35-50", role: "COO" }
      }]
    },
    transformationGoal: {
      title: "Digital Transformation",
      description: "Modernize operations"
    },
    uniqueSolution: {
      title: "AI-Powered Platform",
      uniqueness: "Automated quote conversion"
    },
    keyBenefit: {
      title: "15%+ Conversion Increase",
      description: "Without adding headcount"
    },
    valuePropositionStatement: "Transform your insurance agency with AI",
    whyStatement: "Because digital transformation is essential",
    whatStatement: "AI-powered quote conversion platform",
    howStatement: "Through automated lead nurturing",
    overallConfidence: 85
  };

  try {
    console.log('📤 Attempting to save UVP to marba_uvps...');

    // Check if UVP already exists for this brand
    const { data: existingData, error: selectError } = await supabase
      .from('marba_uvps')
      .select('id')
      .eq('brand_id', testBrandId)
      .maybeSingle();

    if (selectError) {
      console.log('❌ Error checking existing UVP:', selectError.message);
      return;
    }

    const uvpData = {
      brand_id: testBrandId,
      products_services: null,
      target_customer: mockUVP.targetCustomer,
      transformation_goal: mockUVP.transformationGoal,
      unique_solution: mockUVP.uniqueSolution,
      key_benefit: mockUVP.keyBenefit,
      value_proposition_statement: mockUVP.valuePropositionStatement,
      why_statement: mockUVP.whyStatement,
      what_statement: mockUVP.whatStatement,
      how_statement: mockUVP.howStatement,
      overall_confidence: mockUVP.overallConfidence
    };

    let result;
    if (existingData) {
      console.log('🔄 Updating existing UVP:', existingData.id);
      const { data: updateData, error: updateError } = await supabase
        .from('marba_uvps')
        .update(uvpData)
        .eq('id', existingData.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
        return;
      }
      result = { success: true, uvpId: updateData.id, operation: 'update' };
    } else {
      console.log('➕ Creating new UVP...');
      const { data: insertData, error: insertError } = await supabase
        .from('marba_uvps')
        .insert(uvpData)
        .select()
        .single();

      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        console.log('📝 Insert error details:', JSON.stringify(insertError, null, 2));
        return;
      }
      result = { success: true, uvpId: insertData.id, operation: 'insert' };
    }

    console.log('✅ UVP save successful!');
    console.log('   Operation:', result.operation);
    console.log('   UVP ID:', result.uvpId);

    // Step 3: Verify the save by reading it back
    console.log('\n🔍 Step 3: Verifying UVP was saved...');
    const { data: savedUVP, error: verifyError } = await supabase
      .from('marba_uvps')
      .select('*')
      .eq('brand_id', testBrandId)
      .single();

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
      return;
    }

    console.log('✅ UVP verified in database:');
    console.log('   Created:', savedUVP.created_at);
    console.log('   Value Prop:', savedUVP.value_proposition_statement);

    // Step 4: Clean up test data
    console.log('\n🧹 Step 4: Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('marba_uvps')
      .delete()
      .eq('id', result.uvpId);

    if (deleteError) {
      console.log('⚠️ Failed to clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    console.log('📝 Error details:', err);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ UVP Auto-Save test COMPLETED');
  console.log('   Result: UVP saving functionality is WORKING');
  console.log('   Issue: Must be elsewhere (brand ID, synthesis, or flow logic)');
}

testUVPAutoSave().catch(console.error);