/**
 * Apply RLS migration manually using Supabase client
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSMigration() {
  console.log('[RLS Migration] Starting...');

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251120064500_enable_rls_with_policies.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('[RLS Migration] Executing SQL...');

  try {
    // Execute the SQL using the rpc endpoint
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({
      data: null,
      error: { message: 'exec_sql function not available - will execute statements individually' }
    }));

    if (error) {
      console.log('[RLS Migration] exec_sql not available, executing statements individually...');

      // Split SQL into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toUpperCase().includes('NOTIFY')) {
          console.log('[RLS Migration] Skipping NOTIFY statement');
          continue;
        }

        console.log(`[RLS Migration] Executing: ${statement.substring(0, 50)}...`);

        // Use the raw SQL execution
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: statement })
        });

        if (!result.ok) {
          const errorText = await result.text();
          console.error(`[RLS Migration] Error executing statement: ${errorText}`);
        } else {
          console.log(`[RLS Migration] ✓ Statement executed`);
        }
      }
    } else {
      console.log('[RLS Migration] ✓ Migration applied successfully');
    }
  } catch (error) {
    console.error('[RLS Migration] Error:', error);
    process.exit(1);
  }

  console.log('[RLS Migration] Complete!');
}

applyRLSMigration();
