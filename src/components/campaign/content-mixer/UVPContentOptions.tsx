/**
 * UVP Content Options Component
 *
 * Phase D - Item #30: Content Mixer UVP Integration
 *
 * Provides UVP-aware content generation options:
 * - Content atomization (1→6 platforms)
 * - Local keyword injection for SMB
 * - Case study generation from reviews
 * - Review response templates
 * - Thought leadership angles for B2B
 *
 * Created: 2025-11-26
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  FileText,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Instagram,
  BookOpen,
  Mail,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  contentSynthesis,
  type ContentPlatform,
  type AtomizedContent,
  type ContentAtomizationResult,
  type LocalKeywordResult,
  type CaseStudyFrameworkResult,
  type ReviewResponse,
  type ThoughtLeadershipResult,
} from '@/services/intelligence/content-synthesis.service';

// Extended type for batch local keywords display
interface LocalKeywordBatchResult {
  results: LocalKeywordResult[];
  totalKeywords: number;
  totalContentIdeas: number;
  generatedAt: Date;
}
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { InsightCard } from '@/components/dashboard/_archived/intelligence-v2/types';
import type { CategorizedInsight } from '@/types/content-mixer.types';

interface UVPContentOptionsProps {
  /** Selected insights from Content Mixer */
  selectedInsights: CategorizedInsight[];
  /** DeepContext for UVP data */
  context: DeepContext | null;
  /** Business segment: SMB Local, SMB Regional, B2B National, B2B Global */
  segment?: 'smb_local' | 'smb_regional' | 'b2b_national' | 'b2b_global';
  /** Callback when content is generated */
  onContentGenerated?: (content: string, platform: ContentPlatform) => void;
}

// Platform icon mapping
const platformIcons: Record<ContentPlatform, React.ElementType> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  blog: BookOpen,
  email: Mail,
  video: Video,
};

// Platform display names
const platformNames: Record<ContentPlatform, string> = {
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  blog: 'Blog',
  email: 'Email',
  video: 'Video Script',
};

