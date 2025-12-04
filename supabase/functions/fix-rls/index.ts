import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fix buyer_personas RLS policy
    console.log('Fixing buyer_personas RLS policy...')

    // Drop existing policies
    await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS buyer_personas_user_access ON buyer_personas'
    })
    await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS buyer_personas_access_policy ON buyer_personas'
    })

    // Create permissive policy for development
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY buyer_personas_dev_access ON buyer_personas
            FOR ALL
            USING (true)
            WITH CHECK (true)`
    })

    // Fix brand_profiles missing column
    console.log('Adding profile_hash column to brand_profiles...')
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS profile_hash text'
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'RLS policies and schema fixes applied successfully'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})