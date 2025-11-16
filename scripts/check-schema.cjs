#!/usr/bin/env node

/**
 * Check what columns actually exist in industry_profiles table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n🔍 Checking industry_profiles table schema...\n');

  try {
    // Try to get any row to see the schema
    const { data, error } = await supabase
      .from('industry_profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying table:', error.message);
      console.error('   Code:', error.code);

      if (error.code === '42P01') {
        console.error('\n   ⚠️  TABLE DOES NOT EXIST!');
        console.error('   You need to run the migration: 000_industry_database.sql\n');
      }
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  Table exists but is empty');
      console.log('   Cannot determine schema from empty table\n');
      console.log('   Try inserting a minimal row to see what columns are required\n');
      return;
    }

    const columns = Object.keys(data[0]);
    console.log(`✅ Found ${columns.length} columns in industry_profiles:\n`);
    columns.sort().forEach(col => {
      console.log(`   - ${col}`);
    });
    console.log('');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkSchema();
