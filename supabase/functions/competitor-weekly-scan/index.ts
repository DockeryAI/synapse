/**
 * Competitor Weekly Scan Edge Function
 *
 * Phase 5 - Gap Tab 2.0
 * Scheduled job to re-scan active competitors and detect changes.
 * Triggered weekly via Supabase cron or external scheduler.
 *
 * Features:
 * - Finds all active competitor profiles with stale scans
 * - Re-scans competitors in batches (max 5 concurrent)
 * - Compares new scan to previous and creates alerts
 * - Cleans up old alerts (>30 days, read)
 *
 * Schedule: Weekly (Sunday 2am UTC recommended)
 * To set up cron: supabase functions deploy competitor-weekly-scan
 * Then in Supabase dashboard: Enable pg_cron extension and add:
 * SELECT cron.schedule('weekly-competitor-scan', '0 2 * * 0', $$
 *   SELECT net.http_post(
 *     url := '<SUPABASE_URL>/functions/v1/competitor-weekly-scan',
 *     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
 *   )
 * $$);
 *
 * Created: 2025-11-28
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Types
interface CompetitorProfile {
  id: string;
  brand_id: string;
  name: string;
  website: string | null;
  segment_type: string | null;
  business_type: string | null;
}

interface ScanResult {
  competitor_id: string;
  scan_type: string;
  scanned_at: string;
  data_quality_score: number;
  extracted_weaknesses: string[];
  scan_data: Record<string, unknown>;
}

interface AlertData {
  brand_id: string;
  competitor_id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: string;
  evidence: Record<string, unknown>;
}

// Configuration
const BATCH_SIZE = 5; // Max concurrent scans
const STALE_THRESHOLD_DAYS = 7; // Consider scans stale after 7 days
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Create Supabase client with service role
 */
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get competitors with stale scans
 */
async function getStaleCompetitors(supabase: ReturnType<typeof createClient>): Promise<CompetitorProfile[]> {
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - STALE_THRESHOLD_DAYS);

  // Get active competitors
  const { data: competitors, error: compError } = await supabase
    .from('competitor_profiles')
    .select('id, brand_id, name, website, segment_type, business_type')
    .eq('is_active', true);

  if (compError) {
    console.error('[WeeklyScan] Failed to get competitors:', compError);
    return [];
  }

  // Filter to those with stale or no scans
  const competitorIds = competitors?.map(c => c.id) || [];
  if (competitorIds.length === 0) return [];

  // Get most recent scan per competitor
  const { data: scans, error: scanError } = await supabase
    .from('competitor_scans')
    .select('competitor_id, scanned_at')
    .in('competitor_id', competitorIds)
    .order('scanned_at', { ascending: false });

  if (scanError) {
    console.error('[WeeklyScan] Failed to get scans:', scanError);
    return competitors || [];
  }

  // Build map of most recent scan per competitor
  const lastScanMap = new Map<string, Date>();
  for (const scan of scans || []) {
    if (!lastScanMap.has(scan.competitor_id)) {
      lastScanMap.set(scan.competitor_id, new Date(scan.scanned_at));
    }
  }

  // Filter to stale competitors
  return (competitors || []).filter(comp => {
    const lastScan = lastScanMap.get(comp.id);
    return !lastScan || lastScan < staleDate;
  });
}

/**
 * Scan a competitor using Perplexity
 */
async function scanCompetitor(competitor: CompetitorProfile): Promise<ScanResult | null> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityKey) {
    console.error('[WeeklyScan] PERPLEXITY_API_KEY not configured');
    return null;
  }

  const prompt = `Research "${competitor.name}" (${competitor.website || 'no website'}) and provide:
1. Recent customer complaints or negative reviews (last 30 days if possible)
2. Any new product announcements or feature launches
3. Pricing changes or new offerings
4. Notable news or press mentions

Focus on actionable competitive intelligence. Provide specific quotes where available.

Respond in JSON format:
{
  "complaints": ["complaint 1", "complaint 2"],
  "new_features": ["feature 1"],
  "pricing_changes": [],
  "news": ["news item"],
  "overall_sentiment": "positive|neutral|negative",
  "data_quality": 0.0-1.0
}`;

  try {
    const response = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[WeeklyScan] Perplexity error for ${competitor.name}:`, error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[WeeklyScan] Failed to parse response for ${competitor.name}`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      competitor_id: competitor.id,
      scan_type: 'perplexity-research',
      scanned_at: new Date().toISOString(),
      data_quality_score: parsed.data_quality || 0.5,
      extracted_weaknesses: parsed.complaints || [],
      scan_data: {
        complaints: parsed.complaints || [],
        new_features: parsed.new_features || [],
        pricing_changes: parsed.pricing_changes || [],
        news: parsed.news || [],
        overall_sentiment: parsed.overall_sentiment || 'neutral'
      }
    };
  } catch (error) {
    console.error(`[WeeklyScan] Scan error for ${competitor.name}:`, error);
    return null;
  }
}

