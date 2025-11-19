/**
 * Unique Solution Page - UVP Flow Step 4
 *
 * Matches MARBA UVP Wizard design pattern with:
 * - Split-screen layout (SuggestionPanel + DropZone)
 * - Industry-based EQ calculator for emotionally-aligned suggestions
 * - Differentiator extraction from website
 * - Drag-and-drop interaction
 *
 * Created: 2025-11-18
 * Updated: 2025-11-18 (Match UVP wizard pattern)
 */

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Info, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuggestionPanel } from '@/components/uvp-wizard/SuggestionPanel';
import { DropZone } from '@/components/uvp-wizard/DropZone';
import { DraggableItem } from '@/components/uvp-wizard/DraggableItem';
import { CompactWizardProgress } from '@/components/uvp-wizard/WizardProgress';
import type { DraggableSuggestion, DropZone as DropZoneType } from '@/types/uvp-wizard';
import type { UniqueSolution } from '@/types/uvp-flow.types';
import { extractDifferentiators } from '@/services/uvp-extractors/differentiator-extractor.service';
import { getIndustryEQ, adjustSuggestionPrompt } from '@/services/uvp-wizard/emotional-quotient';

interface UniqueSolutionPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[]; // Content from different pages
  websiteUrls?: string[]; // URLs for each content piece
  competitorInfo?: string[];
  value?: string; // Current unique solution text
  onChange?: (value: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
}

