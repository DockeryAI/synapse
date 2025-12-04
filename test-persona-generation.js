#!/usr/bin/env node

console.log('🧪 Testing buyer persona generation...');

import { generateBuyerPersonasFromUVP } from './src/services/database/marba-uvp.service.js';

async function testPersonaGeneration() {
  try {
    // Test with the existing brand that has UVP data
    const brandId = '001e28bd-afa4-43e1-a262-7a459330cd01';

    console.log('1. Testing generateBuyerPersonasFromUVP for brand:', brandId);

    const result = await generateBuyerPersonasFromUVP(brandId);

    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log('   Personas created:', result.personasCreated);
      console.log('   Result:', result);
    } else {
      console.log('❌ FAILED:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPersonaGeneration();