// PRD Feature: SYNAPSE-V6
/**
 * Google Places Edge Function
 *
 * Fetches local business data from Google Places API.
 * Used for local_timing tab insights.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlacesRequest {
  query: string;
  type?: string;
  location?: string;
  radius?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, type = "establishment", location, radius = 50000 }: PlacesRequest = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      // Return mock data if no API key configured
      console.warn("[fetch-google-places] No GOOGLE_PLACES_API_KEY configured, returning mock data");
      return new Response(
        JSON.stringify({
          places: [
            {
              id: "mock-place-1",
              name: `${query} Business`,
              address: "123 Main St",
              rating: 4.5,
              reviews: 100,
              types: [type],
              source: "google-places-mock",
            },
          ],
          total: 1,
          mock: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Google Places Text Search API
    const params = new URLSearchParams({
      query,
      type,
      key: apiKey,
    });

    if (location) {
      params.append("location", location);
      params.append("radius", String(radius));
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
      {
        headers: { "Accept": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    // Transform to normalized format
    const places = data.results?.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      reviews: place.user_ratings_total,
      types: place.types,
      location: place.geometry?.location,
      business_status: place.business_status,
      source: "google-places",
    })) || [];

    return new Response(
      JSON.stringify({ places, total: places.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[fetch-google-places] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
