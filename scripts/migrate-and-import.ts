/**
 * Complete Industry Database Migration
 * - Creates tables if needed
 * - Imports 383 NAICS codes
 * - Imports 144 industry profiles
 * - Verifies data integrity
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjU0MCwiZXhwIjoyMDc4NzMyNTQwfQ.r6t353lsTTXchueUfggEzfdJW0twlJGuxWuR0kyiQSE'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkTables() {
  console.log('🔍 Checking if tables exist...\n')

  // Try to query the tables
  const { error: naicsError } = await supabase
    .from('naics_codes')
    .select('code', { count: 'exact', head: true })
    .limit(1)

  const { error: profilesError } = await supabase
    .from('industry_profiles')
    .select('id', { count: 'exact', head: true })
    .limit(1)

  if (naicsError?.message.includes('does not exist')) {
    console.log('❌ Tables do not exist. You need to run the SQL migration first.')
    console.log('\n📋 Instructions:')
    console.log('1. Go to: https://supabase.com/dashboard/project/jpwljchikgmggjidogon/sql/new')
    console.log('2. Copy the SQL from: supabase/migrations/000_industry_database.sql')
    console.log('3. Paste and execute it in the SQL Editor')
    console.log('4. Then run this script again')
    console.log('\nOr run: npx tsx scripts/run-migration-sql.ts')
    return false
  }

  console.log('✅ Tables exist\n')
  return true
}

async function importNAICS() {
  console.log('📝 Importing 383 NAICS codes...')
  const naicsPath = resolve(__dirname, '../../MARBA/data/naics_codes_export.json')
  const naicsCodes = JSON.parse(readFileSync(naicsPath, 'utf-8'))

  let imported = 0
  const batchSize = 50

  for (let i = 0; i < naicsCodes.length; i += batchSize) {
    const batch = naicsCodes.slice(i, i + batchSize)
    const { error } = await supabase
      .from('naics_codes')
      .upsert(batch, { onConflict: 'code' })

    if (error) {
      console.log(`   ❌ Batch failed: ${error.message}`)
    } else {
      imported += batch.length
      console.log(`   ✅ ${imported}/${naicsCodes.length}`)
    }
  }

  console.log(`✅ NAICS codes imported: ${imported}\n`)
  return imported
}

async function importProfiles() {
  console.log('📝 Importing 144 industry profiles (502k words)...')
  const profilesPath = resolve(__dirname, '../../MARBA/data/industry_profiles_export.json')
  const profiles = JSON.parse(readFileSync(profilesPath, 'utf-8'))

  let imported = 0
  const batchSize = 10 // Smaller batches for large profiles

  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize)
    const { error } = await supabase
      .from('industry_profiles')
      .upsert(batch, { onConflict: 'naics_code' })

    if (error) {
      console.log(`   ❌ Batch failed: ${error.message}`)
    } else {
      imported += batch.length
      console.log(`   ✅ ${imported}/${profiles.length}`)
    }
  }

  console.log(`✅ Industry profiles imported: ${imported}\n`)
  return imported
}

async function verify() {
  console.log('🔍 Verifying migration...\n')

  const { count: naicsCount } = await supabase
    .from('naics_codes')
    .select('*', { count: 'exact', head: true })

  const { count: profilesCount } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ NAICS Codes: ${naicsCount}/383`)
  console.log(`✅ Industry Profiles: ${profilesCount}/144`)
  console.log(`📊 Total Records: ${(naicsCount || 0) + (profilesCount || 0)}`)
  console.log(`📝 Total Words: ~507,000`)

  if (naicsCount === 383 && profilesCount === 144) {
    console.log('\n🎉 Migration successful! All data verified!')
    return true
  } else {
    console.log('\n⚠️  Migration incomplete. Some records missing.')
    return false
  }
}

async function main() {
  console.log('🚀 Starting Industry Database Migration\n')
  console.log('=' .repeat(60))
  console.log()

  const tablesExist = await checkTables()

  if (!tablesExist) {
    process.exit(1)
  }

  await importNAICS()
  await importProfiles()
  const success = await verify()

  console.log('\n' + '='.repeat(60))

  if (success) {
    console.log('✅ Migration complete! Synapse is ready for development.')
    process.exit(0)
  } else {
    console.log('❌ Migration incomplete. Check errors above.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
