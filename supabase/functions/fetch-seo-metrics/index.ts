import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const SEMRUSH_API_KEY = Deno.env.get('SEMRUSH_API_KEY') || Deno.env.get('VITE_SEMRUSH_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { domain, type } = await req.json()

    if (!SEMRUSH_API_KEY) {
      throw new Error('SEMrush API key not configured in Edge Function environment')
    }

    if (!domain) {
      throw new Error('Domain is required')
    }

    let url: string

    if (type === 'overview') {
      // Domain overview endpoint
      url = `https://api.semrush.com/?type=domain_ranks&key=${SEMRUSH_API_KEY}&export_columns=Ot,Or,Ad,At&domain=${domain}&database=us`
    } else if (type === 'keywords') {
      // Organic keywords endpoint
      url = `https://api.semrush.com/?type=domain_organic&key=${SEMRUSH_API_KEY}&export_columns=Ph,Po,Nq,Tr,Ur&domain=${domain}&database=us&display_limit=100`
    } else {
      throw new Error('Invalid type. Use "overview" or "keywords"')
    }

    console.log('[SEMrush Edge] Fetching:', url.replace(SEMRUSH_API_KEY, 'REDACTED'))

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`SEMrush API error: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    // Parse CSV to JSON
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(';')

    const data = lines.slice(1).map(line => {
      const values = line.split(';')
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      return row
    })

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('[SEMrush Edge] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
