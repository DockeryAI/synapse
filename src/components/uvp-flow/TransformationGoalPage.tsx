/**
 * Transformation Goal Page - UVP Flow Step 3
 *
 * Matches MARBA UVP Wizard design pattern with:
 * - Split-screen layout (SuggestionPanel + DropZone)
 * - Industry-based EQ calculator for emotionally-aligned suggestions
 * - Customer quote extraction and transformation analysis
 * - Drag-and-drop interaction
 *
 * Created: 2025-11-18
 * Updated: 2025-11-18 (Rebuilt to match MARBA UVP wizard pattern)
 */

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Brain, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuggestionPanel } from '@/components/uvp-wizard/SuggestionPanel';
import { DropZone } from '@/components/uvp-wizard/DropZone';
import { DraggableItem } from '@/components/uvp-wizard/DraggableItem';
import { CompactWizardProgress } from '@/components/uvp-wizard/WizardProgress';
import type { DraggableSuggestion, DropZone as DropZoneType } from '@/types/uvp-wizard';
import type { TransformationGoal } from '@/types/uvp-flow.types';
import { extractEnhancedTransformations } from '@/services/uvp-extractors/enhanced-transformation-extractor.service';
import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';

interface TransformationGoalPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[]; // Content from different pages
  websiteUrls?: string[]; // URLs for each content piece
  value?: string; // Current transformation goal text
  onChange?: (value: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
}

