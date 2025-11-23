import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkNaicsTable() {
  console.log('\n=== Checking naics_codes Table ===\n');

  // Count total rows
  const { count, error: countError } = await supabase
    .from('naics_codes')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting naics_codes:', countError);
  } else {
    console.log(`Total rows in naics_codes: ${count}`);
  }

  // Get sample rows
  const { data, error } = await supabase
    .from('naics_codes')
    .select('code, title, has_full_profile, category')
    .limit(10);

  if (error) {
    console.error('\nError loading naics_codes sample:', error);
  } else {
    console.log('\nSample NAICS Codes:');
    console.table(data);
  }

  // Check for specific insurance codes
  const insuranceCodes = ['5241', '524126', '524210', '524298'];
  for (const code of insuranceCodes) {
    const { data: codeData, error: codeError } = await supabase
      .from('naics_codes')
      .select('code, title, has_full_profile')
      .eq('code', code)
      .single();

    console.log(`\nCode ${code}:`, codeData || `Not found (${codeError?.message})`);
  }
}

checkNaicsTable();