export function UniqueSolutionPage({
  businessName,
  industry = '',
  websiteUrl = '',
  websiteContent = [],
  websiteUrls = [],
  competitorInfo = [],
  value = '',
  onChange,
  onNext,
  onBack,
  showProgress = true,
  progressPercentage = 60,
  className = ''
}: UniqueSolutionPageProps) {
  const [suggestions, setSuggestions] = useState<DraggableSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);

  const [dropZone, setDropZone] = useState<DropZoneType>({
    id: 'unique-solution-drop-zone',
    accepts: ['solution'],
    items: [],
    is_active: false,
    is_over: false,
    can_drop: false
  });

  // Get EQ profile for this industry
  const [industryEQ, setIndustryEQ] = useState<any>(null);
  useEffect(() => {
    getIndustryEQ(industry).then(eq => {
      console.log('[UniqueSolutionPage] Industry EQ loaded:', eq);
      setIndustryEQ(eq);
    });
  }, [industry]);

  // Auto-extract on mount if we have website content
  useEffect(() => {
    if (websiteContent.length > 0 && suggestions.length === 0 && !isGenerating) {
      console.log('[UniqueSolutionPage] Auto-generating suggestions on mount');
      handleGenerateSuggestions();
    }
  }, [websiteContent]);

  /**
   * Generate AI suggestions using differentiator extractor + industry EQ
   */
  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);

    try {
      console.log('[UniqueSolutionPage] Generating suggestions...');

      // Extract differentiators from website
      const extraction = await extractDifferentiators(
        websiteContent,
        websiteUrls,
        competitorInfo,
        businessName
      );

      console.log('[UniqueSolutionPage] Extracted differentiators:', extraction);

      // Convert extracted differentiators to suggestions
      const extractedSuggestions: DraggableSuggestion[] = extraction.differentiators.map((diff, index) => ({
        id: `diff-${diff.id || index}`,
        type: 'solution',
        content: diff.statement,
        source: 'ai-generated',
        confidence: diff.strengthScore / 100, // Convert 0-100 to 0-1
        tags: ['differentiator', `strength-${diff.strengthScore}`],
        is_selected: false,
        is_customizable: true
      }));

      // Add methodology as a suggestion if present
      if (extraction.methodology) {
        extractedSuggestions.push({
          id: `methodology-${Date.now()}`,
          type: 'solution',
          content: extraction.methodology,
          source: 'ai-generated',
          confidence: 0.85,
          tags: ['methodology'],
          is_selected: false,
          is_customizable: true
        });
      }

      // Add proprietary approach as a suggestion if present
      if (extraction.proprietaryApproach) {
        extractedSuggestions.push({
          id: `proprietary-${Date.now()}`,
          type: 'solution',
          content: extraction.proprietaryApproach,
          source: 'ai-generated',
          confidence: 0.9,
          tags: ['proprietary_approach'],
          is_selected: false,
          is_customizable: true
        });
      }

      // Generate additional industry-based suggestions using EQ
      if (industryEQ) {
        const industrySuggestions = await generateIndustryBasedSuggestions(
          businessName,
          industry,
          industryEQ,
          extractedSuggestions
        );
        extractedSuggestions.push(...industrySuggestions);
      }

      // Sort by confidence
      extractedSuggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

      setSuggestions(extractedSuggestions);

      console.log('[UniqueSolutionPage] Generated suggestions:', extractedSuggestions.length);

    } catch (error) {
      console.error('[UniqueSolutionPage] Failed to generate suggestions:', error);

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
  const generateIndustryBasedSuggestions = async (
    businessName: string,
    industry: string,
    eq: any,
    existingSuggestions: DraggableSuggestion[]
  ): Promise<DraggableSuggestion[]> => {
    const industrySuggestions: DraggableSuggestion[] = [];

    // Generate emotionally-aligned solution frameworks based on EQ
    if (eq.jtbd_focus === 'emotional') {
      industrySuggestions.push({
        id: `eq-emotional-${Date.now()}`,
        type: 'solution',
        content: `We guide ${industry} clients through a transformational journey that addresses their deepest ${eq.decision_drivers.fear > 30 ? 'fears and concerns' : 'aspirations'}, delivering lasting change they can feel.`,
        source: 'industry-profile',
        confidence: 0.75,
        tags: ['emotional_approach', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    } else if (eq.jtbd_focus === 'functional') {
      industrySuggestions.push({
        id: `eq-functional-${Date.now()}`,
        type: 'solution',
        content: `Our proven methodology delivers measurable ${industry} results through a systematic approach that eliminates guesswork and accelerates outcomes.`,
        source: 'industry-profile',
        confidence: 0.75,
        tags: ['functional_approach', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    } else if (eq.jtbd_focus === 'social') {
      industrySuggestions.push({
        id: `eq-social-${Date.now()}`,
        type: 'solution',
        content: `We help ${industry} clients achieve recognition and belonging through a unique approach that elevates their status and strengthens their identity.`,
        source: 'industry-profile',
        confidence: 0.75,
        tags: ['social_approach', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    }

    // Add urgency-based differentiator if industry has high urgency
    if (eq.decision_drivers.urgency > 15) {
      industrySuggestions.push({
        id: `eq-urgency-${Date.now()}`,
        type: 'solution',
        content: `Unlike traditional ${industry} providers, we deliver rapid results through streamlined processes and dedicated resources that respond to your timeline.`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['urgency_differentiator', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    }

    // Add trust-based differentiator if industry values trust highly
    if (eq.decision_drivers.trust > 25) {
      industrySuggestions.push({
        id: `eq-trust-${Date.now()}`,
        type: 'solution',
        content: `Our transparent process and proven track record in ${industry} gives clients confidence and peace of mind throughout their journey.`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['trust_differentiator', 'eq_aligned'],
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
        type: 'solution',
        content: `Unlike other ${industry || 'providers'}, we combine [unique element] with [unique element] to deliver [specific outcome].`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-2',
        type: 'solution',
        content: `Our proprietary [process/method name] ensures [key benefit] in half the time of traditional approaches.`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-3',
        type: 'solution',
        content: `We're the only ${industry || 'provider'} that [unique capability] while [additional differentator].`,
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

    if (over && over.id === 'unique-solution-drop-zone') {
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
              current_step: 'unique-solution',
              completed_steps: ['welcome', 'target-customer', 'customer-problem'],
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
        <h2 className="text-2xl font-bold mb-2">How Do You Solve It Differently?</h2>
        <p className="text-muted-foreground mb-4">
          What's your unique approach, methodology, or proprietary process that sets you apart from alternatives?
        </p>

        {/* Industry EQ Context */}
        {industryEQ && (
          <Alert>
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
            type="solution"
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
              <h3 className="text-sm font-semibold mb-3">Your Unique Solution</h3>

              <DropZone
                zone={dropZone}
                onDrop={handleSelectSuggestion}
                onRemove={() => {}}
                onCustomInput={handleCustomInput}
                customValue={inputValue}
                placeholder="Describe your unique approach, methodology, or proprietary process. What makes your solution different from alternatives?&#10;&#10;Examples:&#10;- 'Our proprietary 5-Step Framework combines X, Y, and Z...'&#10;- 'Unlike traditional approaches, we...'&#10;- 'We're the only provider that...'&#10;&#10;Be specific about HOW you solve the problem differently."
                className="flex-1"
              />

              {/* Validation Warning */}
              {showWarning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    Please write at least 30 characters for a complete unique solution
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
            <span>Fill in your unique solution to continue</span>
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
