/**
 * Source Citation Component (Enhanced)
 *
 * Displays data source citations with credibility indicators
 * Shows provenance and reliability of AI-extracted information
 *
 * Enhancements:
 * - Clickable sources (open in new tab)
 * - Hover preview tooltips
 * - Better icon mapping
 * - Confidence badges per source
 * - Dark mode optimized
 *
 * Created: 2025-11-18
 * Enhanced: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  FileText,
  Video,
  MessageSquare,
  Star,
  Shield,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConfidenceBadge } from './ConfidenceMeter';

export interface DataSource {
  id: string;
  type: 'website' | 'reviews' | 'youtube' | 'social' | 'competitor' | 'api' | 'manual' | 'testimonials' | 'about' | 'services';
  name: string;
  url?: string;
  extractedAt: Date;
  reliability: number; // 0-100
  dataPoints: number; // Number of data points extracted
  excerpt?: string; // Sample of what was extracted
}

interface SourceCitationProps {
  sources: DataSource[];
  compact?: boolean;
  showExcerpts?: boolean;
  className?: string;
}

export function SourceCitation({
  sources,
  compact = false,
  showExcerpts = false,
  className = '',
}: SourceCitationProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSourceIcon = (type: DataSource['type']) => {
    switch (type) {
      case 'website':
        return <Globe className="w-4 h-4" />;
      case 'testimonials':
        return <FileText className="w-4 h-4" />;
      case 'about':
        return <Globe className="w-4 h-4" />;
      case 'services':
        return <Briefcase className="w-4 h-4" />;
      case 'reviews':
        return <Star className="w-4 h-4" />;
      case 'youtube':
        return <Video className="w-4 h-4" />;
      case 'social':
        return <MessageSquare className="w-4 h-4" />;
      case 'competitor':
        return <Shield className="w-4 h-4" />;
      case 'api':
      case 'manual':
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceTypeLabel = (type: DataSource['type']): string => {
    const labels: Record<DataSource['type'], string> = {
      website: 'Website',
      testimonials: 'Testimonials',
      about: 'About Page',
      services: 'Services Page',
      reviews: 'Customer Reviews',
      youtube: 'YouTube',
      social: 'Social Media',
      competitor: 'Competitor Analysis',
      api: 'API Data',
      manual: 'Manual Entry',
    };
    return labels[type] || type;
  };

  const getReliabilityBadge = (reliability: number) => {
    if (reliability >= 90) {
      return { label: 'Verified', color: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20' };
    } else if (reliability >= 70) {
      return { label: 'Reliable', color: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20' };
    } else {
      return { label: 'Unverified', color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20' };
    }
  };

  const totalDataPoints = sources.reduce((sum, s) => sum + s.dataPoints, 0);
  const avgReliability = Math.round(
    sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length
  );

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
        <span>
          {sources.length} {sources.length === 1 ? 'source' : 'sources'}
        </span>
        <span className="text-gray-400">•</span>
        <span>{totalDataPoints} data points</span>
        <span className="text-gray-400">•</span>
        <span className="font-medium">{avgReliability}% reliability</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Data Sources
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>{totalDataPoints} data points</span>
          <span>•</span>
          <span className="font-medium text-gray-900 dark:text-white">{avgReliability}% avg reliability</span>
        </div>
      </div>

      {/* Source List */}
      <div className="space-y-2">
        {sources.map((source) => {
          const isExpanded = expandedId === source.id;
          const reliabilityBadge = getReliabilityBadge(source.reliability);

          return (
            <TooltipProvider key={source.id} delayDuration={300}>
              <div
                className="bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden transition-all hover:border-purple-300 dark:hover:border-purple-600"
              >
                {/* Source Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : source.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon with Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded text-purple-600 dark:text-purple-400 hover:scale-110 transition-transform">
                          {getSourceIcon(source.type)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">{getSourceTypeLabel(source.type)}</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {source.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {source.dataPoints} data {source.dataPoints === 1 ? 'point' : 'points'}
                        </span>
                        <ConfidenceBadge score={source.reliability} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {source.url && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Open source</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {showExcerpts && source.excerpt && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </motion.div>
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && showExcerpts && source.excerpt && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200 dark:border-slate-600"
                    >
                      <div className="p-3 bg-white dark:bg-slate-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Sample Data
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                          "{source.excerpt}"
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Extracted {formatRelativeTime(source.extractedAt)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Provenance Footer */}
      <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p>
            All data extracted using AI analysis and verified against multiple sources.
            Sources are ranked by reliability and data quality.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Source Tags - Compact display for inline citations
 */
export function SourceTags({ sources }: { sources: DataSource[] }) {
  const getSourceIcon = (type: DataSource['type']) => {
    switch (type) {
      case 'website':
        return <Globe className="w-3 h-3" />;
      case 'testimonials':
        return <FileText className="w-3 h-3" />;
      case 'about':
        return <Globe className="w-3 h-3" />;
      case 'services':
        return <Briefcase className="w-3 h-3" />;
      case 'reviews':
        return <Star className="w-3 h-3" />;
      case 'youtube':
        return <Video className="w-3 h-3" />;
      case 'social':
        return <MessageSquare className="w-3 h-3" />;
      case 'competitor':
        return <Shield className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((source) => (
        <motion.span
          key={source.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs"
          title={source.name}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {getSourceIcon(source.type)}
          <span>{source.type}</span>
        </motion.span>
      ))}
    </div>
  );
}

/**
 * Source Badge - Single source indicator with tooltip
 */
export function SourceBadge({ source }: { source: DataSource }) {
  const getSourceIcon = (type: DataSource['type']) => {
    switch (type) {
      case 'testimonials':
        return <FileText className="w-3 h-3" />;
      case 'about':
        return <Globe className="w-3 h-3" />;
      case 'services':
        return <Briefcase className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md text-xs cursor-help"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {getSourceIcon(source.type)}
            <span className="text-gray-700 dark:text-gray-300">{source.name}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 dark:text-gray-400">{source.reliability}%</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold text-xs">{source.name}</p>
            <p className="text-xs text-gray-400">{source.dataPoints} data points</p>
            {source.excerpt && (
              <p className="text-xs italic text-gray-400 max-w-xs">"{source.excerpt.slice(0, 100)}..."</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}
