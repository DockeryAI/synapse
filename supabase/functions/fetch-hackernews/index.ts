// PRD Feature: SYNAPSE-V6
/**
 * Hacker News Edge Function
 *
 * Fetches stories and discussions from Hacker News Algolia API.
 * Used for community tab insights.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HNRequest {
  query: string;
  tags?: string;
  hitsPerPage?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, tags = "story", hitsPerPage = 20 }: HNRequest = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hacker News Algolia API
    const params = new URLSearchParams({
      query,
      tags,
      hitsPerPage: String(hitsPerPage),
    });

    const response = await fetch(
      `https://hn.algolia.com/api/v1/search?${params}`,
      {
        headers: { "Accept": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`HN API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to normalized format
    const posts = data.hits?.map((hit: any) => ({
      id: hit.objectID,
      title: hit.title || hit.story_title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author,
      points: hit.points,
      comments: hit.num_comments,
      created: hit.created_at,
      source: "hackernews",
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        data: posts,
        source: 'hackernews',
        metadata: { total: data.nbHits, query }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[fetch-hackernews] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        source: 'hackernews'
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
