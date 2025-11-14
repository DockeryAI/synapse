/**
 * Edge Function: Scrape Website Content
 * Simple HTML scraping server-side to avoid CORS restrictions
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { url } = await req.json() as ScrapeRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[scrape-website] Scraping: ${url}`);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MARBA/1.0; +https://marba.ai)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse HTML with DOMParser
    const document = new DOMParser().parseFromString(html, 'text/html');

    if (!document) {
      throw new Error('Failed to parse HTML');
    }

    // Extract title
    const title = document.querySelector('title')?.textContent || '';

    // Extract meta description
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const description = descriptionMeta?.getAttribute('content') || '';

    // Extract headings
    const headings: string[] = [];
    document.querySelectorAll('h1, h2, h3').forEach(heading => {
      const text = heading.textContent?.trim();
      if (text && text.length > 0) {
        headings.push(text);
      }
    });

    // Extract navigation and location-specific elements
    const navigationText: string[] = [];

    // Extract select/option elements (common for location dropdowns)
    document.querySelectorAll('select option').forEach(option => {
      const text = option.textContent?.trim();
      if (text && text.length > 0 && text !== 'Select' && text !== 'Choose') {
        navigationText.push(text);
      }
    });

    // Extract nav links
    document.querySelectorAll('nav a, header a').forEach(link => {
      const text = link.textContent?.trim();
      if (text && text.length > 0 && text.length < 100) {
        navigationText.push(text);
      }
    });

    // Extract footer content (often contains addresses)
    const footerText: string[] = [];
    document.querySelectorAll('footer p, footer address, footer div').forEach(elem => {
      const text = elem.textContent?.trim();
      if (text && text.length > 10 && text.length < 300) {
        footerText.push(text);
      }
    });

    // Extract address elements
    const addresses: string[] = [];
    document.querySelectorAll('address').forEach(addr => {
      const text = addr.textContent?.trim();
      if (text && text.length > 0) {
        addresses.push(text);
      }
    });

    // Extract JSON-LD structured data and script tags with data
    const structuredData: string[] = [];
    document.querySelectorAll('script[type="application/ld+json"], script[type="application/json"]').forEach(script => {
      const content = script.textContent?.trim();
      if (content && content.length > 0) {
        structuredData.push(content);
      }
    });

    // Extract all script tags that might contain location data (Next.js, React initial props, etc.)
    document.querySelectorAll('script:not([src])').forEach(script => {
      const content = script.textContent?.trim();
      if (content && (
        content.includes('location') ||
        content.includes('address') ||
        content.includes('city') ||
        content.includes('state') ||
        content.includes('coordinates')
      )) {
        // Only include if it looks like data (has JSON-like structure)
        if (content.includes('{') && content.includes('}')) {
          structuredData.push(content.substring(0, 2000)); // Limit each script
        }
      }
    });

    // Extract paragraphs and main content
    const paragraphs: string[] = [];
    document.querySelectorAll('p').forEach(p => {
      const text = p.textContent?.trim();
      if (text && text.length > 50) { // Only substantial paragraphs
        paragraphs.push(text);
      }
    });

    // Combine all text
    const text = paragraphs.join('\n\n');
    const navigation = navigationText.join(', ');
    const footer = footerText.join('\n');
    const addressList = addresses.join('\n---\n');
    const structured = structuredData.join('\n---\n');

    const responseTime = Date.now() - startTime;

    console.log(`[scrape-website] Scraping complete in ${responseTime}ms`);
    console.log(`[scrape-website] Extracted ${text?.length || 0} characters`);

    return new Response(
      JSON.stringify({
        success: true,
        content: {
          title,
          description,
          text,
          headings,
          navigation,      // Location dropdowns and nav links
          footer,          // Footer content with addresses
          addresses: addressList,  // Structured address elements
          structuredData: structured,  // JSON-LD and script tag data
        },
        metadata: {
          url,
          responseTimeMs: responseTime,
          textLength: text?.length || 0,
          navigationLength: navigation?.length || 0,
          footerLength: footer?.length || 0,
          structuredDataLength: structured?.length || 0,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[scrape-website] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
