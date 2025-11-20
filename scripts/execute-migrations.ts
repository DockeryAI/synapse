#!/usr/bin/env ts-node
/**
 * Execute all pending migrations using Supabase service role
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://jpwljchikgmggjidogon.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd2xqY2hpa2dtZ2dqaWRvZ29uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1NjU0MCwiZXhwIjoyMDc4NzMyNTQwfQ.r6t353lsTTXchueUfggEzfdJW0twlJGuxWuR0kyiQSE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function executeMigrations() {
  console.log('[Migrations] Starting...');

  // Read the combined migration SQL
  const sqlPath = path.join(__dirname, 'apply-all-migrations.sql');
  const fullSQL = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements
  const statements = fullSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`[Migrations] Executing ${statements.length} statements...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');

    console.log(`\n[${i + 1}/${statements.length}] ${preview}...`);

    try {
      // Execute using raw SQL via REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({ query: statement + ';' })
      });

      if (response.ok) {
        console.log('  ✓ Success');
        successCount++;
      } else {
        const error = await response.text();
        console.error(`  ✗ Error: ${error}`);
        errorCount++;
      }
    } catch (error: any) {
      console.error(`  ✗ Exception: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n[Migrations] Complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n[Migrations] Some statements failed - run this SQL manually in Supabase SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/jpwljchikgmggjidogon/sql/new`);
  }
}

executeMigrations().catch(console.error);
