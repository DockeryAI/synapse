// PRD Feature: SYNAPSE-V6
/**
 * Meta Ads Library Edge Function
 *
 * Fetches ads from Meta Ad Library API for competitive intelligence.
 * Requires Meta Ad Library Access Token.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetaAdsRequest {
  search_terms: string;
  ad_type?: string;
  limit?: number;
  country?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { search_terms, ad_type = "ALL", limit = 20, country = "US" }: MetaAdsRequest = await req.json();

    if (!search_terms) {
      return new Response(
        JSON.stringify({ error: "search_terms parameter required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = Deno.env.get("META_AD_LIBRARY_TOKEN");
    if (!accessToken) {
      // Return mock data if no token configured
      console.warn("[fetch-meta-ads] No META_AD_LIBRARY_TOKEN configured, returning mock data");
      return new Response(
        JSON.stringify({
          ads: [
            {
              id: "mock-1",
              page_name: "Example Advertiser",
              ad_creative_body: `Ad about ${search_terms}`,
              ad_snapshot_url: "",
              spend: { lower_bound: "100", upper_bound: "500" },
              impressions: { lower_bound: "10000", upper_bound: "50000" },
              source: "meta-ads-mock",
            },
          ],
          total: 1,
          mock: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Meta Ad Library API
    const params = new URLSearchParams({
      search_terms,
      ad_type,
      ad_reached_countries: country,
      limit: String(limit),
      access_token: accessToken,
      fields: "id,page_name,ad_creative_bodies,ad_snapshot_url,spend,impressions",
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/ads_archive?${params}`,
      {
        headers: { "Accept": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to normalized format
    const ads = data.data?.map((ad: any) => ({
      id: ad.id,
      page_name: ad.page_name,
      ad_creative_body: ad.ad_creative_bodies?.[0] || "",
      ad_snapshot_url: ad.ad_snapshot_url,
      spend: ad.spend,
      impressions: ad.impressions,
      source: "meta-ads",
    })) || [];

    return new Response(
      JSON.stringify({ ads, total: ads.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[fetch-meta-ads] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
