/**
 * Intelligence Display Component
 * Shows all gathered intelligence with tabbed interface
 *
 * Features:
 * - Display data source success/failure status
 * - Show specialty detection results
 * - List niche keywords
 * - Show analysis performance metrics
 * - Tabbed interface for organization (sources, specialty, keywords)
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Target,
  Hash,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useIntelligenceDisplay, formatDuration as hookFormatDuration, getStatusColor, getPriorityColor } from '@/hooks/useIntelligenceDisplay';
import type { IntelligenceResult } from '@/services/parallel-intelligence.service';
import type { SpecialtyDetection } from '@/services/specialty-detection.service';

interface IntelligenceDisplayProps {
  intelligence: IntelligenceResult[];
  specialty: SpecialtyDetection;
  className?: string;
}

/**
 * IntelligenceDisplay Component
 * Main component for displaying gathered intelligence
 */
export const IntelligenceDisplay: React.FC<IntelligenceDisplayProps> = ({
  intelligence,
  specialty,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('sources');

  // Use the intelligence display hook for formatting and stats
  const { formattedData, groupedByPriority, stats, isViable } = useIntelligenceDisplay(intelligence);

  /**
   * Get source icon
   */
  const getSourceIcon = (source: string) => {
    if (source.includes('apify')) return '🌐';
    if (source.includes('outscraper')) return '📍';
    if (source.includes('serper')) return '🔍';
    if (source.includes('youtube')) return '📺';
    if (source.includes('news')) return '📰';
    if (source.includes('weather')) return '🌤️';
    if (source.includes('maps')) return '🗺️';
    return '📊';
  };

  /**
   * Format duration
   */
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6" />
            {stats.successful}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Data Sources
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
            <Target className="w-6 h-6" />
            {specialty.confidence}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Confidence
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-2">
            <Hash className="w-6 h-6" />
            {specialty.nicheKeywords.length}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Keywords Found
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            {hookFormatDuration(stats.avgDuration)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Avg Response Time
          </div>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources">
            <Database className="w-4 h-4 mr-2" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="specialty">
            <Target className="w-4 h-4 mr-2" />
            Specialty
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Hash className="w-4 h-4 mr-2" />
            Keywords
          </TabsTrigger>
        </TabsList>

        {/* Data Sources Tab */}
        <TabsContent value="sources">
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-semibold">Intelligence Sources</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.successful} successful
                  </Badge>
                  {stats.failed > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.failed} failed
                    </Badge>
                  )}
                </div>
              </div>

              {/* All Sources (formatted) */}
              {formattedData.map((result) => (
                <div
                  key={result.source}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    result.status === 'success' ? 'hover:bg-gray-50' :
                    result.status === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      result.status === 'success' ? 'bg-green-100' :
                      result.status === 'error' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      {result.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                       result.status === 'error' ? <XCircle className="w-5 h-5 text-red-600" /> :
                       <AlertCircle className="w-5 h-5 text-yellow-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <span>{getSourceIcon(result.source)}</span>
                        {result.source}
                        {result.priority !== 'optional' && (
                          <Badge variant={result.priority === 'critical' ? 'destructive' : 'default'} className="text-xs">
                            {result.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.dataSummary}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {hookFormatDuration(result.duration)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.confidence}% confidence
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Viability Warning */}
              {!isViable && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div className="text-sm text-yellow-800">
                      Only {stats.successful} sources succeeded. Minimum 8 required for reliable results.
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Performance Summary
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-700">
                      {stats.successRate}%
                    </div>
                    <div className="text-xs text-blue-600">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-700">
                      {hookFormatDuration(stats.avgDuration)}
                    </div>
                    <div className="text-xs text-blue-600">Avg Response</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-700">
                      {stats.overallConfidence}%
                    </div>
                    <div className="text-xs text-blue-600">Confidence</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Specialty Tab */}
        <TabsContent value="specialty">
          <Card className="p-4">
            <div className="space-y-4">
              {/* Main Specialty */}
              <div>
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Detected Specialty
                </div>
                <div className="text-2xl font-bold text-primary mb-2">
                  {specialty.specialty}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {specialty.confidence}% confidence
                </Badge>
              </div>

              {/* Target Market */}
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Target Market
                </div>
                <div className="text-base font-medium">
                  {specialty.targetMarket}
                </div>
              </div>

              {/* Reasoning */}
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">
                  Analysis Reasoning
                </div>
                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                  {specialty.reasoning}
                </div>
              </div>

              {/* Confidence Breakdown */}
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-3">
                  Confidence Score Breakdown
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${specialty.confidence}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium w-12 text-right">
                      {specialty.confidence}%
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Based on {successfulSources.length} data sources and AI analysis
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Niche Keywords ({specialty.nicheKeywords.length})
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  These keywords were identified across your website content, business profile, and customer reviews.
                </p>
              </div>

              {/* Keywords Grid */}
              <div className="flex flex-wrap gap-2">
                {specialty.nicheKeywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-sm px-3 py-1"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>

              {/* Keyword Stats */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-900 mb-2">
                  Keyword Analysis
                </div>
                <div className="text-sm text-purple-800">
                  Found <strong>{specialty.nicheKeywords.length} specialty keywords</strong> that differentiate
                  your business from generic competitors. These keywords will be used to generate
                  hyper-targeted content.
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligenceDisplay;