/**
 * Compare scans and detect changes
 */
async function detectChanges(
  supabase: ReturnType<typeof createClient>,
  competitor: CompetitorProfile,
  newScan: ScanResult
): Promise<AlertData[]> {
  const alerts: AlertData[] = [];

  // Get previous scan
  const { data: prevScans } = await supabase
    .from('competitor_scans')
    .select('*')
    .eq('competitor_id', competitor.id)
    .eq('scan_type', 'perplexity-research')
    .order('scanned_at', { ascending: false })
    .limit(1);

  const prevScan = prevScans?.[0];
  const prevData = (prevScan?.scan_data || {}) as Record<string, unknown>;
  const newData = newScan.scan_data;

  // Check for new complaints
  const prevComplaints = new Set((prevData.complaints || []) as string[]);
  const newComplaints = ((newData.complaints || []) as string[]).filter(
    c => !prevComplaints.has(c)
  );

  if (newComplaints.length > 0) {
    alerts.push({
      brand_id: competitor.brand_id,
      competitor_id: competitor.id,
      alert_type: 'new-complaint',
      title: `${newComplaints.length} new complaint${newComplaints.length > 1 ? 's' : ''} about ${competitor.name}`,
      description: newComplaints.slice(0, 2).join('; '),
      severity: newComplaints.length >= 3 ? 'high' : 'medium',
      evidence: {
        quotes: newComplaints.map(c => ({ quote: c, source: 'perplexity-research' })),
        previous_count: prevComplaints.size,
        new_count: (newData.complaints as string[])?.length || 0
      }
    });
  }

  // Check for new features (competitor advantage)
  const prevFeatures = new Set((prevData.new_features || []) as string[]);
  const newFeatures = ((newData.new_features || []) as string[]).filter(
    f => !prevFeatures.has(f)
  );

  if (newFeatures.length > 0) {
    alerts.push({
      brand_id: competitor.brand_id,
      competitor_id: competitor.id,
      alert_type: 'new-feature',
      title: `${competitor.name} announced new feature${newFeatures.length > 1 ? 's' : ''}`,
      description: newFeatures.slice(0, 2).join('; '),
      severity: 'medium',
      evidence: {
        features: newFeatures
      }
    });
  }

  // Check for news mentions
  const prevNews = new Set((prevData.news || []) as string[]);
  const newNews = ((newData.news || []) as string[]).filter(
    n => !prevNews.has(n)
  );

  if (newNews.length > 0) {
    alerts.push({
      brand_id: competitor.brand_id,
      competitor_id: competitor.id,
      alert_type: 'news-mention',
      title: `${competitor.name} in the news`,
      description: newNews[0],
      severity: 'low',
      evidence: {
        news: newNews
      }
    });
  }

  return alerts;
}

/**
 * Save scan results to GLOBAL cache for cross-brand reuse
 */
async function saveToGlobalCache(
  supabase: ReturnType<typeof createClient>,
  competitor: CompetitorProfile,
  scan: ScanResult
): Promise<void> {
  if (!competitor.website) {
    console.log(`[WeeklyScan] No website for ${competitor.name}, skipping global cache`);
    return;
  }

  try {
    // Get or create global competitor entry
    const { data: globalId, error: globalError } = await supabase.rpc(
      'get_or_create_global_competitor',
      {
        p_name: competitor.name,
        p_website: competitor.website,
        p_industry: null
      }
    );

    if (globalError || !globalId) {
      console.warn(`[WeeklyScan] Failed to get global competitor for ${competitor.name}:`, globalError?.message);
      return;
    }

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Upsert to global cache
    const { error: cacheError } = await supabase
      .from('global_competitor_scans')
      .upsert({
        global_competitor_id: globalId,
        scan_type: scan.scan_type,
        scan_data: scan.scan_data,
        extracted_weaknesses: scan.extracted_weaknesses,
        data_quality_score: scan.data_quality_score,
        scanned_at: scan.scanned_at,
        expires_at: expiresAt.toISOString(),
        is_stale: false,
        scan_source: 'cron'
      }, {
        onConflict: 'global_competitor_id,scan_type'
      });

    if (cacheError) {
      console.warn(`[WeeklyScan] Failed to save to global cache for ${competitor.name}:`, cacheError.message);
    } else {
      console.log(`[WeeklyScan] Saved ${competitor.name} to global cache`);
    }
  } catch (err) {
    console.error(`[WeeklyScan] Global cache error for ${competitor.name}:`, err);
  }
}

