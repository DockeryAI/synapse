import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MTg5NzcsImV4cCI6MjA0NTI5NDk3N30.yJBXy-LVIuqZKE5GVdFYjSiBF0YgJhHrXHwQ2WFfFLw'

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
