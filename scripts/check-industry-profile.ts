import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfile() {
  console.log('Checking for Direct Property & Casualty Insurance profile (NAICS 524126)...')

  const { data, error } = await supabase
    .from('industry_profiles')
    .select('*')
    .eq('naics_code', '524126')
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data) {
    console.log('❌ Profile NOT FOUND in database')
    return
  }

  console.log('✅ Profile EXISTS:')
  console.log(JSON.stringify(data, null, 2))
}

checkProfile()
