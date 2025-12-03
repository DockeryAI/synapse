import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecent() {
  console.log('Checking all profiles created in last hour...\n')

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('industry_profiles')
    .select('*')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ No profiles created in the last hour')
    return
  }

  console.log(`✅ Found ${data.length} profile(s) created in last hour:\n`)

  data.forEach((profile: any, idx: number) => {
    console.log(`Profile ${idx + 1}:`)
    console.log('  ID:', profile.id)
    console.log('  Name:', profile.name)
    console.log('  NAICS:', profile.naics_code)
    console.log('  Created:', profile.created_at)

    if (profile.profile_data) {
      const pd = profile.profile_data
      console.log('  Has Psychological Profile:', pd.psychological_profile ? '✅' : '❌')
      console.log('  Has Buyer Journey:', pd.buyer_journey ? '✅' : '❌')
      console.log('  Pain Points:', pd.pain_points?.length || 0)
      console.log('  Motivations:', pd.motivations?.length || 0)
    } else {
      console.log('  Profile Data: ❌ MISSING')
    }
    console.log('')
  })
}

checkRecent()
