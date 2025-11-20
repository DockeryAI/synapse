import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jpwljchikgmggjidogon.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix directly via SQL...\n');

  const sql = readFileSync('./supabase/migrations/20251120000004_fix_industry_profiles_rls_properly.sql', 'utf-8');

  console.log('Executing SQL:');
  console.log('-'.repeat(50));
  console.log(sql);
  console.log('-'.repeat(50));
  console.log('\n');

  // Execute via rpc if available, otherwise need service role
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ data: null, error: { message: 'RPC not available, need service role key' } }));

  if (error) {
    console.error('❌ Failed to apply via RPC:', error.message);
    console.log('\n⚠️  You need to apply this migration manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Paste the SQL above');
    console.log('3. Run it');
    return false;
  }

  console.log('✅ RLS policies applied successfully');
  return true;
}

applyRLSFix()
  .then(success => {
    if (success) {
      console.log('\n🧪 Testing save now...\n');
      // Import and run test
      import('./test-profile-save.js').catch(() => {
        console.log('Run: npx tsx scripts/test-profile-save.ts');
      });
    }
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
