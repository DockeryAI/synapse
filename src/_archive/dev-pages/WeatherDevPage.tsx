/**
 * Weather Dev Page - Isolated Weather Tab Development
 *
 * Isolated development page for the Weather tab with:
 * - Dashboard layout matching the main dashboard
 * - Manual API trigger (no auto-load on refresh)
 * - Cache clear functionality
 * - UVP-informed weather opportunity detection
 * - Industry-specific content suggestions
 *
 * Based on research: Weather affects $3T of US business, with
 * weather-informed campaigns seeing 320% higher engagement.
 *
 * Created: 2025-11-29
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UVPBuildingBlocks } from '@/components/v4/V4PowerModePanel';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { WeatherAPI, type WeatherData, type ForecastDay, type WeatherOpportunity } from '@/services/intelligence/weather-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Sparkles,
  Trash2,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Thermometer,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  Zap,
  Target,
  BarChart3,
  RefreshCcw,
  Droplets,
  CloudSun,
  CloudSnow,
  Umbrella,
  Home,
  Flame
} from 'lucide-react';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

interface WeatherPipelineState {
  stage: 'idle' | 'fetching_current' | 'fetching_forecast' | 'detecting_opportunities' | 'complete' | 'error';
  progress: number;
  statusMessage: string;
  error?: string;
}

interface WeatherResult {
  current: WeatherData | null;
  forecast: ForecastDay[];
  opportunities: WeatherOpportunity[];
  location: string;
  fetchedAt: string;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const CACHE_KEY = 'weather_dev_result_v1';

function loadCachedResult(): WeatherResult | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('[WeatherDevPage] Loaded cached result');
      return parsed;
    }
  } catch (err) {
    console.warn('[WeatherDevPage] Failed to load cache:', err);
  }
  return null;
}

function saveCachedResult(result: WeatherResult): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    console.log('[WeatherDevPage] Saved to cache');
  } catch (err) {
    console.warn('[WeatherDevPage] Failed to save cache:', err);
  }
}

function clearWeatherCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    // Also clear the weather API internal cache
    const weatherCacheKeys = Object.keys(localStorage).filter(k => k.startsWith('weather_'));
    weatherCacheKeys.forEach(k => localStorage.removeItem(k));
    console.log('[WeatherDevPage] Cache cleared');
  } catch (err) {
    console.warn('[WeatherDevPage] Failed to clear cache:', err);
  }
}

// ============================================================================
// WEATHER CONDITION ICON MAPPING
// ============================================================================

function getWeatherIcon(condition: string): React.ElementType {
  const lower = condition.toLowerCase();
  if (lower.includes('snow') || lower.includes('blizzard')) return CloudSnow;
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return CloudRain;
  if (lower.includes('cloud') || lower.includes('overcast')) return Cloud;
  if (lower.includes('clear') || lower.includes('sunny')) return Sun;
  if (lower.includes('wind')) return Wind;
  if (lower.includes('fog') || lower.includes('mist')) return CloudSun;
  return Cloud;
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-300';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'low': return 'bg-green-100 text-green-700 border-green-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

function getOpportunityTypeIcon(type: string): React.ElementType {
  switch (type) {
    case 'heat_wave': return Flame;
    case 'cold_snap': return Snowflake;
    case 'storm': return CloudRain;
    case 'precipitation': return Umbrella;
    case 'seasonal': return Calendar;
    case 'forecast_alert': return AlertTriangle;
    case 'weather_window': return Sun;
    case 'deviation': return TrendingUp;
    default: return Cloud;
  }
}

function getEmotionalContextLabel(context?: string): { label: string; color: string } {
  switch (context) {
    case 'hopeful': return { label: 'Hopeful', color: 'bg-green-100 text-green-700' };
    case 'anxious': return { label: 'Anxious', color: 'bg-red-100 text-red-700' };
    case 'comfort-seeking': return { label: 'Comfort-Seeking', color: 'bg-blue-100 text-blue-700' };
    case 'energized': return { label: 'Energized', color: 'bg-yellow-100 text-yellow-700' };
    case 'protective': return { label: 'Protective', color: 'bg-purple-100 text-purple-700' };
    default: return { label: 'Neutral', color: 'bg-gray-100 text-gray-600' };
  }
}

// ============================================================================
// INDUSTRY-SPECIFIC CONTENT SUGGESTIONS
// ============================================================================

interface ContentSuggestion {
  headline: string;
  hook: string;
  platform: 'LinkedIn' | 'Facebook' | 'Instagram' | 'Twitter' | 'Email';
  contentType: 'urgency' | 'educational' | 'promotional' | 'community';
}

function generateContentSuggestions(
  opportunity: WeatherOpportunity,
  uvp: CompleteUVP | null,
  brandName: string = 'Your Business'
): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  const industry = uvp?.targetCustomer?.industry?.toLowerCase() || '';
  const businessName = brandName;

  // Generate suggestions based on opportunity type and industry
  if (opportunity.type === 'heat_wave') {
    suggestions.push({
      headline: `Stay Cool: ${opportunity.title}`,
      hook: `With temperatures hitting ${opportunity.description.match(/\d+/)?.[0] || 'extreme'}°F, your comfort is our priority.`,
      platform: 'Facebook',
      contentType: 'urgency'
    });

    if (industry.includes('hvac') || industry.includes('cooling')) {
      suggestions.push({
        headline: 'Emergency AC Service Available Today',
        hook: `Don't wait until it's unbearable. ${businessName} has same-day appointments available.`,
        platform: 'Instagram',
        contentType: 'promotional'
      });
    }
  }

  if (opportunity.type === 'cold_snap') {
    suggestions.push({
      headline: 'Protect Your Home from Freezing Temps',
      hook: `${opportunity.description} - Here's what you need to know.`,
      platform: 'Facebook',
      contentType: 'educational'
    });

    if (industry.includes('plumb') || industry.includes('heating') || industry.includes('hvac')) {
      suggestions.push({
        headline: '24/7 Emergency Heating Service',
        hook: `Pipes freeze, furnaces fail. ${businessName} is here when you need us most.`,
        platform: 'LinkedIn',
        contentType: 'urgency'
      });
    }
  }

  if (opportunity.type === 'precipitation') {
    suggestions.push({
      headline: `Weather Alert: ${opportunity.title}`,
      hook: `Preparing for weather changes shows you care about your customers.`,
      platform: 'Twitter',
      contentType: 'community'
    });

    if (industry.includes('roof') || industry.includes('gutter')) {
      suggestions.push({
        headline: 'Free Storm Damage Inspection',
        hook: `After the storm passes, ${businessName} is ready to help assess any damage.`,
        platform: 'Facebook',
        contentType: 'promotional'
      });
    }
  }

  // Always add a seasonal/general suggestion
  suggestions.push({
    headline: `Weather Update for Our ${uvp?.targetCustomer?.statement ? 'Valued' : 'Local'} Customers`,
    hook: `Staying connected with you through every season. Here's what we're seeing...`,
    platform: 'Email',
    contentType: 'community'
  });

  return suggestions;
}

// ============================================================================
// OPPORTUNITY CARD COMPONENT
// ============================================================================

interface OpportunityCardProps {
  opportunity: WeatherOpportunity;
  uvp: CompleteUVP | null;
  brandName: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  uvp,
  brandName,
  isExpanded,
  onToggleExpand
}) => {
  const TypeIcon = getOpportunityTypeIcon(opportunity.type);
  const urgencyColor = getUrgencyColor(opportunity.urgency);
  const contentSuggestions = useMemo(
    () => generateContentSuggestions(opportunity, uvp, brandName),
    [opportunity, uvp, brandName]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border-2 overflow-hidden transition-all ${
        isExpanded ? 'col-span-full' : ''
      } border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 hover:shadow-md`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${urgencyColor}`}>
              <TypeIcon className="w-3 h-3" />
              {opportunity.urgency.toUpperCase()}
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
              opportunity.impact_score >= 80 ? 'bg-green-100 text-green-700' :
              opportunity.impact_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {opportunity.impact_score}% impact
            </span>
          </div>
          <button
            onClick={onToggleExpand}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {opportunity.title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {opportunity.description}
        </p>

        {/* Weather 2.0 Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Emotional Context */}
          {opportunity.emotional_context && (
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${getEmotionalContextLabel(opportunity.emotional_context).color}`}>
              🧠 {getEmotionalContextLabel(opportunity.emotional_context).label}
            </span>
          )}

          {/* Deviation */}
          {opportunity.deviation !== undefined && opportunity.deviation !== 0 && (
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
              opportunity.deviation > 0 ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
            }`}>
              {opportunity.deviation > 0 ? '↑' : '↓'} {Math.abs(opportunity.deviation)}°F from normal
            </span>
          )}

          {/* Days Until */}
          {opportunity.days_until !== undefined && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700">
              ⏰ {opportunity.days_until} day{opportunity.days_until > 1 ? 's' : ''} away
            </span>
          )}

          {/* Consecutive Days */}
          {opportunity.consecutive_days !== undefined && opportunity.consecutive_days > 1 && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
              🔥 Day {opportunity.consecutive_days} streak
            </span>
          )}

          {/* Industry Match */}
          {opportunity.industry_match && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
              ✓ Industry Match
            </span>
          )}

          {/* EQ Adjustment */}
          {opportunity.eq_adjustment && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-100 text-indigo-700">
              📊 EQ: {opportunity.eq_adjustment.emotion} +{Math.round((opportunity.eq_adjustment.modifier - 1) * 100)}%
            </span>
          )}
        </div>

        {/* UVP Content Angle */}
        {opportunity.uvp_content_angle && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              💡 UVP Content Angle
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200 italic">
              "{opportunity.uvp_content_angle}"
            </p>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-slate-700"
          >
            <div className="p-4 space-y-4">
              {/* Suggested Actions */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Suggested Actions
                </h5>
                <ul className="space-y-2">
                  {opportunity.suggested_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                      <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Content Suggestions */}
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h5 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Content Ideas
                </h5>
                <div className="space-y-3">
                  {contentSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          suggestion.contentType === 'urgency' ? 'bg-red-100 text-red-700' :
                          suggestion.contentType === 'educational' ? 'bg-blue-100 text-blue-700' :
                          suggestion.contentType === 'promotional' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {suggestion.contentType}
                        </span>
                        <span className="text-[10px] text-gray-500">{suggestion.platform}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {suggestion.headline}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {suggestion.hook}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// CURRENT WEATHER CARD
// ============================================================================

interface CurrentWeatherCardProps {
  weather: WeatherData;
  location: string;
}

const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ weather, location }) => {
  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1 text-white/80 text-sm mb-1">
            <MapPin className="w-4 h-4" />
            {weather.location || location}
          </div>
          <div className="text-4xl font-bold">{Math.round(weather.temperature)}°F</div>
          <div className="text-white/80">Feels like {Math.round(weather.feels_like)}°F</div>
        </div>
        <div className="text-right">
          <WeatherIcon className="w-16 h-16 text-white/90" />
          <div className="text-sm capitalize">{weather.description}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-white/70" />
          <span className="text-sm">Humidity: {weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-white/70" />
          <span className="text-sm">Wind: {Math.round(weather.wind_speed)} mph</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FORECAST CARD
// ============================================================================

interface ForecastCardProps {
  forecast: ForecastDay[];
}

const ForecastCard: React.FC<ForecastCardProps> = ({ forecast }) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        5-Day Forecast
      </h3>
      <div className="space-y-2">
        {forecast.slice(0, 5).map((day, idx) => {
          const WeatherIcon = getWeatherIcon(day.condition);
          const date = new Date(day.date);
          const dayName = idx === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

          return (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-12 text-sm text-gray-600 dark:text-gray-400">{dayName}</span>
                <WeatherIcon className="w-5 h-5 text-gray-500" />
                <span className="text-xs text-gray-500 capitalize">{day.condition}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(day.temp_max)}°</span>
                <span className="text-sm text-gray-400">{Math.round(day.temp_min)}°</span>
                {day.precipitation_chance > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-blue-500">
                    <Droplets className="w-3 h-3" />
                    {day.precipitation_chance}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// STATS PANEL
// ============================================================================

interface StatsPanelProps {
  result: WeatherResult | null;
  state: WeatherPipelineState;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ result, state }) => {
  if (!result) return null;

  const opportunityTypes = result.opportunities.reduce((acc, opp) => {
    acc[opp.type] = (acc[opp.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const urgencyCounts = result.opportunities.reduce((acc, opp) => {
    acc[opp.urgency] = (acc[opp.urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Weather Stats</h3>

      {/* Location */}
      <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Location</p>
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{result.location}</p>
      </div>

      {/* Opportunity Summary */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total Opportunities</span>
          <span className="font-medium">{result.opportunities.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Forecast Days</span>
          <span className="font-medium">{result.forecast.length}</span>
        </div>
      </div>

      {/* Urgency Breakdown */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">By Urgency</p>
        <div className="space-y-1">
          {['critical', 'high', 'medium', 'low'].map(urgency => (
            <div key={urgency} className="flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded ${getUrgencyColor(urgency)}`}>
                {urgency}
              </span>
              <span className="font-medium">{urgencyCounts[urgency] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">By Type</p>
        <div className="space-y-1">
          {Object.entries(opportunityTypes).map(([type, count]) => {
            const Icon = getOpportunityTypeIcon(type);
            return (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Icon className="w-3 h-3" />
                  {type.replace('_', ' ')}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Updated */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(result.fetchedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WeatherDevPage() {
  const { currentBrand } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [uvpLoading, setUvpLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedOpportunities, setExpandedOpportunities] = useState<Set<number>>(new Set());

  // Pipeline state
  const [state, setState] = useState<WeatherPipelineState>({
    stage: 'idle',
    progress: 0,
    statusMessage: 'Ready to fetch weather data'
  });

  // Result state - load from cache initially
  const [result, setResult] = useState<WeatherResult | null>(() => loadCachedResult());

  // Load UVP from database
  useEffect(() => {
    async function loadUVP() {
      if (!currentBrand?.id) {
        setUvpLoading(false);
        return;
      }

      try {
        const uvpData = await getUVPByBrand(currentBrand.id);
        if (uvpData) {
          setUvp(uvpData);
          console.log('[WeatherDevPage] Loaded UVP:', {
            id: uvpData.id,
            industry: uvpData.targetCustomer?.industry,
            location: currentBrand.location
          });
        }
      } catch (err) {
        console.error('[WeatherDevPage] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [currentBrand?.id]);

  // Fetch weather - MANUAL ONLY, no auto-fetch on mount
  const fetchWeather = useCallback(async () => {
    // Get location from brand, or extract city from UVP target customer statement
    // Look for common Texas cities in the target customer/transformation text
    let location = currentBrand?.location;

    if (!location && uvp?.targetCustomer?.statement) {
      const statement = uvp.targetCustomer.statement.toLowerCase();
      // Extract known cities from statement - use OpenWeather format: City,State,US
      if (statement.includes('austin')) location = 'Austin,TX,US';
      else if (statement.includes('san antonio')) location = 'San Antonio,TX,US';
      else if (statement.includes('houston')) location = 'Houston,TX,US';
      else if (statement.includes('dallas')) location = 'Dallas,TX,US';
      else if (statement.includes('central texas')) location = 'Austin,TX,US';
    }

    // Fallback to New York if no location found
    if (!location) location = 'New York,NY,US';

    console.log('[WeatherDevPage] Starting weather fetch for:', location);

    try {
      // Stage 1: Fetch current weather
      setState({
        stage: 'fetching_current',
        progress: 20,
        statusMessage: 'Fetching current weather...'
      });

      const current = await WeatherAPI.getCurrentWeather(location);

      if (!current) {
        throw new Error('Failed to fetch current weather data');
      }

      // Stage 2: Fetch forecast
      setState({
        stage: 'fetching_forecast',
        progress: 50,
        statusMessage: 'Fetching 5-day forecast...'
      });

      const forecast = await WeatherAPI.get5DayForecast(location);

      // Stage 3: Detect opportunities
      setState({
        stage: 'detecting_opportunities',
        progress: 80,
        statusMessage: 'Detecting weather opportunities...'
      });

      const industry = uvp?.targetCustomer?.industry || currentBrand?.industry || 'general';

      // Extract UVP pain points for Weather 2.0 integration
      // Pain points come from emotional/functional drivers in transformationGoal
      const uvpPainPoints = [
        ...(uvp?.transformationGoal?.emotionalDrivers || []),
        ...(uvp?.transformationGoal?.functionalDrivers || []),
        ...(uvp?.targetCustomer?.emotionalDrivers || []),
        ...(uvp?.targetCustomer?.functionalDrivers || [])
      ];
      const uvpTransformation = uvp?.transformationGoal?.statement || undefined;

      const opportunities = await WeatherAPI.detectWeatherOpportunities(
        location,
        industry,
        uvpPainPoints,
        uvpTransformation
      );

      // Complete
      const weatherResult: WeatherResult = {
        current,
        forecast,
        opportunities,
        location,
        fetchedAt: new Date().toISOString()
      };

      setResult(weatherResult);
      saveCachedResult(weatherResult);

      setState({
        stage: 'complete',
        progress: 100,
        statusMessage: `Found ${opportunities.length} weather opportunities`
      });

    } catch (err) {
      console.error('[WeatherDevPage] Weather fetch failed:', err);
      setState({
        stage: 'error',
        progress: 0,
        statusMessage: 'Failed to fetch weather data',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }, [currentBrand, uvp]);

  // Clear cache handler
  const handleClearCache = useCallback(() => {
    clearWeatherCache();
    WeatherAPI.clearCache(); // Clear in-memory cache in WeatherAPI service
    setResult(null);
    setState({
      stage: 'idle',
      progress: 0,
      statusMessage: 'Cache cleared - ready to fetch fresh data'
    });
  }, []);

  // Toggle expanded opportunity
  const handleToggleExpand = useCallback((index: number) => {
    setExpandedOpportunities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const brandName = currentBrand?.name || 'Brand';
  const isLoading = state.stage !== 'idle' && state.stage !== 'complete' && state.stage !== 'error';
  const hasCachedData = result !== null;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Weather Intelligence
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">DEV</span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLoading ? (
                    <span className="text-blue-600">{state.statusMessage}</span>
                  ) : hasCachedData ? (
                    <span className="text-green-600">
                      {result?.opportunities.length} opportunities · {result?.location}
                    </span>
                  ) : (
                    <span>Weather-triggered content opportunities</span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Brand:</span>
              <span className="font-medium text-gray-900 dark:text-white">{brandName}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {hasCachedData && (
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </button>
            )}

            <button
              onClick={fetchWeather}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-blue-100 text-blue-600 cursor-wait'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {state.progress}%
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4" />
                  Fetch Weather
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <span>{state.statusMessage}</span>
              <span>{state.stage}</span>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {state.stage === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{state.error}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - UVP Building Blocks */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="w-[280px] h-full flex flex-col">
                <ScrollArea className="flex-1">
                  {uvp && (
                    <UVPBuildingBlocks
                      uvp={uvp}
                      deepContext={null}
                      onSelectItem={(item) => {
                        console.log('[WeatherDevPage] UVP item selected:', item);
                      }}
                    />
                  )}
                  {!uvp && uvpLoading && (
                    <div className="p-4 text-sm text-gray-500">Loading UVP data...</div>
                  )}
                  {!uvp && !uvpLoading && (
                    <div className="p-4 text-sm text-red-500">No UVP found. Complete onboarding first.</div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex-shrink-0 w-6 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center border-r border-gray-200 dark:border-slate-700"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Center: Weather Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            {!hasCachedData ? (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <Cloud className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Weather Intelligence Ready
                </h2>
                <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                  Weather affects $3 trillion of US business. Get real-time weather data
                  and AI-powered content opportunities based on your industry and location.
                </p>
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4" />
                    Current Conditions
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    5-Day Forecast
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Content Opportunities
                  </div>
                </div>
                <button
                  onClick={fetchWeather}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <Cloud className="w-5 h-5" />
                  Fetch Weather Data
                </button>
              </div>
            ) : (
              // Weather Data Display
              <div className="space-y-4">
                {/* Current Weather + Forecast Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.current && (
                    <CurrentWeatherCard weather={result.current} location={result.location} />
                  )}
                  {result.forecast.length > 0 && (
                    <ForecastCard forecast={result.forecast} />
                  )}
                </div>

                {/* Opportunities Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Weather Opportunities ({result.opportunities.length})
                  </h3>
                </div>

                {/* Opportunities Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {result.opportunities.map((opportunity, idx) => (
                      <OpportunityCard
                        key={idx}
                        opportunity={opportunity}
                        uvp={uvp}
                        brandName={brandName}
                        isExpanded={expandedOpportunities.has(idx)}
                        onToggleExpand={() => handleToggleExpand(idx)}
                      />
                    ))}
                  </AnimatePresence>

                  {result.opportunities.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl">
                      <Sun className="w-12 h-12 text-yellow-400 mb-4" />
                      <p className="text-gray-500">No significant weather opportunities detected</p>
                      <p className="text-sm text-gray-400 mt-1">Current conditions are stable</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats Panel */}
        <div className="w-72 flex-shrink-0 bg-gray-50 dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
          {result ? (
            <StatsPanel result={result} state={state} />
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Fetch weather to see stats</p>
            </div>
          )}

          {/* Research Note */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Research Insight</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Weather-informed campaigns see 320% higher engagement. A 1°F temp change can drive 2% sales shifts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherDevPage;
