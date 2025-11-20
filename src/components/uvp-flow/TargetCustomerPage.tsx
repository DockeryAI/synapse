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
 * Updated: 2025-11-19 (Fixed progressive loading and data reversion)
 */

import React, { useState, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, Lightbulb, Sparkles, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuggestionPanel } from '@/components/uvp-wizard/SuggestionPanel';
import { DropZone } from '@/components/uvp-wizard/DropZone';
import { DraggableItem } from '@/components/uvp-wizard/DraggableItem';
import { CompactWizardProgress } from '@/components/uvp-wizard/WizardProgress';
import type { DraggableSuggestion, DropZone as DropZoneType } from '@/types/uvp-wizard';
import type { CustomerProfile } from '@/types/uvp-flow.types';
import { extractEnhancedCustomers } from '@/services/uvp-extractors/enhanced-customer-extractor.service';
import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';

interface TargetCustomerPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[];
  websiteUrls?: string[];
  preloadedData?: any; // Pre-loaded extraction data from parent
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
  preloadedData,
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerSegment, setNewCustomerSegment] = useState('');

  // Multi-select state
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // Track if we've already loaded preloaded data to prevent double-loading
  const hasLoadedPreloadedData = useRef(false);

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

  // Progressive loading effect - handles preloaded data from background
  useEffect(() => {
    console.log('[TargetCustomerPage] useEffect triggered', {
      hasPreloadedData: !!preloadedData,
      isLoading: preloadedData && (preloadedData as any).loading,
      hasProfiles: preloadedData && preloadedData.profiles && preloadedData.profiles.length,
      suggestionsCount: suggestions.length,
      hasLoadedBefore: hasLoadedPreloadedData.current
    });

    // Check if data is still loading in background
    if (preloadedData && (preloadedData as any).loading) {
      console.log('[TargetCustomerPage] ⏳ Data is loading in background...');
      setIsGenerating(true);
      return;
    }

    // If we have pre-loaded data with profiles AND haven't loaded it before
    if (preloadedData && preloadedData.profiles && preloadedData.profiles.length > 0) {
      // Skip if we've already loaded this data
      if (hasLoadedPreloadedData.current && suggestions.length > 0) {
        console.log('[TargetCustomerPage] ✓ Data already loaded, skipping');
        return;
      }

      console.log('[TargetCustomerPage] 📥 Loading pre-loaded data:', preloadedData.profiles.length, 'profiles');
      const extractedSuggestions = convertExtractionToSuggestions(preloadedData);

      if (extractedSuggestions && extractedSuggestions.length > 0) {
        console.log('[TargetCustomerPage] ✓ Conversion successful:', extractedSuggestions.length, 'suggestions');
        setSuggestions(extractedSuggestions);
        setIsGenerating(false);
        hasLoadedPreloadedData.current = true; // Mark as loaded
      } else {
        console.warn('[TargetCustomerPage] ⚠️ Conversion returned empty array');
      }
      return;
    }

    // Only auto-generate if no preloaded data AND we have website content
    if (!preloadedData || (!preloadedData.profiles && !(preloadedData as any).loading)) {
      if (websiteContent.length > 0 && suggestions.length === 0 && !isGenerating) {
        console.log('[TargetCustomerPage] 🤖 Auto-generating suggestions from website content');
        handleGenerateSuggestions();
      }
    }
  }, [preloadedData]); // Only depend on preloadedData (memoized in parent)

  // Helper to convert extraction data to suggestions
  const convertExtractionToSuggestions = (extraction: any): DraggableSuggestion[] => {
    console.log('[TargetCustomerPage] Converting extraction:', {
      hasExtraction: !!extraction,
      hasProfiles: !!(extraction?.profiles),
      profilesLength: extraction?.profiles?.length || 0
    });

    if (!extraction || !extraction.profiles || extraction.profiles.length === 0) {
      console.warn('[TargetCustomerPage] ⚠️ No profiles in extraction');
      return []; // Return empty instead of fallback to prevent data reversion
    }

    try {
      const extractedSuggestions: DraggableSuggestion[] = extraction.profiles.map((profile: any, index: number) => {
        // Handle confidence - could be number or object
        let confidenceValue = 0;
        if (typeof profile.confidence === 'number') {
          confidenceValue = profile.confidence / 100;
        } else if (typeof profile.confidence === 'object' && profile.confidence?.overall) {
          confidenceValue = profile.confidence.overall / 100;
        }

        return {
          id: `customer-${profile.id || index}`,
          type: 'customer-segment',
          content: profile.statement || profile.content || '', // Try both fields
          source: profile.sources?.[0]?.type === 'website' ? 'ai-generated' : 'industry-profile',
          confidence: confidenceValue,
          tags: [
            'target_customer',
            ...(profile.industry ? [`industry:${profile.industry.toLowerCase()}`] : []),
            ...(profile.companySize ? [`size:${profile.companySize.toLowerCase()}`] : []),
            ...(profile.role ? [`role:${profile.role.toLowerCase()}`] : []),
            ...(extraction.locationData ? [`location:${extraction.locationData.city.toLowerCase()}`] : [])
          ],
          is_selected: false,
          is_customizable: true
        };
      });

      extractedSuggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

      console.log('[TargetCustomerPage] ✓ Converted extraction to suggestions:', extractedSuggestions.length);

      return extractedSuggestions;
    } catch (error) {
      console.error('[TargetCustomerPage] ❌ Error converting extraction:', error);
      return []; // Return empty instead of fallback
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);

    try {
      console.log('[TargetCustomerPage] Generating suggestions with enhanced extractor...');

      const extraction = await extractEnhancedCustomers(
        websiteContent,
        businessName,
        industry,
        websiteUrl
      );

      console.log('[TargetCustomerPage] Enhanced extraction complete:', extraction);
      console.log(`  - Profiles: ${extraction.profiles.length}`);
      console.log(`  - Industry personas: ${extraction.industryPersonas.length}`);
      console.log(`  - Location: ${extraction.locationData?.city || 'N/A'}`);

      const extractedSuggestions = convertExtractionToSuggestions(extraction);
      setSuggestions(extractedSuggestions);

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

  const handleAddManualCustomer = () => {
    if (!newCustomerSegment.trim()) return;

    // Add the new customer as a suggestion
    const newSuggestion: DraggableSuggestion = {
      id: `manual-${Date.now()}`,
      type: 'customer-segment',
      content: newCustomerSegment.trim(),
      source: 'manual-input',
      confidence: 100,
      tags: ['manual'],
      is_selected: false,
      is_customizable: true
    };

    setSuggestions([newSuggestion, ...suggestions]);

    // Also add to the drop zone/input
    const newValue = inputValue
      ? `${inputValue}\n\n${newCustomerSegment.trim()}`
      : newCustomerSegment.trim();

    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }

    // Reset form
    setNewCustomerSegment('');
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

  const activeSuggestion = activeDragId
    ? suggestions.find((s) => s.id === activeDragId)
    : null;

  const isValid = inputValue.length >= 20;
  const showWarning = inputValue.length > 0 && !isValid;
  const canGoNext = isValid;

  // Show loading state when generating suggestions
  if (isGenerating && suggestions.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6 ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              <Users className="w-12 h-12 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Analyzing Your Target Customers</h2>
            <p className="text-gray-400">Extracting customer profiles from {businessName}...</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Using AI to identify your ideal customer segments</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 space-y-8 ${className}`}>
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

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            UVP Step 2 of 6: Target Customer
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Who is Your Target Customer?
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We've identified these potential customer segments for {businessName}.
          Review the suggestions below and drag them to customize your target customer profile.
        </p>

        {industryEQ && (
          <Alert className="max-w-2xl mx-auto">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>{industryEQ.industry} buyers:</strong> {industryEQ.purchase_mindset}
              {industryEQ.typical_buyer_role && ` Typically ${industryEQ.typical_buyer_role}s.`}
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 overflow-hidden">
        <div className="lg:col-span-1 overflow-hidden">
          <SuggestionPanel
            suggestions={suggestions}
            type="customer-segment"
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
                Add Customer Segment
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
                  Customer Segment Description
                </label>
                <textarea
                  value={newCustomerSegment}
                  onChange={(e) => setNewCustomerSegment(e.target.value)}
                  placeholder="e.g., Classic car collectors and enthusiasts with valuable vintage vehicles"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleAddManualCustomer();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Press ⌘+Enter to add
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAddManualCustomer}
                  disabled={!newCustomerSegment.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCustomerSegment('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <span>Fill in your target customer to continue</span>
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
