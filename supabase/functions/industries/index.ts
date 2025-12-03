// PRD Feature: GOVERNANCE-COMPLIANCE
/**
 * Industry Data Edge Function
 *
 * Provides industry lookup data - replaces direct database reads in frontend
 * Required by governance rule: no_direct_api_calls: true
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()

    switch (req.method) {
      case 'GET':
        if (endpoint === 'naics') {
          // Get NAICS codes
          const { data, error } = await supabase
            .from('naics_codes')
            .select('code, title, keywords, category, has_full_profile, popularity')

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify(data || []),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } else if (endpoint === 'profiles') {
          // Get industry profiles
          const { data, error } = await supabase
            .from('industry_profiles')
            .select('id, name')

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify(data || []),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } else {
          // Get all industry data
          const [naicsResult, profilesResult] = await Promise.all([
            supabase
              .from('naics_codes')
              .select('code, title, keywords, category, has_full_profile, popularity'),
            supabase
              .from('industry_profiles')
              .select('id, name')
          ])

          const result = {
            naics: naicsResult.data || [],
            profiles: profilesResult.data || [],
            errors: {
              naics: naicsResult.error?.message,
              profiles: profilesResult.error?.message,
            }
          }

          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Industry data error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})