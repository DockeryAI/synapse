/**
 * Key Benefit Page - UVP Flow Step 5
 *
 * Matches MARBA UVP Wizard design pattern with:
 * - Split-screen layout (SuggestionPanel + DropZone)
 * - Benefit extraction from website
 * - Industry-based EQ recommendations
 * - Drag-and-drop interaction
 *
 * Created: 2025-11-18
 * Updated: 2025-11-18 (Rebuilt to match MARBA UVP wizard pattern)
 */

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, TrendingUp, Lightbulb, Sparkles, Heart, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuggestionPanel } from '@/components/uvp-wizard/SuggestionPanel';
import { DropZone } from '@/components/uvp-wizard/DropZone';
import { DraggableItem } from '@/components/uvp-wizard/DraggableItem';
import { CompactWizardProgress } from '@/components/uvp-wizard/WizardProgress';
import type { DraggableSuggestion, DropZone as DropZoneType } from '@/types/uvp-wizard';
import type { KeyBenefit } from '@/types/uvp-flow.types';
import { extractEnhancedBenefits } from '@/services/uvp-extractors/enhanced-benefit-extractor.service';
import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';

interface KeyBenefitPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[];
  websiteUrls?: string[];
  value?: string;
  onChange?: (value: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
}

export function KeyBenefitPage({
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
  progressPercentage = 80,
  className = ''
}: KeyBenefitPageProps) {
  const [suggestions, setSuggestions] = useState<DraggableSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [eqRecommendation, setEqRecommendation] = useState<'emotional' | 'rational' | 'balanced'>('balanced');

  const [dropZone, setDropZone] = useState<DropZoneType>({
    id: 'key-benefit-drop-zone',
    accepts: ['benefit'],
    items: [],
    is_active: false,
    is_over: false,
    can_drop: false
  });

  const [industryEQ, setIndustryEQ] = useState<any>(null);
  useEffect(() => {
    getIndustryEQ(industry).then(eq => {
      console.log('[KeyBenefitPage] Industry EQ loaded:', eq);
      setIndustryEQ(eq);

      if (eq.emotional_weight > 60) {
        setEqRecommendation('emotional');
      } else if (eq.emotional_weight < 40) {
        setEqRecommendation('rational');
      } else {
        setEqRecommendation('balanced');
      }
    });
  }, [industry]);

  useEffect(() => {
    if (websiteContent.length > 0 && suggestions.length === 0 && !isGenerating) {
      console.log('[KeyBenefitPage] Auto-generating suggestions on mount');
      handleGenerateSuggestions();
    }
  }, [websiteContent]);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);

    try {
      console.log('[KeyBenefitPage] Generating suggestions with enhanced extractor...');

      const extraction = await extractEnhancedBenefits(
        websiteContent,
        businessName,
        industry
      );

      console.log('[KeyBenefitPage] Extraction complete:', extraction);

      const extractedSuggestions: DraggableSuggestion[] = extraction.benefits.map((benefit, index) => ({
        id: `benefit-${benefit.id || index}`,
        type: 'benefit',
        content: benefit.statement || '',
        source: 'ai-generated',
        confidence: (benefit.confidence?.overall || 0) / 100,
        tags: [
          'key_benefit',
          benefit.outcomeType || 'mixed',
          ...(benefit.metrics && benefit.metrics.length > 0 ? ['has_metrics'] : [])
        ],
        is_selected: false,
        is_customizable: true
      }));

      if (industryEQ) {
        const industrySuggestions = generateIndustryBasedSuggestions(businessName, industry, industryEQ);
        extractedSuggestions.push(...industrySuggestions);
      }

      extractedSuggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

      setSuggestions(extractedSuggestions);

      console.log('[KeyBenefitPage] Generated suggestions:', extractedSuggestions.length);

    } catch (error) {
      console.error('[KeyBenefitPage] Failed to generate suggestions:', error);

      // No template fallbacks - only show real extraction + industry data
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIndustryBasedSuggestions = (
    businessName: string,
    industry: string,
    eq: any
  ): DraggableSuggestion[] => {
    const industrySuggestions: DraggableSuggestion[] = [];

    if (eq.jtbd_focus === 'emotional') {
      industrySuggestions.push({
        id: `eq-emotional-${Date.now()}`,
        type: 'benefit',
        content: `Experience ${eq.decision_drivers.fear > 30 ? 'peace of mind and confidence' : 'transformational results'} in your ${industry} operations`,
        source: 'industry-profile',
        confidence: 0.75,
        tags: ['emotional_benefit', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    } else if (eq.jtbd_focus === 'functional') {
      industrySuggestions.push({
        id: `eq-functional-${Date.now()}`,
        type: 'benefit',
        content: `Achieve measurable ${industry} improvements with proven ROI and efficiency gains`,
        source: 'industry-profile',
        confidence: 0.75,
        tags: ['functional_benefit', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    } else if (eq.jtbd_focus === 'social') {
      industrySuggestions.push({
        id: `eq-social-${Date.now()}`,
        type: 'benefit',
        content: `Elevate your position as a ${industry} leader and gain recognition in your market`,
        source: 'industry-profile',
        confidence: 0.75,
        tags: ['social_benefit', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    }

    if (eq.decision_drivers.urgency > 15) {
      industrySuggestions.push({
        id: `eq-urgency-${Date.now()}`,
        type: 'benefit',
        content: `Get results fast - achieve your ${industry} goals in record time with our accelerated approach`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['urgency_benefit', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    }

    return industrySuggestions;
  };

  const generateFallbackSuggestions = (industry: string, eqRec: 'emotional' | 'rational' | 'balanced'): DraggableSuggestion[] => {
    const fallbacks: DraggableSuggestion[] = [
      {
        id: 'fallback-1',
        type: 'benefit',
        content: eqRec === 'emotional'
          ? `Experience [emotional outcome] and [transformation] in your ${industry || 'business'}`
          : `Achieve [measurable outcome] and [X% improvement] in ${industry || 'business'} performance`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-2',
        type: 'benefit',
        content: `[Quantifiable metric] improvement in [timeframe] with proven ${industry || 'business'} results`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-3',
        type: 'benefit',
        content: `Save [time/money/resources] while achieving [desired outcome] in your ${industry || 'business'}`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      }
    ];

    return fallbacks;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'key-benefit-drop-zone') {
      const suggestion = suggestions.find((s) => s.id === active.id);
      if (suggestion) {
        handleSelectSuggestion(suggestion);
      }
    }

    setActiveDragId(null);
  };

  const handleSelectSuggestion = (suggestion: DraggableSuggestion) => {
    const newValue = inputValue
      ? `${inputValue}\n\n${suggestion.content}`
      : suggestion.content;

    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleCustomInput = (text: string) => {
    setInputValue(text);
    if (onChange) {
      onChange(text);
    }
  };

  const activeSuggestion = activeDragId
    ? suggestions.find((s) => s.id === activeDragId)
    : null;

  const isValid = inputValue.length >= 20;
  const showWarning = inputValue.length > 0 && !isValid;
  const canGoNext = isValid;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showProgress && (
        <div className="mb-6">
          <CompactWizardProgress
            progress={{
              current_step: 'key-benefit',
              completed_steps: ['welcome', 'target-customer', 'customer-problem', 'unique-solution'],
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

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            UVP Step 5 of 6: Key Benefit
          </span>
        </div>

        <h2 className="text-2xl font-bold mb-2">What's the Key Benefit?</h2>
        <p className="text-muted-foreground mb-4">
          What's the primary outcome or transformation your customers will experience?
        </p>

        {industryEQ && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm flex items-center gap-2">
              <strong>Recommendation:</strong>
              {eqRecommendation === 'emotional' && (
                <>
                  <Heart className="h-3 w-3 text-pink-600" />
                  Lead with emotional benefits for {industry} buyers
                </>
              )}
              {eqRecommendation === 'rational' && (
                <>
                  <Brain className="h-3 w-3 text-blue-600" />
                  Lead with measurable outcomes for {industry} buyers
                </>
              )}
              {eqRecommendation === 'balanced' && (
                <>
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                  Balance emotional and rational benefits for {industry} buyers
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 overflow-hidden">
        <div className="lg:col-span-1 overflow-hidden">
          <SuggestionPanel
            suggestions={suggestions}
            type="benefit"
            onSelect={handleSelectSuggestion}
            onGenerate={handleGenerateSuggestions}
            isLoading={isGenerating}
            title="AI Suggestions"
            description="Drag suggestions to the right or click to add"
          />
        </div>

        <div className="lg:col-span-2">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col">
              <h3 className="text-sm font-semibold mb-3">Your Key Benefit</h3>

              <DropZone
                zone={dropZone}
                onDrop={handleSelectSuggestion}
                onRemove={() => {}}
                onCustomInput={handleCustomInput}
                customValue={inputValue}
                placeholder="Describe the primary benefit or outcome your customers will experience:&#10;&#10;- What measurable results will they achieve?&#10;- What emotional transformation will they feel?&#10;- How will their situation improve?&#10;&#10;Examples:&#10;- '40% increase in qualified leads within 90 days'&#10;- 'Experience peace of mind knowing your operations run smoothly'&#10;- 'Save 15+ hours per week while improving quality'&#10;&#10;Be specific and compelling - this is what they're really buying."
                className="flex-1"
              />

              {showWarning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    Please write at least 20 characters for a complete key benefit
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4 text-sm text-muted-foreground">
                {inputValue.length} characters (minimum: 20)
              </div>
            </div>

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
            <span>Fill in your key benefit to continue</span>
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
