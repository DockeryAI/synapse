#!/usr/bin/env tsx

/**
 * Test script to verify Opus profile generation works within timeout
 */

import { OnDemandProfileGenerator } from '../src/services/industry/OnDemandProfileGeneration'

async function testOpusProfile() {
  console.log('🧪 Testing Opus profile generation...\n')
  console.log('Industry: Direct Property & Casualty Insurance')
  console.log('NAICS: 524126')
  console.log('Model: anthropic/claude-opus-4.1')
  console.log('Max Tokens: 32000')
  console.log('Reduced Prompt: Yes (5-15 items per field instead of 10-50+)\n')

  const startTime = Date.now()

  try {
    console.log('📤 Starting generation...\n')

    const profile = await OnDemandProfileGenerator.generateProfile(
      'Direct Property & Casualty Insurance',
      '524126',
      (progress) => {
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        console.log(`[${elapsed}s] Stage: ${progress.stage}, Progress: ${progress.progress}%, Message: ${progress.message}`)
      }
    )

    const duration = (Date.now() - startTime) / 1000
    console.log(`\n✅ Success! Generation completed in ${duration.toFixed(1)} seconds\n`)

    // Check if we got all required fields
    const requiredFields = [
      'customer_triggers',
      'customer_journey',
      'transformations',
      'success_metrics',
      'urgency_drivers',
      'power_words',
      'headline_templates'
    ]

    console.log('Field Validation:')
    requiredFields.forEach(field => {
      const value = profile[field]
      if (value) {
        const count = Array.isArray(value) ? value.length : 'present'
        console.log(`  ✅ ${field}: ${count}`)
      } else {
        console.log(`  ❌ ${field}: MISSING`)
      }
    })

    console.log('\nProfile saved to database successfully!')

  } catch (error: any) {
    const duration = (Date.now() - startTime) / 1000
    console.error(`\n❌ Test Failed after ${duration.toFixed(1)} seconds:`, error.message)

    if (error.message.includes('timeout') || error.message.includes('504')) {
      console.error('\n🔴 Gateway Timeout Issue Detected!')
      console.error('The request took too long and was killed by Supabase gateway.')
      console.error('Need to either reduce prompt further or split into multiple calls.')
    }

    process.exit(1)
  }
}

testOpusProfile()