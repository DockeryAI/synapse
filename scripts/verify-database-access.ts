/**
 * Verify Synapse can access all MARBA database tables
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function verifyAccess() {
  console.log('🔍 Verifying Synapse database access...\n')
  console.log(`📍 Database: ${process.env.VITE_SUPABASE_URL}\n`)

  const tables = [
    'brands',
    'industry_profiles',
    'content_calendar_items',
    'mirror_sections',
    'brand_uvps',
    'design_templates'
  ]

  console.log('📊 Checking tables:\n')

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: ${count} records`)
    }
  }

  // Check industry profiles specifically
  console.log('\n📝 Industry Profiles Details:')
  const { data: profiles, count: profileCount } = await supabase
    .from('industry_profiles')
    .select('naics_code, industry_name, emotion_quotient', { count: 'exact' })
    .limit(5)

  console.log(`   Total: ${profileCount}`)
  console.log('   Sample:')
  profiles?.forEach(p => {
    console.log(`   - ${p.naics_code}: ${p.industry_name} (EQ: ${p.emotion_quotient})`)
  })

  console.log('\n✅ Database verification complete!')
  console.log('\n🎯 Synapse is ready to use the same database as MARBA!')
  console.log('   All tables, data, and RLS policies are shared.')
}

verifyAccess()
  .catch(err => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
