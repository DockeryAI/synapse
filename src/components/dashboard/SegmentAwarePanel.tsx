/**
 * Segment-Aware Dashboard Panel
 *
 * Phase D - Item #32: Segment-Aware Dashboard
 *
 * Customizes dashboard features based on business segment:
 * - SMB Local: Weather hooks, local SEO, Yelp data
 * - SMB Regional: Regional comparisons, seasonal content
 * - B2B National: G2 reviews, LinkedIn insights
 * - B2B Global: Enterprise vendor comparisons
 *
 * Created: 2025-11-26
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  MapPin,
  Star,
  Globe,
  Building,
  Linkedin,
  TrendingUp,
  Calendar,
  Users,
  Award,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeepContext } from '@/types/synapse/deepContext.types';

/**
 * Business segment types
 */
export type BusinessSegment = 'smb_local' | 'smb_regional' | 'b2b_national' | 'b2b_global';

/**
 * Segment configuration with features
 */
interface SegmentConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  features: SegmentFeature[];
}

interface SegmentFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  dataKey: string; // key in DeepContext to check for data
  enabled: boolean;
}

/**
 * Props for SegmentAwarePanel
 */
interface SegmentAwarePanelProps {
  context: DeepContext | null;
  segment?: BusinessSegment;
  className?: string;
}

/**
 * Detect segment from DeepContext
 */
export function detectSegment(context: DeepContext | null): BusinessSegment {
  if (!context) return 'smb_local';

  const profile = context.business?.profile;
  const industry = profile?.industry?.toLowerCase() || '';
  const location = profile?.location;
  const competitors = profile?.competitors || [];

  // Check for B2B indicators
  const b2bKeywords = ['software', 'saas', 'enterprise', 'b2b', 'consulting', 'technology', 'services', 'solutions'];
  const isB2B = b2bKeywords.some(kw => industry.includes(kw)) ||
                (context.synthesis as any)?.industryClassification?.type === 'b2b';

  // Check location scope
  const hasLocation = location?.city || location?.state;
  const isLocal = hasLocation && !profile?.website?.includes('.com') &&
                  competitors.length < 10;

  // Check for global indicators
  const globalKeywords = ['global', 'international', 'enterprise', 'worldwide', 'multi-national'];
  const globalCities = ['london', 'new york', 'san francisco', 'singapore', 'tokyo', 'berlin', 'amsterdam'];
  const locationCity = location?.city?.toLowerCase() || '';
  const locationCountry = location?.country?.toLowerCase() || '';

  const isGlobal = competitors.some(c => c.includes('.com') || c.includes('international')) ||
                   globalKeywords.some(kw => industry.includes(kw)) ||
                   // Enterprise software/SaaS/AI is typically global
                   (industry.includes('software') || industry.includes('saas') || industry.includes('ai') || industry.includes('platform')) ||
                   // Global tech hub locations
                   globalCities.some(city => locationCity.includes(city)) ||
                   // UK-based companies are typically global
                   locationCountry.includes('uk') || locationCountry.includes('united kingdom') ||
                   // Check business description for global signals
                   (profile as any)?.description?.toLowerCase().includes('enterprise') ||
                   (profile as any)?.description?.toLowerCase().includes('global') ||
                   context.competitiveIntel?.blindSpots?.some(bs =>
                     bs.topic?.toLowerCase().includes('international') ||
                     bs.topic?.toLowerCase().includes('global') ||
                     bs.topic?.toLowerCase().includes('enterprise')
                   );

  // Determine segment
  if (isB2B) {
    return isGlobal ? 'b2b_global' : 'b2b_national';
  } else {
    return isLocal ? 'smb_local' : 'smb_regional';
  }
}

/**
 * Segment configurations with their features
 */
