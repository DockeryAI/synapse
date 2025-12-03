// PRD Feature: GOVERNANCE-COMPLIANCE
/**
 * Brand Management Edge Function
 *
 * Handles brand CRUD operations - replaces direct Supabase calls in frontend
 * Required by governance rule: no_direct_api_calls: true
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface BrandUpdate {
  name?: string;
  logo_url?: string | null;
  website_url?: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: user, error: userError } = await supabase.auth.getUser(jwt)

    if (userError || !user.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const brandId = url.pathname.split('/').pop()

    switch (method) {
      case 'GET':
        // Get brand(s)
        if (brandId && brandId !== 'brands') {
          // Get specific brand
          const { data, error } = await supabase
            .from('brands')
            .select('*')
            .eq('id', brandId)
            .eq('user_id', user.user.id)
            .single()

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Get all brands for user
          const { data, error } = await supabase
            .from('brands')
            .select('*')
            .eq('user_id', user.user.id)

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
        }

      case 'PUT':
        // Update brand
        if (!brandId || brandId === 'brands') {
          return new Response(
            JSON.stringify({ error: 'Brand ID required for update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const updateData: BrandUpdate = await req.json()

        // Validate ownership
        const { data: existingBrand, error: checkError } = await supabase
          .from('brands')
          .select('id')
          .eq('id', brandId)
          .eq('user_id', user.user.id)
          .single()

        if (checkError || !existingBrand) {
          return new Response(
            JSON.stringify({ error: 'Brand not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update brand
        const { data, error } = await supabase
          .from('brands')
          .update(updateData)
          .eq('id', brandId)
          .eq('user_id', user.user.id)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'POST':
        // Create brand
        const createData = await req.json()

        const { data, error } = await supabase
          .from('brands')
          .insert({
            ...createData,
            user_id: user.user.id
          })
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'DELETE':
        // Delete brand
        if (!brandId || brandId === 'brands') {
          return new Response(
            JSON.stringify({ error: 'Brand ID required for deletion' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: deleteError } = await supabase
          .from('brands')
          .delete()
          .eq('id', brandId)
          .eq('user_id', user.user.id)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Brand operation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})