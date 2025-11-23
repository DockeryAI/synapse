const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreTable() {
  console.log('🔄 Restoring industry_profiles table...');

  // First, drop the broken table if it exists
  const dropResult = await supabase.rpc('exec_sql', {
    query: 'DROP TABLE IF EXISTS industry_profiles CASCADE;'
  }).catch(e => console.log('Drop table (may not exist):', e.message));

  // Create the table with proper structure
  const createTableSQL = `
    CREATE TABLE industry_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      naics_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      level INTEGER NOT NULL,
      parent_code TEXT,
      is_standard BOOLEAN DEFAULT true,
      keywords TEXT[],
      has_full_profile BOOLEAN DEFAULT false,

      -- Full profile data
      industry_overview TEXT,
      market_size TEXT,
      growth_rate TEXT,
      key_trends TEXT[],
      customer_segments TEXT[],
      pain_points TEXT[],
      common_objections TEXT[],
      success_metrics TEXT[],
      regulatory_considerations TEXT[],
      seasonal_factors TEXT[],
      competitive_landscape TEXT,

      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    await supabase.rpc('exec_sql', { query: createTableSQL });
    console.log('✅ Table created successfully!');
  } catch (error) {
    // Table might exist, let's check
    console.log('Checking if table exists...');
    const { data, error: checkError } = await supabase
      .from('industry_profiles')
      .select('count')
      .limit(1);

    if (checkError) {
      console.error('❌ Failed to create or access table:', checkError.message);

      // Try direct SQL execution as fallback
      console.log('Trying direct SQL...');
      const { error: sqlError } = await supabase.rpc('query', {
        query_text: createTableSQL
      }).catch(async (e) => {
        // Final fallback - use raw SQL
        console.log('Using raw SQL connection...');
        const { data, error } = await supabase.rpc('raw_sql', {
          sql: createTableSQL
        });
        return { data, error };
      });

      if (sqlError) {
        console.error('❌ All methods failed:', sqlError);
      }
    } else {
      console.log('✅ Table exists!');
    }
  }

  // Create indexes
  const indexSQL = `
    CREATE INDEX IF NOT EXISTS idx_industry_profiles_naics ON industry_profiles(naics_code);
    CREATE INDEX IF NOT EXISTS idx_industry_profiles_full ON industry_profiles(has_full_profile) WHERE has_full_profile = true;
    CREATE INDEX IF NOT EXISTS idx_industry_profiles_level ON industry_profiles(level);
  `;

  try {
    await supabase.rpc('exec_sql', { query: indexSQL });
    console.log('✅ Indexes created!');
  } catch (e) {
    console.log('Indexes might already exist');
  }

  // Set RLS policies
  const rlsSQL = `
    ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view industry profiles" ON industry_profiles;
    CREATE POLICY "Anyone can view industry profiles"
      ON industry_profiles FOR SELECT
      TO public
      USING (true);

    GRANT ALL ON industry_profiles TO anon;
    GRANT ALL ON industry_profiles TO authenticated;
    GRANT ALL ON industry_profiles TO public;
  `;

  try {
    await supabase.rpc('exec_sql', { query: rlsSQL });
    console.log('✅ RLS policies set!');
  } catch (e) {
    console.log('RLS setup:', e.message);
  }

  // Check if table is accessible
  console.log('\n📊 Checking table status...');
  const { data, error, count } = await supabase
    .from('industry_profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Table check failed:', error);
  } else {
    console.log(`✅ Table is accessible! Current row count: ${count || 0}`);
    console.log('\n🎉 industry_profiles table has been restored!');
    console.log('📝 Next step: Import your 147 industry profile records');
  }
}

restoreTable().catch(console.error);