export function TransformationGoalPage({
  businessName,
  industry = '',
  websiteUrl = '',
  websiteContent = [],
  websiteUrls = [],
  value = '',
  onChange,
  onNext,
  onBack,
  showProgress = true,
  progressPercentage = 40,
  className = ''
}: TransformationGoalPageProps) {
  const [suggestions, setSuggestions] = useState<DraggableSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [eqScore, setEqScore] = useState<{ emotional: number; rational: number; overall: number } | null>(null);

  const [dropZone, setDropZone] = useState<DropZoneType>({
    id: 'transformation-goal-drop-zone',
    accepts: ['problem'],
    items: [],
    is_active: false,
    is_over: false,
    can_drop: false
  });

  // Get EQ profile for this industry
  const [industryEQ, setIndustryEQ] = useState<any>(null);
  useEffect(() => {
    getIndustryEQ(industry).then(eq => {
      console.log('[TransformationGoalPage] Industry EQ loaded:', eq);
      setIndustryEQ(eq);
    });
  }, [industry]);

  // Auto-extract on mount if we have website content
  useEffect(() => {
    if (websiteContent.length > 0 && suggestions.length === 0 && !isGenerating) {
      console.log('[TransformationGoalPage] Auto-generating suggestions on mount');
      handleGenerateSuggestions();
    }
  }, [websiteContent]);

  /**
   * Extract customer quotes from website content
   * Looks for testimonials, reviews, case studies, quote sections
   */
  const extractCustomerQuotes = (content: string[], urls: string[]): CustomerQuoteInput[] => {
    const quotes: CustomerQuoteInput[] = [];

    content.forEach((pageContent, index) => {
      const url = urls[index] || websiteUrl;

      // Look for testimonial sections
      const testimonialPatterns = [
        /<div[^>]*(?:class|id)="[^"]*testimonial[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
        /"([^"]{50,300})"/g, // Quoted text between 50-300 chars
      ];

      testimonialPatterns.forEach(pattern => {
        const matches = pageContent.matchAll(pattern);
        for (const match of matches) {
          const quoteText = match[1]
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

          // Filter out quotes that are too short or look like code/markup
          if (quoteText.length >= 50 && quoteText.length <= 500 && !quoteText.includes('{') && !quoteText.includes('[')) {
            quotes.push({
              text: quoteText,
              source: 'testimonial',
              sourceUrl: url
            });
          }
        }
      });

      // Look for review-like patterns ("I was...", "We went from...", "Before..., now...")
      const transformationPatterns = [
        /(?:I|We|They)\s+(?:was|were|used to|had)\s+[^.!?]{20,200}[.!?]/gi,
        /Before\s+[^,]{10,100},\s+(?:now|today|after)[^.!?]{10,100}[.!?]/gi,
        /(?:went from|transformed from)\s+[^.!?]{20,200}[.!?]/gi,
      ];

      transformationPatterns.forEach(pattern => {
        const matches = pageContent.matchAll(pattern);
        for (const match of matches) {
          const quoteText = match[0]
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (quoteText.length >= 50 && !quoteText.includes('{')) {
            quotes.push({
              text: quoteText,
              source: 'website',
              sourceUrl: url
            });
          }
        }
      });
    });

    // Deduplicate quotes
    const uniqueQuotes = Array.from(
      new Map(quotes.map(q => [q.text, q])).values()
    );

    console.log(`[TransformationGoalPage] Extracted ${uniqueQuotes.length} customer quotes from ${content.length} pages`);

    return uniqueQuotes;
  };

  /**
   * Generate AI suggestions using transformation analyzer + industry EQ
   */
  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);

    try {
      console.log('[TransformationGoalPage] Generating suggestions...');

      // Extract customer quotes from website
      const customerQuotes = extractCustomerQuotes(websiteContent, websiteUrls);

      // Analyze transformation language
      const analysis = await analyzeTransformationLanguage(customerQuotes, businessName);

      console.log('[TransformationGoalPage] Analysis complete:', analysis);

      // Convert analyzed goals to suggestions
      const analyzedSuggestions: DraggableSuggestion[] = analysis.goals.map((goal, index) => ({
        id: `transformation-${goal.id || index}`,
        type: 'problem',
        content: goal.statement || '',
        source: 'ai-generated',
        confidence: (goal.confidence?.overall || 0) / 100,
        tags: [
          'transformation_goal',
          ...(goal.emotionalDrivers || []).slice(0, 2).map(d => `emotional:${d.toLowerCase().replace(/\s+/g, '_')}`),
          ...(goal.functionalDrivers || []).slice(0, 2).map(d => `functional:${d.toLowerCase().replace(/\s+/g, '_')}`)
        ],
        is_selected: false,
        is_customizable: true
      }));

      // Set EQ score from first goal if available
      if (analysis.goals.length > 0 && analysis.goals[0].eqScore) {
        setEqScore(analysis.goals[0].eqScore);
      }

      // Generate additional industry-based suggestions using EQ
      if (industryEQ) {
        const industrySuggestions = generateIndustryBasedSuggestions(
          businessName,
          industry,
          industryEQ,
          analyzedSuggestions
        );
        analyzedSuggestions.push(...industrySuggestions);
      }

      // Sort by confidence
      analyzedSuggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

      setSuggestions(analyzedSuggestions);

      console.log('[TransformationGoalPage] Generated suggestions:', analyzedSuggestions.length);

    } catch (error) {
      console.error('[TransformationGoalPage] Failed to generate suggestions:', error);

      // Fallback: Generate generic industry suggestions
      const fallbackSuggestions = generateFallbackSuggestions(industry, industryEQ);
      setSuggestions(fallbackSuggestions);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate industry-based suggestions using EQ calculator
   */
  const generateIndustryBasedSuggestions = (
    businessName: string,
    industry: string,
    eq: any,
    existingSuggestions: DraggableSuggestion[]
  ): DraggableSuggestion[] => {
    const industrySuggestions: DraggableSuggestion[] = [];

    // Generate emotionally-aligned transformation frameworks based on EQ
    if (eq.jtbd_focus === 'emotional') {
      industrySuggestions.push({
        id: `eq-emotional-${Date.now()}`,
        type: 'problem',
        content: `Transform from feeling ${eq.decision_drivers.fear > 30 ? 'overwhelmed and uncertain' : 'stuck and frustrated'} to confident and empowered in their ${industry} journey`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['emotional_transformation', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    } else if (eq.jtbd_focus === 'functional') {
      industrySuggestions.push({
        id: `eq-functional-${Date.now()}`,
        type: 'problem',
        content: `Go from inefficient, time-consuming ${industry} processes to streamlined, automated operations that deliver measurable results`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['functional_transformation', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    } else if (eq.jtbd_focus === 'social') {
      industrySuggestions.push({
        id: `eq-social-${Date.now()}`,
        type: 'problem',
        content: `Transform from being overlooked to becoming a recognized leader in ${industry}, gaining the respect and status they deserve`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['social_transformation', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    }

    return industrySuggestions;
  };

  /**
   * Generate fallback suggestions when extraction fails
   */
  const generateFallbackSuggestions = (industry: string, eq: any): DraggableSuggestion[] => {
    const fallbacks: DraggableSuggestion[] = [
      {
        id: 'fallback-1',
        type: 'problem',
        content: `Help ${industry || 'customers'} go from [current frustrating state] to [desired transformation], achieving [key outcome] they're seeking`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-2',
        type: 'problem',
        content: `Transform from struggling with [specific problem] to confidently [desired state] with peace of mind and measurable results`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-3',
        type: 'problem',
        content: `Guide clients through the journey from [pain point] to [aspiration], helping them finally achieve what they've been seeking`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      }
    ];

    return fallbacks;
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'transformation-goal-drop-zone') {
      const suggestion = suggestions.find((s) => s.id === active.id);
      if (suggestion) {
        handleSelectSuggestion(suggestion);
      }
    }

    setActiveDragId(null);
  };

  // Handle suggestion selection (drag or click)
  const handleSelectSuggestion = (suggestion: DraggableSuggestion) => {
    const newValue = inputValue
      ? `${inputValue}\n\n${suggestion.content}`
      : suggestion.content;

    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Handle custom input change
  const handleCustomInput = (text: string) => {
    setInputValue(text);
    if (onChange) {
      onChange(text);
    }
  };

  // Get active suggestion for drag overlay
  const activeSuggestion = activeDragId
    ? suggestions.find((s) => s.id === activeDragId)
    : null;

  // Validation
  const isValid = inputValue.length >= 30;
  const showWarning = inputValue.length > 0 && !isValid;
  const canGoNext = isValid;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6">
          <CompactWizardProgress
            progress={{
              current_step: 'customer-problem',
              completed_steps: ['welcome', 'target-customer'],
              total_steps: 8,
              progress_percentage: progressPercentage,
              is_valid: isValid,
              validation_errors: {},
              can_go_back: true,
              can_go_forward: canGoNext,
              can_submit: false
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            UVP Step 3 of 6: Transformation Goal
          </span>
        </div>

        <h2 className="text-2xl font-bold mb-2">What Are They REALLY Trying to Achieve?</h2>
        <p className="text-muted-foreground mb-4">
          Beyond the surface problem, what transformation are they seeking? Is it emotional, functional, or both?
        </p>

        {/* EQ Score Visualization */}
        {eqScore && (
          <Alert>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-600" />
                <span className="text-sm">
                  <strong>Emotional:</strong> {Math.round(eqScore.emotional)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  <strong>Functional:</strong> {Math.round(eqScore.rational)}%
                </span>
              </div>
            </div>
          </Alert>
        )}

        {/* Industry EQ Context */}
        {industryEQ && (
          <Alert className="mt-2">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>{industryEQ.industry} buyers:</strong> {industryEQ.purchase_mindset}
              {industryEQ.jtbd_focus === 'emotional' && ' Focus on transformation and emotional outcomes.'}
              {industryEQ.jtbd_focus === 'functional' && ' Emphasize measurable results and efficiency.'}
              {industryEQ.jtbd_focus === 'social' && ' Highlight status and social outcomes.'}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content Area - Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 overflow-hidden">
        {/* Suggestions Panel - Left Side (1/3) */}
        <div className="lg:col-span-1 overflow-hidden">
          <SuggestionPanel
            suggestions={suggestions}
            type="problem"
            onSelect={handleSelectSuggestion}
            onGenerate={handleGenerateSuggestions}
            isLoading={isGenerating}
            title="AI Suggestions"
            description="Drag suggestions to the right or click to add"
          />
        </div>

        {/* Input Area - Right Side (2/3) */}
        <div className="lg:col-span-2">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col">
              <h3 className="text-sm font-semibold mb-3">Your Transformation Goal</h3>

              <DropZone
                zone={dropZone}
                onDrop={handleSelectSuggestion}
                onRemove={() => {}}
                onCustomInput={handleCustomInput}
                customValue={inputValue}
                placeholder="Describe the transformation your customers are REALLY buying. What do they go from and to?&#10;&#10;Examples:&#10;- 'From feeling overwhelmed by X to confidently achieving Y'&#10;- 'Transform from struggling with X to easily accomplishing Y with peace of mind'&#10;- 'Help clients go from frustrated by X to empowered to Y'&#10;&#10;Think beyond features - what emotional AND functional change are they seeking?"
                className="flex-1"
              />

              {/* Validation Warning */}
              {showWarning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    Please write at least 30 characters for a complete transformation goal
                  </AlertDescription>
                </Alert>
              )}

              {/* Character Count */}
              <div className="mt-4 text-sm text-muted-foreground">
                {inputValue.length} characters (minimum: 30)
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeSuggestion && (
                <DraggableItem
                  suggestion={activeSuggestion}
                  className="shadow-2xl opacity-90"
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!onBack}
          className="min-w-[120px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-sm text-muted-foreground">
          {isValid ? (
            <span className="text-green-600 font-medium">Ready to continue</span>
          ) : (
            <span>Fill in your transformation goal to continue</span>
          )}
        </div>

        <Button
          onClick={onNext}
          disabled={!canGoNext}
          className="min-w-[120px]"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
