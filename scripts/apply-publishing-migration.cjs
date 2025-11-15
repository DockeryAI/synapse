#!/usr/bin/env node
/**
 * Apply Publishing Queue Migration
 * Runs the 20251114000001_socialpilot_tables.sql migration using service role key
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'present' : 'missing');
  process.exit(1);
}

console.log('🔑 Using service role key for admin access');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Split SQL into individual statements and execute them
async function executeSqlStatements(sql) {
  // Remove comments and split into statements
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`);

    try {
      // Use rpc to execute SQL if available
      const { error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        // If it's a "table already exists" error, skip it
        if (error.message && error.message.includes('already exists')) {
          console.log(`   ⏭️  Skipped (already exists)`);
          continue;
        }
        throw error;
      }
    } catch (err) {
      // If rpc doesn't work, log warning but continue
      console.log(`   ⚠️  Warning: ${err.message}`);
    }
  }
}

async function applyMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251114000001_socialpilot_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Applying migration to database...');

    // First, check if tables already exist
    console.log('🔍 Checking if tables exist...');

    const { data: queueData, error: queueError } = await supabase
      .from('publishing_queue')
      .select('id')
      .limit(1);

    const { data: connData, error: connError } = await supabase
      .from('socialpilot_connections')
      .select('id')
      .limit(1);

    if (!queueError && !connError) {
      console.log('✅ Tables already exist!');
      console.log('📋 Existing tables:');
      console.log('   ✓ socialpilot_connections');
      console.log('   ✓ publishing_queue');
      process.exit(0);
    }

    console.log('📄 Tables do not exist, creating them...');
    console.log('\n⚠️  Note: Service role key cannot execute raw SQL via client.');
    console.log('📝 You need to run this migration manually in Supabase SQL Editor:');
    console.log('');
    console.log('1. Open: https://supabase.com/dashboard/project/jpwljchikgmggjidogon/sql/new');
    console.log('2. Paste the contents of: supabase/migrations/20251114000001_socialpilot_tables.sql');
    console.log('3. Click "Run"');
    console.log('');
    console.log('Or copy this command to open the file:');
    console.log(`   cat ${migrationPath}`);
    console.log('');

    process.exit(1);

  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
    console.error('\n📝 Manual migration required:');
    console.error('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/jpwljchikgmggjidogon/sql/new');
    console.error('2. Go to SQL Editor');
    console.error('3. Run the contents of: supabase/migrations/20251114000001_socialpilot_tables.sql');
    process.exit(1);
  }
}

applyMigration();
