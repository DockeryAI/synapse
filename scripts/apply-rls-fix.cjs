const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix for industry_profiles table...\n');

  // Read the migration SQL
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251115210000_fix_rls_406_errors.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration SQL:');
  console.log(sql);
  console.log('\n---\n');

  try {
    // Execute the SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        console.log('⚠️  exec_sql function not available, trying alternative method...\n');

        // Try executing each statement separately
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--'));

        for (const statement of statements) {
          if (!statement) continue;

          console.log(`Executing: ${statement.substring(0, 60)}...`);

          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });

          if (stmtError) {
            console.error(`❌ Error executing statement:`, stmtError);
          } else {
            console.log('✅ Success');
          }
        }
      } else {
        console.error('❌ Error applying migration:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Migration applied successfully!');
      console.log('Response:', data);
    }

    // Verify the changes by trying to read from industry_profiles
    console.log('\n🔍 Verifying table access...\n');

    const { data: testData, error: testError } = await supabase
      .from('industry_profiles')
      .select('naics_code, title')
      .limit(5);

    if (testError) {
      console.error('❌ Still getting errors reading industry_profiles:', testError);
      console.log('\n⚠️  You may need to apply the RLS changes manually via Supabase Dashboard:');
      console.log('   1. Go to https://supabase.com/dashboard/project/jpwljchikgmggjidogon/database/tables');
      console.log('   2. Select the industry_profiles table');
      console.log('   3. Go to the RLS tab');
      console.log('   4. Disable RLS or add a policy allowing SELECT for anon role');
    } else {
      console.log('✅ Successfully verified table access!');
      console.log(`Found ${testData?.length || 0} industry profiles in database`);
      if (testData && testData.length > 0) {
        console.log('Sample profiles:', testData);
      }
    }

  } catch (err) {
    console.error('❌ Exception applying migration:', err);
    process.exit(1);
  }
}

applyRLSFix();
