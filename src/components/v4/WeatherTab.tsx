/**
 * WeatherTab Component
 *
 * Embeddable Weather tab for V4PowerModePanel.
 * Surfaces weather-triggered content opportunities.
 * Based on WeatherDevPage but simplified for tab embedding.
 *
 * Created: 2025-11-30
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { WeatherAPI, type WeatherData, type ForecastDay, type WeatherOpportunity } from '@/services/intelligence/weather-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Thermometer,
  TrendingUp,
  ChevronDown,
  AlertTriangle,
  Calendar,
  MapPin,
  Zap,
  Target,
  RefreshCcw,
  Droplets,
  CloudSun,
  CloudSnow,
  Flame,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const CACHE_KEY = 'weather_tab_result_v1';

interface WeatherResult {
  current: WeatherData | null;
  forecast: ForecastDay[];
  opportunities: WeatherOpportunity[];
  location: string;
  fetchedAt: string;
}

function loadCachedResult(): WeatherResult | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    return null;
  }
  return null;
}

function saveCachedResult(result: WeatherResult): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch (err) {
    console.warn('[WeatherTab] Failed to save cache:', err);
  }
}

function clearWeatherCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// ============================================================================
// WEATHER HELPERS
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
    case 'precipitation': return Droplets;
    case 'seasonal': return Calendar;
    case 'forecast_alert': return AlertTriangle;
    case 'weather_window': return Sun;
    case 'deviation': return TrendingUp;
    default: return Cloud;
  }
}

// ============================================================================
// OPPORTUNITY CARD COMPONENT
// ============================================================================

interface OpportunityCardProps {
  opportunity: WeatherOpportunity;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isExpanded,
  onToggleExpand
}) => {
  const TypeIcon = getOpportunityTypeIcon(opportunity.type);
  const urgencyColor = getUrgencyColor(opportunity.urgency);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border-2 overflow-hidden transition-all ${
        isExpanded ? 'col-span-full' : ''
      } border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 hover:shadow-md`}
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

        {/* Weather Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {opportunity.emotional_context && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700">
              {opportunity.emotional_context}
            </span>
          )}

          {opportunity.deviation !== undefined && opportunity.deviation !== 0 && (
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
              opportunity.deviation > 0 ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
            }`}>
              {opportunity.deviation > 0 ? '↑' : '↓'} {Math.abs(opportunity.deviation)}°F from normal
            </span>
          )}

          {opportunity.days_until !== undefined && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
              {opportunity.days_until} day{opportunity.days_until > 1 ? 's' : ''} away
            </span>
          )}

          {opportunity.industry_match && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
              Industry Match
            </span>
          )}
        </div>

        {/* UVP Content Angle */}
        {opportunity.uvp_content_angle && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              Content Angle
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
              <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                <h5 className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Suggested Actions
                </h5>
                <ul className="space-y-2">
                  {opportunity.suggested_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-sky-800 dark:text-sky-200">
                      <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
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
    <div className="p-4 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
            <MapPin className="w-3 h-3" />
            {weather.location || location}
          </div>
          <div className="text-3xl font-bold">{Math.round(weather.temperature)}°F</div>
          <div className="text-white/80 text-sm">Feels like {Math.round(weather.feels_like)}°F</div>
        </div>
        <div className="text-right">
          <WeatherIcon className="w-12 h-12 text-white/90" />
          <div className="text-xs capitalize">{weather.description}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
        <div className="flex items-center gap-2">
          <Droplets className="w-3 h-3 text-white/70" />
          <span className="text-xs">Humidity: {weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-3 h-3 text-white/70" />
          <span className="text-xs">Wind: {Math.round(weather.wind_speed)} mph</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface WeatherTabProps {
  uvp: CompleteUVP | null;
  brandId?: string;
}

interface PipelineState {
  stage: 'idle' | 'fetching_current' | 'fetching_forecast' | 'detecting_opportunities' | 'complete' | 'error';
  progress: number;
  statusMessage: string;
  error?: string;
}

export function WeatherTab({ uvp: providedUvp, brandId }: WeatherTabProps) {
  const { currentBrand } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(providedUvp);
  const [uvpLoading, setUvpLoading] = useState(!providedUvp);
  const [expandedOpportunities, setExpandedOpportunities] = useState<Set<number>>(new Set());

  const [state, setState] = useState<PipelineState>({
    stage: 'idle',
    progress: 0,
    statusMessage: 'Ready to fetch weather data'
  });

  const [result, setResult] = useState<WeatherResult | null>(() => loadCachedResult());

  // Load UVP from database if not provided
  useEffect(() => {
    async function loadUVP() {
      if (providedUvp) {
        setUvp(providedUvp);
        setUvpLoading(false);
        return;
      }

      const id = brandId || currentBrand?.id;
      if (!id) {
        setUvpLoading(false);
        return;
      }

      try {
        const uvpData = await getUVPByBrand(id);
        if (uvpData) {
          setUvp(uvpData);
        }
      } catch (err) {
        console.error('[WeatherTab] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [providedUvp, brandId, currentBrand?.id]);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    let location = currentBrand?.location;

    if (!location && uvp?.targetCustomer?.statement) {
      const statement = uvp.targetCustomer.statement.toLowerCase();
      if (statement.includes('austin')) location = 'Austin,TX,US';
      else if (statement.includes('san antonio')) location = 'San Antonio,TX,US';
      else if (statement.includes('houston')) location = 'Houston,TX,US';
      else if (statement.includes('dallas')) location = 'Dallas,TX,US';
      else if (statement.includes('central texas')) location = 'Austin,TX,US';
    }

    if (!location) location = 'New York,NY,US';

    try {
      setState({
        stage: 'fetching_current',
        progress: 20,
        statusMessage: 'Fetching current weather...'
      });

      const current = await WeatherAPI.getCurrentWeather(location);

      if (!current) {
        throw new Error('Failed to fetch current weather data');
      }

      setState({
        stage: 'fetching_forecast',
        progress: 50,
        statusMessage: 'Fetching forecast...'
      });

      const forecast = await WeatherAPI.get5DayForecast(location);

      setState({
        stage: 'detecting_opportunities',
        progress: 80,
        statusMessage: 'Detecting opportunities...'
      });

      const industry = uvp?.targetCustomer?.industry || currentBrand?.industry || 'general';

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
      console.error('[WeatherTab] Weather fetch failed:', err);
      setState({
        stage: 'error',
        progress: 0,
        statusMessage: 'Failed to fetch weather data',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }, [currentBrand, uvp]);

  const handleClearCache = useCallback(() => {
    clearWeatherCache();
    WeatherAPI.clearCache();
    setResult(null);
    setState({
      stage: 'idle',
      progress: 0,
      statusMessage: 'Cache cleared'
    });
  }, []);

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

  const isLoading = state.stage !== 'idle' && state.stage !== 'complete' && state.stage !== 'error';
  const hasCachedData = result !== null;

  // Loading state
  if (uvpLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading UVP data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Cloud className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weather Intelligence</h3>
            <p className="text-xs text-gray-500">
              {result ? `${result.opportunities.length} opportunities • ${result.location}` : 'Weather-triggered content'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasCachedData && (
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}

          <button
            onClick={fetchWeather}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-semibold transition-all ${
              isLoading
                ? 'bg-sky-100 text-sky-600 cursor-wait'
                : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 shadow-md'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {state.progress}%
              </>
            ) : (
              <>
                <RefreshCcw className="w-3 h-3" />
                Fetch Weather
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-500">{state.statusMessage}</p>
        </div>
      )}

      {/* Error Display */}
      {state.stage === 'error' && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{state.error}</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      {!hasCachedData ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
            <Cloud className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Weather Intelligence Ready
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
            Weather affects $3T of US business. Get real-time weather opportunities for timely content.
          </p>
          <button
            onClick={fetchWeather}
            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:from-sky-600 hover:to-blue-600 font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/25"
          >
            <Cloud className="w-4 h-4" />
            Fetch Weather Data
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Weather Card */}
          {result.current && (
            <CurrentWeatherCard weather={result.current} location={result.location} />
          )}

          {/* Opportunities */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Weather Opportunities ({result.opportunities.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {result.opportunities.map((opportunity, idx) => (
                <OpportunityCard
                  key={idx}
                  opportunity={opportunity}
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
  );
}

export default WeatherTab;
