/**
 * Target Customer Page - UVP Flow Step 2
 *
 * Matches MARBA UVP Wizard design pattern with:
 * - Split-screen layout (SuggestionPanel + DropZone)
 * - Customer profile extraction from website
 * - Industry-based suggestions
 * - Drag-and-drop interaction
 *
 * Created: 2025-11-18
 * Updated: 2025-11-18 (Rebuilt to match MARBA UVP wizard pattern)
 */

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuggestionPanel } from '@/components/uvp-wizard/SuggestionPanel';
import { DropZone } from '@/components/uvp-wizard/DropZone';
import { DraggableItem } from '@/components/uvp-wizard/DraggableItem';
import { CompactWizardProgress } from '@/components/uvp-wizard/WizardProgress';
import type { DraggableSuggestion, DropZone as DropZoneType } from '@/types/uvp-wizard';
import type { CustomerProfile } from '@/types/uvp-flow.types';
import { extractTargetCustomer } from '@/services/uvp-extractors/customer-extractor.service';
import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';

interface TargetCustomerPageProps {
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

export function TargetCustomerPage({
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
  progressPercentage = 20,
  className = ''
}: TargetCustomerPageProps) {
  const [suggestions, setSuggestions] = useState<DraggableSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);

  const [dropZone, setDropZone] = useState<DropZoneType>({
    id: 'target-customer-drop-zone',
    accepts: ['customer-segment'],
    items: [],
    is_active: false,
    is_over: false,
    can_drop: false
  });

  const [industryEQ, setIndustryEQ] = useState<any>(null);
  useEffect(() => {
    getIndustryEQ(industry).then(eq => {
      console.log('[TargetCustomerPage] Industry EQ loaded:', eq);
      setIndustryEQ(eq);
    });
  }, [industry]);

  useEffect(() => {
    if (websiteContent.length > 0 && suggestions.length === 0 && !isGenerating) {
      console.log('[TargetCustomerPage] Auto-generating suggestions on mount');
      handleGenerateSuggestions();
    }
  }, [websiteContent]);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);

    try {
      console.log('[TargetCustomerPage] Generating suggestions...');

      const extraction = await extractTargetCustomer(websiteContent, [], [], businessName);

      console.log('[TargetCustomerPage] Extraction complete:', extraction);

      const extractedSuggestions: DraggableSuggestion[] = extraction.profiles.map((profile, index) => ({
        id: `customer-${profile.id || index}`,
        type: 'customer-segment',
        content: profile.statement || '',
        source: 'ai-generated',
        confidence: (profile.confidence?.overall || 0) / 100,
        tags: [
          'target_customer',
          ...(profile.industry ? [`industry:${profile.industry.toLowerCase()}`] : []),
          ...(profile.companySize ? [`size:${profile.companySize.toLowerCase()}`] : []),
          ...(profile.role ? [`role:${profile.role.toLowerCase()}`] : [])
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

      console.log('[TargetCustomerPage] Generated suggestions:', extractedSuggestions.length);

    } catch (error) {
      console.error('[TargetCustomerPage] Failed to generate suggestions:', error);

      const fallbackSuggestions = generateFallbackSuggestions(industry);
      setSuggestions(fallbackSuggestions);
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

    if (eq.typical_company_size) {
      industrySuggestions.push({
        id: `eq-company-${Date.now()}`,
        type: 'customer-segment',
        content: `${eq.typical_company_size} companies in ${industry} looking to ${eq.jtbd_focus === 'emotional' ? 'transform their approach' : 'improve efficiency'}`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['industry_based', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    }

    if (eq.typical_buyer_role) {
      industrySuggestions.push({
        id: `eq-role-${Date.now()}`,
        type: 'customer-segment',
        content: `${eq.typical_buyer_role}s in ${industry} who need to ${eq.purchase_mindset.toLowerCase()}`,
        source: 'industry-profile',
        confidence: 0.7,
        tags: ['industry_based', 'eq_aligned'],
        is_selected: false,
        is_customizable: true
      });
    }

    return industrySuggestions;
  };

  const generateFallbackSuggestions = (industry: string): DraggableSuggestion[] => {
    const fallbacks: DraggableSuggestion[] = [
      {
        id: 'fallback-1',
        type: 'customer-segment',
        content: `[Role/Title] at [Company Size] ${industry || 'companies'} who [specific need or challenge]`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-2',
        type: 'customer-segment',
        content: `${industry || 'Business'} owners or [decision makers] struggling with [specific problem]`,
        source: 'user-custom',
        confidence: 0.5,
        tags: ['template'],
        is_selected: false,
        is_customizable: true
      },
      {
        id: 'fallback-3',
        type: 'customer-segment',
        content: `[Industry] professionals in [role] who want to [desired outcome]`,
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

    if (over && over.id === 'target-customer-drop-zone') {
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
              current_step: 'target-customer',
              completed_steps: ['welcome'],
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
            UVP Step 2 of 6: Target Customer
          </span>
        </div>

        <h2 className="text-2xl font-bold mb-2">Who is Your Target Customer?</h2>
        <p className="text-muted-foreground mb-4">
          Be specific: Industry, company size, role, and the challenge they face
        </p>

        {industryEQ && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>{industryEQ.industry} buyers:</strong> {industryEQ.purchase_mindset}
              {industryEQ.typical_buyer_role && ` Typically ${industryEQ.typical_buyer_role}s.`}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 overflow-hidden">
        <div className="lg:col-span-1 overflow-hidden">
          <SuggestionPanel
            suggestions={suggestions}
            type="customer-segment"
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
              <h3 className="text-sm font-semibold mb-3">Your Target Customer</h3>

              <DropZone
                zone={dropZone}
                onDrop={handleSelectSuggestion}
                onRemove={() => {}}
                onCustomInput={handleCustomInput}
                customValue={inputValue}
                placeholder="Describe your ideal target customer. Be specific about:&#10;&#10;- Industry or sector&#10;- Company size&#10;- Role/title of decision maker&#10;- Specific challenge or need they have&#10;&#10;Examples:&#10;- 'VP of Marketing at mid-sized B2B SaaS companies struggling to generate qualified leads'&#10;- 'Small business owners in healthcare who need to automate patient scheduling'&#10;&#10;The more specific, the better your messaging will be."
                className="flex-1"
              />

              {showWarning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    Please write at least 20 characters for a complete customer profile
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
            <span>Fill in your target customer to continue</span>
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
