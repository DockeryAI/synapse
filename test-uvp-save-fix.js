#!/usr/bin/env node

console.log('🧪 Testing UVP database save fix...');

// Test the saveCompleteUVP function with no brandId to verify database persistence
import { saveCompleteUVP } from './src/services/database/marba-uvp.service.js';

const testUVP = {
  targetCustomer: {
    customerProfiles: [
      {
        title: "Insurance Agency Owner",
        description: "Small to medium insurance agencies struggling with lead conversion",
        pain_points: ["Low online conversion rates", "Manual follow-up processes"],
        desired_outcomes: ["Higher conversion rates", "Automated lead nurturing"]
      }
    ]
  },
  transformationGoal: "Convert 15% more online quotes into policies",
  uniqueSolution: "AI-powered quote automation with 24/7 availability",
  keyBenefit: "Stop losing 70% of online prospects while you sleep",
  differentiationStatement: "Purpose-built for regulated industries with compliance focus"
};

async function testDatabaseSave() {
  try {
    console.log('1. Testing saveCompleteUVP with NO brandId (should create brand and save to database)');

    const result = await saveCompleteUVP(testUVP, null);

    if (result.success) {
      console.log('✅ SUCCESS! UVP saved to database');
      console.log('   UVP ID:', result.uvpId);
      console.log('   Session ID:', result.sessionId);

      if (result.uvpId) {
        console.log('✅ CRITICAL FIX VERIFIED: Database save successful even without brandId');
      } else if (result.sessionId) {
        console.log('⚠️  FALLBACK: Saved to localStorage (will be migrated later)');
      }
    } else {
      console.log('❌ FAILED:', result.error);
    }

    console.log('\n2. Checking what the user would see in browser console:');
    console.log('   - Look for "[MarbaUVPService] Saving complete UVP..." logs');
    console.log('   - Look for "[MarbaUVPService] ✅ Created/found brand for database save" logs');
    console.log('   - Look for "[UVP Flow]" logs in OnboardingPageV5');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testDatabaseSave();