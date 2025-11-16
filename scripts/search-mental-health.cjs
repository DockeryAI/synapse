#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function search() {
  console.log('\n🔍 Searching for mental health/psychologist profiles...\n');

  const { data } = await supabase
    .from('industry_profiles')
    .select('naics_code, title, generated_on_demand');

  const matches = data?.filter(p =>
    p.title.toLowerCase().includes('mental') ||
    p.title.toLowerCase().includes('psychologist') ||
    p.title.toLowerCase().includes('psychol')
  );

  console.log(`Found ${matches?.length || 0} profiles:\n`);
  matches?.forEach(p => {
    console.log(`  ${p.naics_code}: ${p.title}`);
    console.log(`    On-demand: ${p.generated_on_demand}\n`);
  });

  // Check specifically for 621330
  const specific = data?.find(p => p.naics_code === '621330');
  if (specific) {
    console.log('✅ NAICS 621330 EXISTS:');
    console.log(`   ${specific.title}`);
    console.log(`   On-demand: ${specific.generated_on_demand}`);
  } else {
    console.log('❌ NAICS 621330 NOT FOUND');
  }
}

search();
