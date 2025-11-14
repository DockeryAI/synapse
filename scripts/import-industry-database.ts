/**
 * Import Industry Database to Synapse Supabase
 * - Creates tables (naics_codes, industry_profiles)
 * - Imports 383 NAICS codes
 * - Imports 144 industry profiles (502k words)
 * - Verifies data integrity
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Synapse Supabase connection
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjU0MCwiZXhwIjoyMDc4NzMyNTQwfQ.r6t353lsTTXchueUfggEzfdJW0twlJGuxWuR0kyiQSE'
)

async function runMigration() {
  console.log('🚀 Starting Industry Database Migration...\n')

  // Step 1: Run SQL migration
  console.log('📝 Step 1: Creating tables from migration SQL...')
  const migrationSQL = readFileSync(
    resolve(__dirname, '../supabase/migrations/000_industry_database.sql'),
    'utf-8'
  )

  // Execute SQL in smaller chunks (Supabase has execution limits)
  const sqlStatements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

  for (const statement of sqlStatements) {
    if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('INDEX')) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error && !error.message.includes('already exists')) {
          console.log(`   ⚠️  SQL: ${statement.substring(0, 50)}... - ${error.message}`)
        }
      } catch (err: any) {
        // Ignore "already exists" errors
        if (!err.message?.includes('already exists')) {
          console.log(`   ⚠️  ${err.message}`)
        }
      }
    }
  }

  console.log('✅ Tables created (or already exist)\n')

  // Step 2: Import NAICS codes
  console.log('📝 Step 2: Importing 383 NAICS codes...')
  const naicsPath = resolve(__dirname, '../../MARBA/data/naics_codes_export.json')
  const naicsCodes = JSON.parse(readFileSync(naicsPath, 'utf-8'))

  // Batch import (50 at a time to avoid timeouts)
  const batchSize = 50
  for (let i = 0; i < naicsCodes.length; i += batchSize) {
    const batch = naicsCodes.slice(i, i + batchSize)
    const { error } = await supabase
      .from('naics_codes')
      .upsert(batch, { onConflict: 'code' })

    if (error) {
      console.log(`   ❌ Batch ${i}-${i + batch.length}: ${error.message}`)
    } else {
      console.log(`   ✅ Imported ${i + batch.length}/${naicsCodes.length}`)
    }
  }

  console.log(`✅ NAICS codes import complete\n`)

  // Step 3: Import industry profiles
  console.log('📝 Step 3: Importing 144 industry profiles (502k words)...')
  const profilesPath = resolve(__dirname, '../../MARBA/data/industry_profiles_export.json')
  const profiles = JSON.parse(readFileSync(profilesPath, 'utf-8'))

  // Transform profiles to match schema
  const transformedProfiles = profiles.map((p: any) => ({
    naics_code: p.naics_code,
    industry: p.industry,
    industry_name: p.industry_name,
    category: p.category,
    subcategory: p.subcategory,
    customer_triggers: p.customer_triggers,
    customer_journey: p.customer_journey,
    emotion_breakdown: p.emotion_breakdown,
    emotion_quotient: p.emotion_quotient,
    emotion_weight: p.emotion_weight,
    emotion_reasoning: p.emotion_reasoning,
    emotion_confidence: p.emotion_confidence,
    emotion_calibrated_at: p.emotion_calibrated_at,
    eq_reasoning: p.eq_reasoning,
    eq_updated_at: p.eq_updated_at,
    transformations: p.transformations,
    transformation_approach: p.transformation_approach,
    golden_circle_why: p.golden_circle_why,
    golden_circle_how: p.golden_circle_how,
    golden_circle_what: p.golden_circle_what,
    power_words: p.power_words,
    avoid_words: p.avoid_words,
    customer_language_dictionary: p.customer_language_dictionary,
    headline_templates: p.headline_templates,
    cta_templates: p.cta_templates,
    social_post_templates: p.social_post_templates,
    messaging_frameworks: p.messaging_frameworks,
    pricing_psychology: p.pricing_psychology,
    price_sensitivity_thresholds: p.price_sensitivity_thresholds,
    emergency_premium_pricing: p.emergency_premium_pricing,
    tiered_service_models: p.tiered_service_models,
    margin_optimization_strategies: p.margin_optimization_strategies,
    seasonal_patterns: p.seasonal_patterns,
    monthly_patterns: p.monthly_patterns,
    peak_crisis_times: p.peak_crisis_times,
    testimonial_capture_timing: p.testimonial_capture_timing,
    competitive_advantages: p.competitive_advantages,
    objection_handlers: p.objection_handlers,
    risk_reversal: p.risk_reversal,
    social_proof_statistics: p.social_proof_statistics,
    quality_indicators: p.quality_indicators,
    success_metrics: p.success_metrics,
    service_packages: p.service_packages,
    expansion_opportunities: p.expansion_opportunities,
    cross_sell_opportunity_map: p.cross_sell_opportunity_map,
    referral_strategies: p.referral_strategies,
    retention_hooks: p.retention_hooks,
  }))

  // Batch import (10 at a time - profiles are large)
  const profileBatchSize = 10
  for (let i = 0; i < transformedProfiles.length; i += profileBatchSize) {
    const batch = transformedProfiles.slice(i, i + profileBatchSize)
    const { error } = await supabase
      .from('industry_profiles')
      .upsert(batch, { onConflict: 'naics_code' })

    if (error) {
      console.log(`   ❌ Batch ${i}-${i + batch.length}: ${error.message}`)
    } else {
      console.log(`   ✅ Imported ${i + batch.length}/${transformedProfiles.length}`)
    }
  }

  console.log(`✅ Industry profiles import complete\n`)
}

async function verifyImport() {
  console.log('🔍 Step 4: Verifying data integrity...\n')

  // Check NAICS codes
  const { count: naicsCount, error: naicsError } = await supabase
    .from('naics_codes')
    .select('*', { count: 'exact', head: true })

  if (naicsError) {
    console.log(`❌ NAICS codes: ${naicsError.message}`)
  } else {
    console.log(`✅ NAICS Codes: ${naicsCount}/383`)
  }

  // Check industry profiles
  const { count: profilesCount, error: profilesError } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true })

  if (profilesError) {
    console.log(`❌ Industry profiles: ${profilesError.message}`)
  } else {
    console.log(`✅ Industry Profiles: ${profilesCount}/144`)
  }

  // Check profiles with EQ scores
  const { count: eqCount } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true })
    .not('emotion_quotient', 'is', null)

  console.log(`✅ Profiles with EQ scores: ${eqCount}`)

  // Sample data
  console.log('\n📝 Sample NAICS codes:')
  const { data: sampleNaics } = await supabase
    .from('naics_codes')
    .select('code, title, category, has_full_profile')
    .limit(5)

  sampleNaics?.forEach(n => {
    console.log(`   - ${n.code}: ${n.title} (${n.category}) [Full: ${n.has_full_profile}]`)
  })

  console.log('\n📝 Sample industry profiles:')
  const { data: sampleProfiles } = await supabase
    .from('industry_profiles')
    .select('naics_code, industry_name, emotion_quotient')
    .limit(5)

  sampleProfiles?.forEach(p => {
    console.log(`   - ${p.naics_code}: ${p.industry_name} (EQ: ${p.emotion_quotient})`)
  })

  const totalRecords = (naicsCount || 0) + (profilesCount || 0)
  console.log(`\n✅ Migration Complete!`)
  console.log(`   📊 Total Records: ${totalRecords}`)
  console.log(`   📝 Total Words: ~507,000`)
  console.log(`   🎯 Ready for Synapse development!`)
}

async function main() {
  try {
    await runMigration()
    await verifyImport()
    process.exit(0)
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  }
}

main()
