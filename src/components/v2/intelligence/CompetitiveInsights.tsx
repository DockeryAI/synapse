/**
 * Competitive Insights Component
 *
 * Displays competitive analysis results including:
 * - Differentiation score
 * - Competitor themes comparison
 * - White space opportunities
 * - Content gaps
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CompetitiveAnalysisReport,
  WhiteSpaceOpportunity,
  ContentGap,
  ExtractedTheme,
  ThemeCluster,
} from '@/types/v2/competitive.types';
import { competitiveAnalyzerService } from '@/services/v2/intelligence/competitive-analyzer.service';

interface CompetitiveInsightsProps {
  brandId: string;
  brandUrl: string;
  competitors?: Array<{ id: string; name: string; url: string }>;
  onAnalysisComplete?: (report: CompetitiveAnalysisReport) => void;
}

export function CompetitiveInsights({
  brandId,
  brandUrl,
  competitors = [],
  onAnalysisComplete,
}: CompetitiveInsightsProps) {
  const [report, setReport] = useState<CompetitiveAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brandId && brandUrl && competitors.length > 0) {
      runAnalysis();
    }
  }, [brandId, brandUrl, competitors]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await competitiveAnalyzerService.analyzeCompetitors({
        brandId,
        brandUrl,
        competitors,
      });

      setReport(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="text-muted-foreground">Analyzing competitors...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <button
              onClick={runAnalysis}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Retry Analysis
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Add competitors to analyze your competitive landscape
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Differentiation Score */}
      <DifferentiationScoreCard score={report.differentiationScore} />

      {/* Tabs for different views */}
      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="whitespace">White Space</TabsTrigger>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-4">
          <ThemeComparison themes={report.themes} />
        </TabsContent>

        <TabsContent value="whitespace" className="space-y-4">
          <WhiteSpaceList opportunities={report.whiteSpaces} />
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <ContentGapList gaps={report.contentGaps} />
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <ThemeClusterList clusters={report.clusters} />
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <SummaryCard summary={report.summary} />
    </div>
  );
}

/**
 * Differentiation Score Card
 */
