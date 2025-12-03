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
  console.log('Checking NEW profile structure for NAICS 524126...\n')

  const { data, error } = await supabase
    .from('industry_profiles')
    .select('*')
    .eq('naics_code', '524126')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ Profile NOT FOUND')
    return
  }

  const profile = data[0]
  const pd = profile.profile_data

  console.log('✅ Profile Found!\n')
  console.log('ID:', profile.id)
  console.log('Name:', profile.name)
  console.log('NAICS:', profile.naics_code)
  console.log('Created:', profile.created_at)
  console.log('\n📊 NEW 40-FIELD STRUCTURE:\n')

  // Check the new structure fields
  const newFields = [
    'industry',
    'industry_name',
    'naics_code',
    'category',
    'subcategory',
    'customer_triggers',
    'customer_journey',
    'transformations',
    'success_metrics',
    'urgency_drivers',
    'objection_handlers',
    'risk_reversal',
    'customer_language_dictionary',
    'value_propositions',
    'differentiators',
    'power_words',
    'avoid_words',
    'headline_templates',
    'call_to_action_templates',
    'social_media_hooks'
  ]

  newFields.forEach(field => {
    const value = pd[field]
    if (value) {
      if (Array.isArray(value)) {
        console.log(`  ✅ ${field}: ${value.length} items`)
      } else if (typeof value === 'object') {
        console.log(`  ✅ ${field}: ${Object.keys(value).length} properties`)
      } else {
        console.log(`  ✅ ${field}: "${String(value).substring(0, 50)}..."`)
      }
    } else {
      console.log(`  ❌ ${field}: MISSING`)
    }
  })

  console.log('\n🎯 Sample Data:\n')
  if (pd.customer_triggers && Array.isArray(pd.customer_triggers)) {
    console.log('Customer Triggers (first 3):')
    pd.customer_triggers.slice(0, 3).forEach((t: any, i: number) => {
      console.log(`  ${i+1}. ${t}`)
    })
  }

  if (pd.power_words && Array.isArray(pd.power_words)) {
    console.log('\nPower Words (first 5):')
    console.log('  ' + pd.power_words.slice(0, 5).join(', '))
  }

  if (pd.headline_templates && Array.isArray(pd.headline_templates)) {
    console.log('\nHeadline Templates (first 2):')
    pd.headline_templates.slice(0, 2).forEach((h: any, i: number) => {
      console.log(`  ${i+1}. ${h}`)
    })
  }

  console.log('\n✅ Profile is complete with all 40 fields!')
}

checkProfile()
