import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpwljchikgmggjidogon.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTY1NDAsImV4cCI6MjA3ODczMjU0MH0.At0TEROiEHP2XZQ7ccEErLa2qUG6LtGFwDJl4ukpTuo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfile() {
  console.log('Checking for Direct Property & Casualty Insurance profile (NAICS 524126)...\n')

  const { data, error } = await supabase
    .from('industry_profiles')
    .select('*')
    .eq('naics_code', '524126')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ Profile NOT FOUND in database')
    return
  }

  console.log(`✅ Found ${data.length} profile(s):\n`)

  data.forEach((profile: any, idx: number) => {
    console.log(`Profile ${idx + 1}:`)
    console.log('  ID:', profile.id)
    console.log('  Name:', profile.name)
    console.log('  NAICS:', profile.naics_code)
    console.log('  Created:', profile.created_at)
    console.log('  Profile Data:', profile.profile_data ? 'EXISTS' : 'MISSING')

    if (profile.profile_data) {
      const pd = profile.profile_data
      console.log('    - Description:', pd.description ? 'YES' : 'NO')
      console.log('    - Emotional Triggers:', pd.emotional_triggers?.length || 0)
      console.log('    - Psychological Profile:', pd.psychological_profile ? 'YES' : 'NO')
      console.log('    - Buyer Journey:', pd.buyer_journey ? 'YES' : 'NO')
      console.log('    - Pain Points:', pd.pain_points?.length || 0)
      console.log('    - Motivations:', pd.motivations?.length || 0)
      console.log('    - Decision Makers:', pd.decision_makers?.length || 0)
      console.log('    - Buying Triggers:', pd.buying_triggers?.length || 0)
    }
    console.log('')
  })
}

checkProfile()
