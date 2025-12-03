#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📖 Reading migration SQL...');

  const migrationPath = join(__dirname, '../supabase/migrations/20251121160000_fix_uvp_sessions_for_onboarding.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  console.log('🔧 Applying migration statements...\n');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Filter out comments and empty statements
      if (!s) return false;
      if (s.startsWith('--')) return false;
      if (s.startsWith('/*') && s.endsWith('*/')) return false;
      return true;
    });

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 70).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      // Execute SQL directly via Supabase
      const { data, error } = await supabase.rpc('exec_sql', { query: statement });

      if (error) {
        const msg = error.message || error.toString();

        // These are safe to skip
        if (msg.includes('already exists') ||
            msg.includes('duplicate') ||
            msg.includes('does not exist') ||
            msg.includes('cannot drop') ||
            msg.includes('has no column')) {
          console.log(`   ⏭️  Skipped (${msg.substring(0, 50)})`);
          skipCount++;
        } else {
          console.log(`   ⚠️  Error: ${msg.substring(0, 100)}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Applied`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ⚠️  Exception: ${err.message.substring(0, 100)}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ ${successCount} applied`);
  console.log(`   ⏭️  ${skipCount} skipped`);
  console.log(`   ⚠️  ${errorCount} errors`);

  if (errorCount > statements.length / 2) {
    console.log('\n❌ Too many errors - migration may have failed');
    console.log('Trying manual approach...\n');
    return false;
  }

  console.log('\n✅ Migration complete!\n');
  return true;
}

applyMigration().then(success => {
  if (!success) process.exit(1);
});
