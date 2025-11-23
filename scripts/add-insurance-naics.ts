import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const insuranceNaics = [
  {
    code: '5241',
    title: 'Insurance Carriers',
    category: 'Professional Services',
    keywords: ['insurance', 'insurance carrier', 'life insurance', 'health insurance', 'property insurance'],
    has_full_profile: true,
    popularity: 8
  },
  {
    code: '524126',
    title: 'Direct Property & Casualty Insurance',
    category: 'Professional Services',
    keywords: ['property insurance', 'casualty insurance', 'home insurance', 'auto insurance', 'business insurance'],
    has_full_profile: true,
    popularity: 9
  },
  {
    code: '524210',
    title: 'Insurance Agencies and Brokerages',
    category: 'Professional Services',
    keywords: ['insurance agency', 'insurance broker', 'independent agent', 'insurance sales'],
    has_full_profile: true,
    popularity: 10
  },
  {
    code: '524298',
    title: 'Insurance Related Activities',
    category: 'Professional Services',
    keywords: ['insurance claims', 'insurance adjusting', 'insurance consulting', 'risk management'],
    has_full_profile: true,
    popularity: 7
  }
];

async function addInsuranceNaics() {
  console.log('\n=== Adding Insurance NAICS Codes ===\n');

  for (const naics of insuranceNaics) {
    console.log(`Adding ${naics.code}: ${naics.title}...`);

    const { data, error } = await supabase
      .from('naics_codes')
      .upsert(naics, {
        onConflict: 'code'
      })
      .select();

    if (error) {
      console.error(`  ❌ Error:`, error.message);
    } else {
      console.log(`  ✅ Success`);
    }
  }

  // Verify
  console.log('\n=== Verification ===\n');
  const { data, error } = await supabase
    .from('naics_codes')
    .select('code, title, has_full_profile')
    .in('code', insuranceNaics.map(n => n.code));

  if (error) {
    console.error('Verification error:', error);
  } else {
    console.table(data);
  }
}

addInsuranceNaics();
