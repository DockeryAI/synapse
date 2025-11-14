/**
 * Clone MARBA Database to Synapse
 * 1. Export all data from MARBA tables
 * 2. Import to Synapse (migrations already copied)
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const marbaSupabase = createClient(
  'https://jpwljchikgmggjidogon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjU0MCwiZXhwIjoyMDc4NzMyNTQwfQ.r6t353lsTTXchueUfggEzfdJW0twlJGuxWuR0kyiQSE'
)

const synapseSupabase = createClient(
  'https://jpwljchikgmggjidogon.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjU0MCwiZXhwIjoyMDc4NzMyNTQwfQ.r6t353lsTTXchueUfggEzfdJW0twlJGuxWuR0kyiQSE'
)

const TABLES_TO_CLONE = [
  'brands',
  'industry_profiles',
  'mirror_sections',
  'marbs_conversations',
  'content_calendar_items',
  'design_templates',
  'analytics_events',
  'platform_metrics',
  'engagement_inbox',
  'mirror_intend_objectives',
  'api_keys',
  'api_usage_logs',
  'api_billing_events',
  'api_cost_aggregations',
  'enrichment_schedule',
  'intelligence_opportunities',
  'learning_patterns',
  'synapse_analysis_cache',
  'competitive_intelligence',
  'background_jobs',
  'design_studio_templates',
  'brand_uvps',
  'uvp_suggestions'
]

async function exportTable(tableName: string) {
  console.log(`📥 Exporting ${tableName}...`)

  const { data, error, count } = await marbaSupabase
    .from(tableName)
    .select('*', { count: 'exact' })

  if (error) {
    if (error.message.includes('does not exist')) {
      console.log(`   ⚠️  Table ${tableName} doesn't exist, skipping`)
      return null
    }
    throw error
  }

  console.log(`   ✅ ${count || 0} records`)

  // Save to file
  const dataDir = resolve(__dirname, '../data/marba-export')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const filePath = `${dataDir}/${tableName}.json`
  writeFileSync(filePath, JSON.stringify(data, null, 2))

  return { tableName, count: count || 0, records: data }
}

async function importTable(tableName: string, records: any[]) {
  if (!records || records.length === 0) {
    console.log(`   ⏭️  No data to import for ${tableName}`)
    return
  }

  console.log(`📤 Importing ${tableName} (${records.length} records)...`)

  const batchSize = tableName === 'industry_profiles' ? 10 : 50
  let imported = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    const { error } = await synapseSupabase
      .from(tableName)
      .upsert(batch, {
        onConflict: 'id'
      })

    if (error) {
      console.log(`   ❌ Batch ${i}-${i + batch.length}: ${error.message}`)
    } else {
      imported += batch.length
      console.log(`   ✅ ${imported}/${records.length}`)
    }
  }
}

async function main() {
  console.log('🚀 Cloning MARBA Database to Synapse\n')
  console.log('=' .repeat(70))
  console.log()

  console.log('📊 Step 1: Exporting all tables from MARBA...\n')

  const exports = []

  for (const tableName of TABLES_TO_CLONE) {
    const result = await exportTable(tableName)
    if (result) {
      exports.push(result)
    }
  }

  console.log(`\n✅ Export complete: ${exports.length} tables\n`)
  console.log('=' .repeat(70))

  console.log('\n📊 Step 2: Importing all tables to Synapse...\n')

  for (const exp of exports) {
    await importTable(exp.tableName, exp.records)
  }

  console.log('\n✅ Import complete!\n')
  console.log('=' .repeat(70))

  // Verify
  console.log('\n📊 Step 3: Verification...\n')

  for (const exp of exports) {
    const { count } = await synapseSupabase
      .from(exp.tableName)
      .select('*', { count: 'exact', head: true })

    const status = count === exp.count ? '✅' : '⚠️ '
    console.log(`${status} ${exp.tableName}: ${count}/${exp.count}`)
  }

  console.log('\n🎉 Database clone complete!')
}

main()
  .catch(err => {
    console.error('\n❌ Fatal error:', err.message)
    console.error(err)
    process.exit(1)
  })
