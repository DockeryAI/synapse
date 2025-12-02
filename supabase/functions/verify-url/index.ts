/**
 * URL Verification Edge Function - Triggers 4.0
 *
 * Server-side URL verification to bypass CORS restrictions.
 * Makes HEAD requests to verify URLs are accessible.
 *
 * Response codes:
 * - 200/301/302 -> verified
 * - 404/500/timeout -> unverified
 * - Domain mismatch -> invalid
 *
 * Created: 2025-12-01
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory cache for verification results (15 min TTL)
const verificationCache = new Map<string, { status: string; timestamp: number }>()
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

// Platform domain mappings for validation
const PLATFORM_DOMAINS: Record<string, string[]> = {
  reddit: ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'np.reddit.com'],
  twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com', 'mobile.twitter.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
  hackernews: ['news.ycombinator.com'],
  g2: ['g2.com', 'www.g2.com'],
  trustpilot: ['trustpilot.com', 'www.trustpilot.com'],
  capterra: ['capterra.com', 'www.capterra.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  quora: ['quora.com', 'www.quora.com'],
  producthunt: ['producthunt.com', 'www.producthunt.com'],
  google_reviews: ['google.com', 'www.google.com', 'maps.google.com'],
  yelp: ['yelp.com', 'www.yelp.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  clutch: ['clutch.co', 'www.clutch.co'],
  gartner: ['gartner.com', 'www.gartner.com'],
}

interface VerifyRequest {
  url: string
  platform?: string
}

interface VerifyResponse {
  url: string
  status: 'verified' | 'unverified' | 'invalid' | 'timeout'
  httpCode?: number
  error?: string
  cached: boolean
}

function validatePlatformDomain(url: string, platform?: string): boolean {
  if (!platform || platform === 'unknown') return true

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const validDomains = PLATFORM_DOMAINS[platform]

    if (!validDomains) return true // Unknown platform, allow

    return validDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

function getCachedResult(url: string): VerifyResponse | null {
  const cached = verificationCache.get(url)
  if (!cached) return null

  const age = Date.now() - cached.timestamp
  if (age > CACHE_TTL_MS) {
    verificationCache.delete(url)
    return null
  }

  return {
    url,
    status: cached.status as VerifyResponse['status'],
    cached: true,
  }
}

function setCachedResult(url: string, status: string): void {
  // Limit cache size to prevent memory issues
  if (verificationCache.size > 1000) {
    // Remove oldest entries
    const entries = Array.from(verificationCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    for (let i = 0; i < 100; i++) {
      verificationCache.delete(entries[i][0])
    }
  }

  verificationCache.set(url, { status, timestamp: Date.now() })
}

async function verifyUrl(url: string, platform?: string): Promise<VerifyResponse> {
  // Check cache first
  const cached = getCachedResult(url)
  if (cached) return cached

  // Validate URL format
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    return { url, status: 'invalid', error: 'Invalid URL format', cached: false }
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return { url, status: 'invalid', error: 'Only HTTP/HTTPS URLs allowed', cached: false }
  }

  // Validate platform-domain match
  if (!validatePlatformDomain(url, platform)) {
    return { url, status: 'invalid', error: 'Domain does not match platform', cached: false }
  }

  // Perform HEAD request with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SynapseBot/1.0; +https://synapse.app)',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    const httpCode = response.status
    let status: VerifyResponse['status']

    if (httpCode >= 200 && httpCode < 400) {
      status = 'verified'
    } else if (httpCode === 404 || httpCode >= 500) {
      status = 'unverified'
    } else {
      status = 'unverified'
    }

    setCachedResult(url, status)

    return { url, status, httpCode, cached: false }
  } catch (error) {
    clearTimeout(timeoutId)

    const isTimeout = error instanceof Error && error.name === 'AbortError'
    const status = isTimeout ? 'timeout' : 'unverified'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    setCachedResult(url, status)

    return { url, status, error: errorMessage, cached: false }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()

    // Support single URL or batch verification
    if (Array.isArray(body.urls)) {
      // Batch verification
      const requests = body.urls as VerifyRequest[]
      const results = await Promise.all(
        requests.map(r => verifyUrl(r.url, r.platform))
      )

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (body.url) {
      // Single URL verification
      const result = await verifyUrl(body.url, body.platform)

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing url or urls in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