export function UVPContentOptions({
  selectedInsights,
  context,
  segment = 'smb_local',
  onContentGenerated,
}: UVPContentOptionsProps) {
  const [activeTab, setActiveTab] = useState<'atomize' | 'local' | 'casestudy' | 'review' | 'thought'>('atomize');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generated content state
  const [atomizedContent, setAtomizedContent] = useState<ContentAtomizationResult[]>([]);
  const [localKeywords, setLocalKeywords] = useState<LocalKeywordBatchResult | null>(null);
  const [caseStudies, setCaseStudies] = useState<CaseStudyFrameworkResult | null>(null);
  const [reviewResponses, setReviewResponses] = useState<ReviewResponse[]>([]);
  const [thoughtLeadership, setThoughtLeadership] = useState<ThoughtLeadershipResult | null>(null);

  // Check if segment is SMB (for local features)
  const isSMB = segment === 'smb_local' || segment === 'smb_regional';
  const isB2B = segment === 'b2b_national' || segment === 'b2b_global';

  // Convert CategorizedInsight to InsightCard format
  const convertToInsightCard = useCallback((insight: CategorizedInsight): InsightCard => {
    return {
      id: insight.id,
      type: insight.category as any,
      title: insight.displayTitle || insight.insight,
      category: insight.dataSource,
      confidence: insight.confidence,
      isTimeSensitive: false,
      description: insight.insight,
    };
  }, []);

  // Handle content atomization (1→6 platforms)
  const handleAtomize = useCallback(async () => {
    if (!context || selectedInsights.length === 0) return;

    setIsLoading(true);
    try {
      const insightCards = selectedInsights.map(convertToInsightCard);
      const results = contentSynthesis.atomizeInsights(insightCards, context);
      setAtomizedContent(results);
    } catch (error) {
      console.error('[UVPContentOptions] Atomization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context, selectedInsights, convertToInsightCard]);

  // Handle local keyword generation
  const handleLocalKeywords = useCallback(async () => {
    if (!context) return;

    setIsLoading(true);
    try {
      // Get services from context
      const services = context.business.uniqueAdvantages || ['services'];
      const results = contentSynthesis.generateLocalKeywordsForServices(services, context);
      // Convert array of results to single result object for display
      setLocalKeywords({
        results,
        totalKeywords: results.reduce((acc, r) => acc + r.keywords.length, 0),
        totalContentIdeas: results.reduce((acc, r) => acc + r.contentIdeas.length, 0),
        generatedAt: new Date(),
      });
    } catch (error) {
      console.error('[UVPContentOptions] Local keyword error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Handle case study generation
  const handleCaseStudies = useCallback(async () => {
    if (!context) return;

    setIsLoading(true);
    try {
      // Get reviews from context (rawDataPoints or mock)
      const reviews = context.rawDataPoints
        ?.filter(dp => dp.source === 'outscraper' || dp.source === 'yelp')
        ?.map(dp => ({
          id: dp.id,
          text: dp.content,
          rating: dp.metadata?.rating || 5,
          customerName: dp.metadata?.author || 'Customer',
          date: dp.createdAt?.toString() || new Date().toISOString(),
          source: dp.source,
        })) || [];

      if (reviews.length > 0) {
        const result = contentSynthesis.generateCaseStudiesFromReviews(reviews, context);
        setCaseStudies(result);
      }
    } catch (error) {
      console.error('[UVPContentOptions] Case study error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Handle review response generation
  const handleReviewResponses = useCallback(async () => {
    if (!context) return;

    setIsLoading(true);
    try {
      // Get reviews needing responses
      const reviews = context.rawDataPoints
        ?.filter(dp => dp.source === 'outscraper' || dp.source === 'yelp')
        ?.slice(0, 3)
        ?.map(dp => ({
          id: dp.id,
          text: dp.content,
          rating: dp.metadata?.rating || 3,
          customerName: dp.metadata?.author || 'Customer',
          date: dp.createdAt?.toString() || new Date().toISOString(),
          source: dp.source,
        })) || [];

      const responses: ReviewResponse[] = [];
      for (const review of reviews) {
        const response = contentSynthesis.generateReviewResponse(review, context);
        responses.push(response);
      }
      setReviewResponses(responses);
    } catch (error) {
      console.error('[UVPContentOptions] Review response error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Handle thought leadership angles
  const handleThoughtLeadership = useCallback(async () => {
    if (!context) return;

    setIsLoading(true);
    try {
      // Get industry trends and data for thought leadership - convert to InsightCard format
      const trends = (context.industry?.trends || []).map((trend: any) => convertToInsightCard({
        id: trend.id || Math.random().toString(),
        category: 'market',
        insight: trend.trend || trend.title || '',
        displayTitle: trend.title || trend.trend || '',
        confidence: trend.confidence || 0.8,
        dataSource: 'industry-trends'
      } as unknown as CategorizedInsight));

      const competitorInsights = (context.competitiveIntel?.opportunities || []).map((opp: any) => convertToInsightCard({
        id: opp.id || Math.random().toString(),
        category: 'competition',
        insight: opp.opportunity || opp.insight || '',
        displayTitle: opp.title || opp.opportunity || '',
        confidence: opp.confidence || 0.8,
        dataSource: 'competitive-intel'
      } as unknown as CategorizedInsight));

      const customerPainPoints = (context.customerPsychology?.unarticulated || []).map((pain: any) => convertToInsightCard({
        id: pain.id || Math.random().toString(),
        category: 'customer',
        insight: pain.need || pain.insight || '',
        displayTitle: pain.title || pain.need || '',
        confidence: pain.confidence || 0.8,
        dataSource: 'customer-psychology'
      } as unknown as CategorizedInsight));

      // Combine all insights into a flat array
      const allInsights = [...trends, ...competitorInsights, ...customerPainPoints];

      const result = contentSynthesis.generateThoughtLeadershipAngles(allInsights, context);
      setThoughtLeadership(result);
    } catch (error) {
      console.error('[UVPContentOptions] Thought leadership error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Copy to clipboard
  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Render atomized content cards
  const renderAtomizedContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Content Atomization</h3>
          <p className="text-xs text-gray-500">Transform 1 insight into 6 platform-optimized variations</p>
        </div>
        <Button
          size="sm"
          onClick={handleAtomize}
          disabled={isLoading || selectedInsights.length === 0}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Atomize
        </Button>
      </div>

      {atomizedContent.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select insights and click Atomize to generate platform content</p>
        </div>
      )}

      {atomizedContent.map((result, idx) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-purple-600 mb-2">
            From: {result.sourceInsight.title}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {result.atoms.map((atom, atomIdx) => {
              const Icon = platformIcons[atom.platform];
              return (
                <div
                  key={atomIdx}
                  className="bg-gray-50 rounded-lg p-3 text-xs relative group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{platformNames[atom.platform]}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {atom.characterCount} chars
                    </Badge>
                  </div>
                  <p className="text-gray-700 line-clamp-3">{atom.content}</p>
                  <button
                    onClick={() => handleCopy(atom.content, `${idx}-${atomIdx}`)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedId === `${idx}-${atomIdx}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Render local keywords (SMB only)
  const renderLocalKeywords = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Local SEO Keywords</h3>
          <p className="text-xs text-gray-500">Generate "near me" and location-based keywords</p>
        </div>
        <Button
          size="sm"
          onClick={handleLocalKeywords}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>

      {!localKeywords && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Generate local keywords for your services</p>
        </div>
      )}

      {localKeywords && (
        <div className="space-y-4">
          {localKeywords.results.map((result, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">{result.service}</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {result.keywords.map((kw, kwIdx) => (
                  <Badge
                    key={kwIdx}
                    variant={kw.intent === 'high' ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => handleCopy(kw.keyword, `kw-${idx}-${kwIdx}`)}
                  >
                    {kw.keyword}
                    {copiedId === `kw-${idx}-${kwIdx}` && <Check className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}
              </div>
              {result.contentIdeas.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Content Ideas:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {result.contentIdeas.slice(0, 3).map((idea, ideaIdx) => (
                      <li key={ideaIdx}>• {idea.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render case studies
  const renderCaseStudies = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Case Studies from Reviews</h3>
          <p className="text-xs text-gray-500">Transform 5-star reviews into mini case studies</p>
        </div>
        <Button
          size="sm"
          onClick={handleCaseStudies}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>

      {!caseStudies && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Generate case studies from customer reviews</p>
        </div>
      )}

      {caseStudies && caseStudies.caseStudies.map((study, idx) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">{study.title}</h4>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-red-50 rounded p-2">
              <span className="font-medium text-red-700">Challenge:</span>
              <p className="text-gray-700 mt-1">{study.challenge}</p>
            </div>
            <div className="bg-blue-50 rounded p-2">
              <span className="font-medium text-blue-700">Solution:</span>
              <p className="text-gray-700 mt-1">{study.solution}</p>
            </div>
            <div className="bg-green-50 rounded p-2">
              <span className="font-medium text-green-700">Result:</span>
              <p className="text-gray-700 mt-1">{study.result}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-2 text-xs italic">
            "{study.quote}"
          </div>
        </div>
      ))}
    </div>
  );

  // Render review responses
  const renderReviewResponses = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Review Response Templates</h3>
          <p className="text-xs text-gray-500">Generate personalized responses to customer reviews</p>
        </div>
        <Button
          size="sm"
          onClick={handleReviewResponses}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>

      {reviewResponses.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Generate professional review responses</p>
        </div>
      )}

      {reviewResponses.map((response, idx) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={
              response.sentiment === 'positive' ? 'default' :
              response.sentiment === 'neutral' ? 'secondary' : 'destructive'
            }>
              {response.sentiment}
            </Badge>
            <Badge variant="outline">{response.tone}</Badge>
          </div>
          <div className="bg-gray-50 rounded p-3 text-sm relative group">
            {response.response}
            <button
              onClick={() => handleCopy(response.response, `review-${idx}`)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copiedId === `review-${idx}` ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {response.alternativeResponses.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                +{response.alternativeResponses.length} alternatives
              </summary>
              <div className="mt-2 space-y-2">
                {response.alternativeResponses.map((alt, altIdx) => (
                  <div key={altIdx} className="bg-gray-50 rounded p-2 relative group">
                    {alt}
                    <button
                      onClick={() => handleCopy(alt, `review-${idx}-alt-${altIdx}`)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedId === `review-${idx}-alt-${altIdx}` ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );

  // Render thought leadership (B2B only)
  const renderThoughtLeadership = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Thought Leadership Angles</h3>
          <p className="text-xs text-gray-500">Executive-level content angles from industry data</p>
        </div>
        <Button
          size="sm"
          onClick={handleThoughtLeadership}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>

      {!thoughtLeadership && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Generate thought leadership content angles</p>
        </div>
      )}

      {thoughtLeadership && thoughtLeadership.angles.map((angle, idx) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {angle.type.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-gray-500">
              Confidence: {Math.round(angle.confidence * 100)}%
            </span>
          </div>
          <h4 className="font-medium text-gray-900">{angle.title}</h4>
          <p className="text-sm text-gray-700">{angle.hook}</p>
          <div className="flex flex-wrap gap-2">
            {angle.supportingPoints.slice(0, 3).map((point, pointIdx) => (
              <Badge key={pointIdx} variant="secondary" className="text-xs">
                {point}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Target: {angle.targetAudience}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          UVP Content Tools
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Phase C content multiplication powered by your UVP
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 py-2 bg-gray-50 border-b">
          <TabsTrigger value="atomize" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Atomize
          </TabsTrigger>
          {isSMB && (
            <TabsTrigger value="local" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Local SEO
            </TabsTrigger>
          )}
          <TabsTrigger value="casestudy" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Case Studies
          </TabsTrigger>
          <TabsTrigger value="review" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            Reviews
          </TabsTrigger>
          {isB2B && (
            <TabsTrigger value="thought" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Thought Leadership
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="atomize" className="m-0">
            {renderAtomizedContent()}
          </TabsContent>
          {isSMB && (
            <TabsContent value="local" className="m-0">
              {renderLocalKeywords()}
            </TabsContent>
          )}
          <TabsContent value="casestudy" className="m-0">
            {renderCaseStudies()}
          </TabsContent>
          <TabsContent value="review" className="m-0">
            {renderReviewResponses()}
          </TabsContent>
          {isB2B && (
            <TabsContent value="thought" className="m-0">
              {renderThoughtLeadership()}
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Context Status */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {selectedInsights.length} insight{selectedInsights.length !== 1 ? 's' : ''} selected
          </span>
          <Badge variant={context ? 'default' : 'secondary'} className="text-[10px]">
            {context ? 'UVP Connected' : 'No UVP Data'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default UVPContentOptions;
