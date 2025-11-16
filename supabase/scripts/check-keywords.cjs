#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('\n🔍 Checking NAICS 621330 keywords...\n');

  const { data, error } = await supabase
    .from('naics_codes')
    .select('code, title, keywords')
    .eq('code', '621330')
    .single();

  if (error) {
    console.log('❌ ERROR:', error.message);
    return;
  }

  if (!data) {
    console.log('❌ NAICS 621330 NOT FOUND in naics_codes table');
    return;
  }

  console.log('✅ Found NAICS 621330:');
  console.log(`   Title: ${data.title}`);
  console.log(`   Keywords: ${JSON.stringify(data.keywords)}`);
  console.log(`   Keyword count: ${data.keywords?.length || 0}`);

  // Test matching
  const searchTerm = 'school psy';
  const matches = data.keywords?.some(kw =>
    searchTerm.toLowerCase().includes(kw.toLowerCase()) ||
    kw.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log(`\n🧪 Does "${searchTerm}" match any keywords? ${matches ? '✅ YES' : '❌ NO'}`);

  if (matches) {
    const matchingKeywords = data.keywords.filter(kw =>
      searchTerm.toLowerCase().includes(kw.toLowerCase()) ||
      kw.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log(`   Matching keywords: ${JSON.stringify(matchingKeywords)}`);
  }
}

check();