/**
 * Save scan results and alerts
 */
async function saveScanResults(
  supabase: ReturnType<typeof createClient>,
  competitor: CompetitorProfile,
  scan: ScanResult,
  alerts: AlertData[]
): Promise<void> {
  // Calculate expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save scan to brand-specific table
  const { error: scanError } = await supabase
    .from('competitor_scans')
    .insert({
      competitor_id: scan.competitor_id,
      brand_id: competitor.brand_id,
      scan_type: scan.scan_type,
      scan_data: scan.scan_data,
      raw_response: scan.scan_data,
      extracted_weaknesses: scan.extracted_weaknesses,
      data_quality_score: scan.data_quality_score,
      scanned_at: scan.scanned_at,
      expires_at: expiresAt.toISOString(),
      is_stale: false
    });

  if (scanError) {
    console.error(`[WeeklyScan] Failed to save scan for ${competitor.name}:`, scanError);
  }

  // Also save to global cache for cross-brand reuse
  await saveToGlobalCache(supabase, competitor, scan);

  // Save alerts
  if (alerts.length > 0) {
    const alertRecords = alerts.map(a => ({
      ...a,
      is_read: false,
      is_dismissed: false,
      is_actioned: false,
      detected_at: new Date().toISOString()
    }));

    const { error: alertError } = await supabase
      .from('competitor_alerts')
      .insert(alertRecords);

    if (alertError) {
      console.error(`[WeeklyScan] Failed to save alerts for ${competitor.name}:`, alertError);
    } else {
      console.log(`[WeeklyScan] Created ${alerts.length} alerts for ${competitor.name}`);
    }
  }
}

/**
 * Clean up old alerts
 */
async function cleanupOldAlerts(supabase: ReturnType<typeof createClient>): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('competitor_alerts')
    .delete()
    .eq('is_read', true)
    .lt('detected_at', thirtyDaysAgo.toISOString())
    .select('id');

  if (error) {
    console.error('[WeeklyScan] Failed to cleanup old alerts:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Mark old scans as stale
 */
async function markStaleScans(supabase: ReturnType<typeof createClient>): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('competitor_scans')
    .update({ is_stale: true })
    .lt('expires_at', now)
    .eq('is_stale', false)
    .select('id');

  if (error) {
    console.error('[WeeklyScan] Failed to mark stale scans:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Process competitors in batches
 */
async function processCompetitors(
  supabase: ReturnType<typeof createClient>,
  competitors: CompetitorProfile[]
): Promise<{ scanned: number; alerts: number }> {
  let totalScanned = 0;
  let totalAlerts = 0;

  // Process in batches
  for (let i = 0; i < competitors.length; i += BATCH_SIZE) {
    const batch = competitors.slice(i, i + BATCH_SIZE);

    console.log(`[WeeklyScan] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(competitors.length / BATCH_SIZE)}`);

    const results = await Promise.allSettled(
      batch.map(async (competitor) => {
        const scan = await scanCompetitor(competitor);
        if (!scan) return { scanned: false, alerts: 0 };

        const alerts = await detectChanges(supabase, competitor, scan);
        await saveScanResults(supabase, competitor, scan, alerts);

        return { scanned: true, alerts: alerts.length };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.scanned) totalScanned++;
        totalAlerts += result.value.alerts;
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < competitors.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return { scanned: totalScanned, alerts: totalAlerts };
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('[WeeklyScan] Starting weekly competitor scan job');

    const supabase = getSupabaseClient();

    // Step 1: Mark stale scans
    const staleCount = await markStaleScans(supabase);
    console.log(`[WeeklyScan] Marked ${staleCount} scans as stale`);

    // Step 2: Get competitors needing refresh
    const staleCompetitors = await getStaleCompetitors(supabase);
    console.log(`[WeeklyScan] Found ${staleCompetitors.length} competitors to scan`);

    // Step 3: Process competitors
    const { scanned, alerts } = await processCompetitors(supabase, staleCompetitors);

    // Step 4: Cleanup old alerts
    const cleanedUp = await cleanupOldAlerts(supabase);
    console.log(`[WeeklyScan] Cleaned up ${cleanedUp} old alerts`);

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      duration_ms: duration,
      competitors_found: staleCompetitors.length,
      competitors_scanned: scanned,
      alerts_created: alerts,
      alerts_cleaned_up: cleanedUp,
      scans_marked_stale: staleCount
    };

    console.log('[WeeklyScan] Job completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[WeeklyScan] Job failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
