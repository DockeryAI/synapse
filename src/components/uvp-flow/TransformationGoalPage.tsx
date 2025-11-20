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
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Brain, Lightbulb, Sparkles, Plus, X } from 'lucide-react';
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
import { industryRegistry } from '@/data/industries';

interface TransformationGoalPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[]; // Content from different pages
  websiteUrls?: string[]; // URLs for each content piece
  preloadedData?: any; // Pre-loaded extraction data from parent
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
  preloadedData,
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransformationGoal, setNewTransformationGoal] = useState('');

  // Multi-select state
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

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
    // If we have pre-loaded data, use it immediately
    if (preloadedData && suggestions.length === 0) {
      console.log('[TransformationGoalPage] Using pre-loaded data');
      const extractedSuggestions = convertExtractionToSuggestions(preloadedData);
      setSuggestions(extractedSuggestions);
      return;
    }

    // Otherwise, auto-generate on mount if we have website content
    if (websiteContent.length > 0 && suggestions.length === 0 && !isGenerating) {
      console.log('[TransformationGoalPage] Auto-generating suggestions on mount');
      handleGenerateSuggestions();
    }
  }, [websiteContent, preloadedData]);

  // Helper to convert extraction data to suggestions
  const convertExtractionToSuggestions = (extraction: any): DraggableSuggestion[] => {
    if (!extraction || !extraction.transformations || extraction.transformations.length === 0) {
      console.warn('[TransformationGoalPage] No transformations in extraction, using fallback');
      return generateFallbackSuggestions(industry, industryEQ);
    }

    // Convert transformations to suggestions
    const analyzedSuggestions: DraggableSuggestion[] = extraction.transformations.map((transformation: any, index: number) => ({
      id: `transformation-${transformation.id || index}`,
      type: 'problem',
      content: transformation.statement || '',
      source: transformation.sources?.[0]?.type === 'website' ? 'ai-generated' : 'industry-profile',
      confidence: (transformation.confidence?.overall || 0) / 100,
      tags: [
        'transformation_goal',
        ...(transformation.emotionalDrivers || []).slice(0, 2).map((d: string) => `emotional:${d.toLowerCase().replace(/\s+/g, '_')}`),
        ...(transformation.functionalDrivers || []).slice(0, 2).map((d: string) => `functional:${d.toLowerCase().replace(/\s+/g, '_')}`)
      ],
      is_selected: false,
      is_customizable: true
    }));

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

    console.log('[TransformationGoalPage] Converted extraction to suggestions:', analyzedSuggestions.length);

    return analyzedSuggestions;
  };

  /**
   * Generate AI suggestions using enhanced extractor + industry EQ
   */
  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);

    try {
      console.log('[TransformationGoalPage] Generating suggestions with enhanced extractor...');

      // Use enhanced extractor
      const extraction = await extractEnhancedTransformations(
        websiteContent,
        businessName,
        industry
      );

      console.log('[TransformationGoalPage] Extraction complete:', extraction);
      console.log(`  - Transformations: ${extraction.transformations.length}`);
      console.log(`  - Quotes: ${extraction.quotes.length}`);

      const analyzedSuggestions = convertExtractionToSuggestions(extraction);
      setSuggestions(analyzedSuggestions);

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
   * Generate fallback suggestions using industry profile data
   */
  const generateFallbackSuggestions = (industry: string, eq: any): DraggableSuggestion[] => {
    const fallbacks: DraggableSuggestion[] = [];

    // Find industry profile
    const profile = industryRegistry.search(industry)[0] ||
                    industryRegistry.getById('consultant');

    if (profile) {
      const painPoints = profile.commonPainPoints || [];
      const triggers = profile.commonBuyingTriggers || [];
      const psychology = profile.psychologyProfile;

      // Generate specific suggestions from profile data
      if (painPoints.length > 0) {
        fallbacks.push({
          id: 'profile-fallback-1',
          type: 'problem',
          content: `From "${painPoints[0]}" → To confidently achieving their goals with peace of mind`,
          source: 'industry-profile',
          confidence: 0.8,
          tags: ['industry_specific', 'emotional'],
          is_selected: false,
          is_customizable: true
        });
      }

      if (painPoints.length > 1) {
        fallbacks.push({
          id: 'profile-fallback-2',
          type: 'problem',
          content: `From "${painPoints[1]}" → To having clarity and a proven plan that works`,
          source: 'industry-profile',
          confidence: 0.75,
          tags: ['industry_specific', 'functional'],
          is_selected: false,
          is_customizable: true
        });
      }

      if (triggers.length > 0) {
        fallbacks.push({
          id: 'profile-fallback-3',
          type: 'problem',
          content: `Transform clients facing "${triggers[0].toLowerCase()}" into confident decision-makers with expert support`,
          source: 'industry-profile',
          confidence: 0.7,
          tags: ['industry_specific', 'trust'],
          is_selected: false,
          is_customizable: true
        });
      }

      // Add EQ-aligned suggestion
      if (eq) {
        const emotionalWeight = eq.emotional_weight || 50;
        const focusType = eq.jtbd_focus || 'balanced';

        fallbacks.push({
          id: 'eq-fallback',
          type: 'problem',
          content: focusType === 'emotional'
            ? `From feeling overwhelmed and uncertain → To confident and empowered in their ${industry} journey`
            : focusType === 'functional'
            ? `From inefficient processes and wasted time → To streamlined operations with measurable results`
            : `From stuck and frustrated → To confident and achieving real progress`,
          source: 'industry-profile',
          confidence: 0.7,
          tags: ['eq_aligned', focusType],
          is_selected: false,
          is_customizable: true
        });
      }
    }

    // If no profile found, use generic but helpful templates
    if (fallbacks.length === 0) {
      fallbacks.push(
        {
          id: 'generic-1',
          type: 'problem',
          content: `Help ${industry || 'customers'} go from [current frustrating state] to [desired transformation]`,
          source: 'user-custom',
          confidence: 0.5,
          tags: ['template'],
          is_selected: false,
          is_customizable: true
        },
        {
          id: 'generic-2',
          type: 'problem',
          content: `Transform from struggling with [specific problem] to confidently [desired state] with peace of mind`,
          source: 'user-custom',
          confidence: 0.5,
          tags: ['template'],
          is_selected: false,
          is_customizable: true
        }
      );
    }

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

  const handleAddManualTransformation = () => {
    if (!newTransformationGoal.trim()) return;

    // Add the new transformation as a suggestion
    const newSuggestion: DraggableSuggestion = {
      id: `manual-${Date.now()}`,
      type: 'problem',
      content: newTransformationGoal.trim(),
      source: 'manual-input',
      confidence: 100,
      tags: ['manual'],
      is_selected: false,
      is_customizable: true
    };

    setSuggestions([newSuggestion, ...suggestions]);

    // Also add to the drop zone/input
    const newValue = inputValue
      ? `${inputValue}\n\n${newTransformationGoal.trim()}`
      : newTransformationGoal.trim();

    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }

    // Reset form
    setNewTransformationGoal('');
    setShowAddForm(false);
  };

  // Handle editing a suggestion
  const handleEditSuggestion = (id: string, newContent: string) => {
    setSuggestions(suggestions.map(s =>
      s.id === id ? { ...s, content: newContent } : s
    ));
  };

  // Handle checkbox changes for multi-select
  const handleCheckChange = (id: string, checked: boolean) => {
    if (checked) {
      setCheckedIds([...checkedIds, id]);
    } else {
      setCheckedIds(checkedIds.filter(cid => cid !== id));
    }
  };

  // Handle adding all selected suggestions
  const handleAddSelected = () => {
    const selectedSuggestions = suggestions.filter(s => checkedIds.includes(s.id));
    const newContent = selectedSuggestions.map(s => s.content).join('\n\n');

    const newValue = inputValue
      ? `${inputValue}\n\n${newContent}`
      : newContent;

    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }

    // Clear selections
    setCheckedIds([]);
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
            onEdit={handleEditSuggestion}
            onGenerate={handleGenerateSuggestions}
            isLoading={isGenerating}
            title="AI Suggestions"
            description="Drag, edit, or select multiple suggestions"
            showCheckboxes={true}
            checkedIds={checkedIds}
            onCheckChange={handleCheckChange}
            onAddSelected={handleAddSelected}
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

      {/* Add Manual Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-500 dark:border-purple-400 p-6 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Transformation Goal
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transformation Goal Description
                </label>
                <textarea
                  value={newTransformationGoal}
                  onChange={(e) => setNewTransformationGoal(e.target.value)}
                  placeholder="e.g., From feeling overwhelmed by X to confidently achieving Y"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleAddManualTransformation();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Press ⌘+Enter to add
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAddManualTransformation}
                  disabled={!newTransformationGoal.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Transformation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTransformationGoal('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {isValid ? (
              <span className="text-green-600 font-medium">Ready to continue</span>
            ) : (
              <span>Fill in your transformation goal to continue</span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-2 border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Manually</span>
          </Button>
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