function DifferentiationScoreCard({
  score,
}: {
  score: CompetitiveAnalysisReport['differentiationScore'];
}) {
  const getScoreColor = (value: number) => {
    if (value >= 70) return 'text-green-500';
    if (value >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Differentiation Score</span>
          <span className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}
          </span>
        </CardTitle>
        <CardDescription>
          How unique your messaging is compared to competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Breakdown */}
        <div className="space-y-3">
          <ScoreBreakdownItem
            label="Unique Themes"
            value={score.breakdown.uniqueThemes}
            color={getProgressColor(score.breakdown.uniqueThemes)}
          />
          <ScoreBreakdownItem
            label="Messaging Clarity"
            value={score.breakdown.messagingClarity}
            color={getProgressColor(score.breakdown.messagingClarity)}
          />
          <ScoreBreakdownItem
            label="Value Proposition"
            value={score.breakdown.valueProposition}
            color={getProgressColor(score.breakdown.valueProposition)}
          />
          <ScoreBreakdownItem
            label="Content Quality"
            value={score.breakdown.contentQuality}
            color={getProgressColor(score.breakdown.contentQuality)}
          />
          <ScoreBreakdownItem
            label="Brand Voice"
            value={score.breakdown.brandVoice}
            color={getProgressColor(score.breakdown.brandVoice)}
          />
        </div>

        {/* Strengths, Weaknesses, Opportunities */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <h4 className="text-sm font-semibold text-green-600 mb-2">Strengths</h4>
            <ul className="text-sm space-y-1">
              {score.strengths.map((s, i) => (
                <li key={i} className="text-muted-foreground">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-red-600 mb-2">Weaknesses</h4>
            <ul className="text-sm space-y-1">
              {score.weaknesses.map((w, i) => (
                <li key={i} className="text-muted-foreground">
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-600 mb-2">Opportunities</h4>
            <ul className="text-sm space-y-1">
              {score.opportunities.map((o, i) => (
                <li key={i} className="text-muted-foreground">
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Score Breakdown Item
 */
function ScoreBreakdownItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Theme Comparison Component
 */
function ThemeComparison({
  themes,
}: {
  themes: CompetitiveAnalysisReport['themes'];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Your Themes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Themes</CardTitle>
          <CardDescription>{themes.yours.length} themes identified</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {themes.yours.slice(0, 15).map((theme) => (
              <ThemeBadge key={theme.id} theme={theme} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Themes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Competitor Themes</CardTitle>
          <CardDescription>
            {themes.competitors.length} themes across competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {themes.competitors.slice(0, 15).map((theme) => (
              <ThemeBadge key={theme.id} theme={theme} variant="secondary" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unique Themes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-600">Your Unique Themes</CardTitle>
          <CardDescription>
            Only you are talking about these
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {themes.unique.slice(0, 10).map((theme) => (
              <ThemeBadge key={theme.id} theme={theme} variant="success" />
            ))}
            {themes.unique.length === 0 && (
              <span className="text-sm text-muted-foreground">
                No unique themes found
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Common Themes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-orange-600">Common Ground</CardTitle>
          <CardDescription>
            Themes you share with competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {themes.common.slice(0, 10).map((theme) => (
              <ThemeBadge key={theme.id} theme={theme} variant="warning" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Theme Badge Component
 */
function ThemeBadge({
  theme,
  variant = 'default',
}: {
  theme: ExtractedTheme;
  variant?: 'default' | 'secondary' | 'success' | 'warning';
}) {
  return (
    <Badge variant={variant} className="cursor-default" title={`Frequency: ${theme.frequency}`}>
      {theme.theme}
      {theme.frequency > 1 && (
        <span className="ml-1 opacity-70">({theme.frequency})</span>
      )}
    </Badge>
  );
}

/**
 * White Space Opportunities List
 */
function WhiteSpaceList({
  opportunities,
}: {
  opportunities: WhiteSpaceOpportunity[];
}) {
  const priorityColors = {
    high: 'border-green-500 bg-green-50 dark:bg-green-900/10',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    low: 'border-gray-500 bg-gray-50 dark:bg-gray-900/10',
  };

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No white space opportunities identified
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opp) => (
        <Card key={opp.id} className={`border-l-4 ${priorityColors[opp.priority]}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{opp.area}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={opp.priority === 'high' ? 'success' : opp.priority === 'medium' ? 'warning' : 'secondary'}>
                  {opp.priority}
                </Badge>
                <span className="text-sm font-semibold text-primary">
                  Score: {opp.opportunityScore}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{opp.description}</p>

            <div>
              <h4 className="text-sm font-semibold mb-1">Suggested Angle</h4>
              <p className="text-sm text-primary">{opp.suggestedAngle}</p>
            </div>

            <div className="flex flex-wrap gap-1">
              {opp.keywords.map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>

            {opp.competitorGap.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Missing from: {opp.competitorGap.join(', ')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Content Gaps List
 */
function ContentGapList({ gaps }: { gaps: ContentGap[] }) {
  const impactColors = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-gray-500',
  };

  const gapTypeLabels = {
    missing: 'Missing',
    underutilized: 'Underutilized',
    opportunity: 'Opportunity',
  };

  if (gaps.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No content gaps identified
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {gaps.map((gap) => (
            <div key={gap.id} className="p-4 hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{gap.theme}</span>
                    <Badge variant="outline" className="text-xs">
                      {gapTypeLabels[gap.gapType]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {gap.recommendation}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Competitor usage: {gap.competitorUsage}%</span>
                    <span>
                      Your usage:{' '}
                      <span className={gap.yourUsage ? 'text-green-500' : 'text-red-500'}>
                        {gap.yourUsage ? 'Yes' : 'No'}
                      </span>
                    </span>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${impactColors[gap.impact]}`}>
                  {gap.impact.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Theme Clusters List
 */
function ThemeClusterList({ clusters }: { clusters: ThemeCluster[] }) {
  if (clusters.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No theme clusters identified
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {clusters.slice(0, 10).map((cluster) => (
        <Card key={cluster.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{cluster.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Freq: {cluster.totalFrequency}</span>
                {cluster.competitorCoverage > 0 && (
                  <span>Coverage: {Math.round(cluster.competitorCoverage)}%</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {cluster.themes.map((theme) => (
                <Badge key={theme.id} variant="secondary">
                  {theme.theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Summary Card
 */
function SummaryCard({
  summary,
}: {
  summary: CompetitiveAnalysisReport['summary'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.totalCompetitors}
            </div>
            <div className="text-sm text-muted-foreground">Competitors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.totalContent}
            </div>
            <div className="text-sm text-muted-foreground">Content Pages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.yourThemeCount}
            </div>
            <div className="text-sm text-muted-foreground">Your Themes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {summary.uniqueThemePercentage}%
            </div>
            <div className="text-sm text-muted-foreground">Unique</div>
          </div>
        </div>

        {summary.topOpportunities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Top Opportunities</h4>
            <ul className="space-y-1">
              {summary.topOpportunities.map((opp, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-primary">•</span>
                  {opp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CompetitiveInsights;