const SEGMENT_CONFIGS: Record<BusinessSegment, SegmentConfig> = {
  smb_local: {
    label: 'Local Business',
    icon: MapPin,
    color: 'text-green-600',
    features: [
      {
        id: 'weather_hooks',
        title: 'Weather Hooks',
        description: 'Content triggers based on local weather conditions',
        icon: Cloud,
        dataKey: 'realTimeCultural.signals',
        enabled: true,
      },
      {
        id: 'local_seo',
        title: 'Local SEO Keywords',
        description: '"Near me" and location-based keyword opportunities',
        icon: MapPin,
        dataKey: 'business.profile.location',
        enabled: true,
      },
      {
        id: 'yelp_reviews',
        title: 'Review Insights',
        description: 'Customer feedback and review trends',
        icon: Star,
        dataKey: 'customerPsychology.emotional',
        enabled: true,
      },
      {
        id: 'local_events',
        title: 'Local Events',
        description: 'Community events and seasonal opportunities',
        icon: Calendar,
        dataKey: 'realTimeCultural.moments',
        enabled: true,
      },
    ],
  },
  smb_regional: {
    label: 'Regional Business',
    icon: Globe,
    color: 'text-blue-600',
    features: [
      {
        id: 'regional_comparison',
        title: 'Regional Comparisons',
        description: 'How you stack up against regional competitors',
        icon: BarChart3,
        dataKey: 'competitiveIntel.opportunities',
        enabled: true,
      },
      {
        id: 'seasonal_content',
        title: 'Seasonal Content',
        description: 'Content optimized for regional seasonal patterns',
        icon: Calendar,
        dataKey: 'industry.seasonality',
        enabled: true,
      },
      {
        id: 'market_trends',
        title: 'Market Trends',
        description: 'Regional market trends and opportunities',
        icon: TrendingUp,
        dataKey: 'industry.trends',
        enabled: true,
      },
      {
        id: 'customer_patterns',
        title: 'Customer Patterns',
        description: 'Regional customer behavior insights',
        icon: Users,
        dataKey: 'customerPsychology.behavioral',
        enabled: true,
      },
    ],
  },
  b2b_national: {
    label: 'B2B National',
    icon: Building,
    color: 'text-purple-600',
    features: [
      {
        id: 'g2_reviews',
        title: 'G2/Capterra Reviews',
        description: 'Enterprise software review insights',
        icon: Star,
        dataKey: 'competitiveIntel.blindSpots',
        enabled: true,
      },
      {
        id: 'linkedin_insights',
        title: 'LinkedIn Insights',
        description: 'Professional network engagement opportunities',
        icon: Linkedin,
        dataKey: 'synthesis.keyInsights',
        enabled: true,
      },
      {
        id: 'thought_leadership',
        title: 'Thought Leadership',
        description: 'Industry expertise positioning angles',
        icon: Award,
        dataKey: 'industry.trends',
        enabled: true,
      },
      {
        id: 'case_studies',
        title: 'Case Study Opportunities',
        description: 'Customer success story frameworks',
        icon: Users,
        dataKey: 'customerPsychology.emotional',
        enabled: true,
      },
    ],
  },
  b2b_global: {
    label: 'B2B Global',
    icon: Globe,
    color: 'text-indigo-600',
    features: [
      {
        id: 'vendor_comparison',
        title: 'Enterprise Vendor Analysis',
        description: 'Global competitor landscape insights',
        icon: BarChart3,
        dataKey: 'competitiveIntel.opportunities',
        enabled: true,
      },
      {
        id: 'global_trends',
        title: 'Global Market Trends',
        description: 'International market dynamics and opportunities',
        icon: TrendingUp,
        dataKey: 'industry.trends',
        enabled: true,
      },
      {
        id: 'enterprise_positioning',
        title: 'Enterprise Positioning',
        description: 'Strategic positioning for enterprise buyers',
        icon: Building,
        dataKey: 'synthesis.hiddenPatterns',
        enabled: true,
      },
      {
        id: 'analyst_insights',
        title: 'Analyst Relations',
        description: 'Industry analyst and report insights',
        icon: Award,
        dataKey: 'synthesis.keyInsights',
        enabled: true,
      },
    ],
  },
};

/**
 * Check if a feature has data available
 */
function hasFeatureData(context: DeepContext | null, dataKey: string): boolean {
  if (!context) return false;

  const keys = dataKey.split('.');
  let value: any = context;

  for (const key of keys) {
    if (value === null || value === undefined) return false;
    value = value[key];
  }

  // Check if we have any meaningful data
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

/**
 * Get data count for a feature
 */
function getFeatureDataCount(context: DeepContext | null, dataKey: string): number {
  if (!context) return 0;

  const keys = dataKey.split('.');
  let value: any = context;

  for (const key of keys) {
    if (value === null || value === undefined) return 0;
    value = value[key];
  }

  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object') return Object.keys(value).length;
  return value ? 1 : 0;
}

/**
 * Segment-Aware Dashboard Panel Component
 */
export function SegmentAwarePanel({
  context,
  segment: propSegment,
  className = '',
}: SegmentAwarePanelProps) {
  // Detect or use provided segment
  const segment = propSegment || detectSegment(context);
  const config = SEGMENT_CONFIGS[segment];
  const SegmentIcon = config.icon;

  // Calculate feature availability
  const featureStatus = useMemo(() => {
    return config.features.map(feature => ({
      ...feature,
      hasData: hasFeatureData(context, feature.dataKey),
      dataCount: getFeatureDataCount(context, feature.dataKey),
    }));
  }, [context, config.features]);

  // Count features with data
  const activeFeatures = featureStatus.filter(f => f.hasData).length;

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SegmentIcon className={`w-5 h-5 ${config.color}`} />
            <CardTitle className="text-lg">Segment Insights</CardTitle>
          </div>
          <Badge variant="outline" className={`${config.color} border-current`}>
            {config.label}
          </Badge>
        </div>
        <CardDescription>
          Features tailored for your business type ({activeFeatures}/{config.features.length} active)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featureStatus.map((feature, idx) => {
            const FeatureIcon = feature.icon;
            const isActive = feature.hasData;

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`
                  p-3 rounded-lg border transition-colors
                  ${isActive
                    ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800'
                    : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30'
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}>
                    <FeatureIcon className={`w-4 h-4 ${isActive ? config.color : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                        {feature.title}
                      </h4>
                      {isActive && feature.dataCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {feature.dataCount}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Segment Summary */}
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Segment Recommendations
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {segment === 'smb_local' && (
              <>Focus on local visibility. Use weather-triggered content and "near me" keywords to capture nearby customers actively searching.</>
            )}
            {segment === 'smb_regional' && (
              <>Expand your reach regionally. Leverage seasonal patterns and regional market trends to compete across multiple markets.</>
            )}
            {segment === 'b2b_national' && (
              <>Build authority nationally. Use thought leadership content and LinkedIn to establish expertise in your industry.</>
            )}
            {segment === 'b2b_global' && (
              <>Position for enterprise. Focus on analyst relations, global competitive differentiation, and enterprise buyer messaging.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default SegmentAwarePanel;
