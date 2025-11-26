/**
 * Campaign Builder V3
 *
 * Main campaign builder interface with step-by-step flow.
 * Goal-first approach: Goal → Type → Products (optional) → Platforms → Duration → Review
 *
 * Because building campaigns should be simple, not rocket science.
 */

import React, { useState, useEffect } from 'react';
import { CampaignGeneratorV3 } from '../../services/campaign-v3/CampaignGeneratorV3';
import { CampaignTypeEngine } from '../../services/campaign-v3/CampaignTypeEngine';
import { DurationEnforcer } from '../../services/campaign-v3/DurationEnforcer';
import { CampaignTypeSelector } from './CampaignTypeSelector';
import { PlatformSelectorV3 } from './PlatformSelectorV3';
import { ProductSelector } from '../campaign/product-selector';
import { Package, Sparkles } from 'lucide-react';
import type {
  BusinessGoal,
  BusinessType,
  CampaignTypeV3,
  PlatformV3,
  CampaignDuration,
  CampaignV3Config,
} from '../../types/campaign-v3.types';
import type { Product } from '@/features/product-marketing/types/product.types';

interface CampaignBuilderV3Props {
  userId: string;
  brandId?: string; // For product selection
  businessType: BusinessType;
  businessName: string;
  industry: string;
  location?: string;
  /** Enable product selection step */
  enableProductSelection?: boolean;
  onComplete: (campaign: CampaignV3Config & { selectedProducts?: Product[] }) => void;
  onCancel?: () => void;
}

type Step = 'goal' | 'type' | 'products' | 'platforms' | 'duration' | 'schedule' | 'review';

export const CampaignBuilderV3: React.FC<CampaignBuilderV3Props> = ({
  userId,
  brandId,
  businessType,
  businessName,
  industry,
  location,
  enableProductSelection = false,
  onComplete,
  onCancel,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<Step>('goal');
  const [selectedGoal, setSelectedGoal] = useState<BusinessGoal>();
  const [selectedType, setSelectedType] = useState<CampaignTypeV3>();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformV3[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<CampaignDuration>();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  // Determine if products step should be shown
  const showProductsStep = enableProductSelection && brandId;

  // Update duration when campaign type changes
  useEffect(() => {
    if (selectedType) {
      const duration = DurationEnforcer.getDurationForType(selectedType);
      setSelectedDuration(duration);
    }
  }, [selectedType]);

  // Steps configuration - dynamically include products step if enabled
  const baseSteps: { id: Step; label: string; canSkip: boolean }[] = [
    { id: 'goal', label: 'Choose Goal', canSkip: false },
    { id: 'type', label: 'Campaign Type', canSkip: false },
  ];

  // Add products step if enabled
  if (showProductsStep) {
    baseSteps.push({ id: 'products', label: 'Select Products', canSkip: true });
  }

  baseSteps.push(
    { id: 'platforms', label: 'Select Platforms', canSkip: false },
    { id: 'duration', label: 'Duration & Schedule', canSkip: false },
    { id: 'review', label: 'Review & Launch', canSkip: false },
  );

  const steps = baseSteps;

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const canGoNext = validateCurrentStep();
  const canGoPrev = currentStepIndex > 0;

  function validateCurrentStep(): boolean {
    switch (currentStep) {
      case 'goal':
        return !!selectedGoal;
      case 'type':
        return !!selectedType;
      case 'products':
        // Products step is optional, always valid
        return true;
      case 'platforms':
        return selectedPlatforms.length >= 2 && selectedPlatforms.length <= 3;
      case 'duration':
        return !!selectedDuration;
      default:
        return true;
    }
  }

  function handleNext() {
    if (canGoNext && currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  }

  function handlePrev() {
    if (canGoPrev) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  }

  async function handleComplete() {
    if (!selectedGoal || !selectedType || !selectedDuration) {
      return;
    }

    setIsGenerating(true);

    try {
      const campaign = CampaignGeneratorV3.createQuickCampaign(
        userId,
        selectedGoal,
        businessType,
        businessName,
        industry,
        location
      );

      // Override with user selections
      campaign.campaignType = selectedType;
      campaign.platforms.platforms = selectedPlatforms;
      campaign.duration = selectedDuration;
      campaign.startDate = startDate;

      // Include selected products if any
      onComplete({
        ...campaign,
        selectedProducts: selectedProducts.length > 0 ? selectedProducts : undefined,
      });
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  // Render step content
  function renderStepContent() {
    switch (currentStep) {
      case 'goal':
        return (
          <GoalSelector
            selectedGoal={selectedGoal}
            onSelectGoal={setSelectedGoal}
          />
        );

      case 'type':
        return (
          <CampaignTypeSelector
            businessType={businessType}
            selectedGoal={selectedGoal}
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />
        );

      case 'products':
        return brandId ? (
          <ProductsStep
            brandId={brandId}
            selectedProducts={selectedProducts}
            onSelectionChange={setSelectedProducts}
          />
        ) : null;

      case 'platforms':
        return selectedType ? (
          <PlatformSelectorV3
            businessType={businessType}
            campaignType={selectedType}
            selectedPlatforms={selectedPlatforms}
            onSelectPlatforms={setSelectedPlatforms}
          />
        ) : null;

      case 'duration':
        return selectedType ? (
          <DurationScheduleStep
            campaignType={selectedType}
            duration={selectedDuration}
            startDate={startDate}
            onChangeStartDate={setStartDate}
          />
        ) : null;

      case 'review':
        return selectedType && selectedDuration ? (
          <ReviewStep
            campaignType={selectedType}
            platforms={selectedPlatforms}
            duration={selectedDuration}
            startDate={startDate}
            businessName={businessName}
            selectedProducts={selectedProducts}
          />
        ) : null;

      default:
        return null;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center ${
                  index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    index < currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : index === currentStepIndex
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel || handlePrev}
          disabled={!canGoPrev && !onCancel}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </button>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Step {currentStepIndex + 1} of {steps.length}
        </div>

        {currentStep === 'review' ? (
          <button
            onClick={handleComplete}
            disabled={!canGoNext || isGenerating}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Creating Campaign...' : '🚀 Create Campaign'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

// Goal Selector Component
const GoalSelector: React.FC<{
  selectedGoal?: BusinessGoal;
  onSelectGoal: (goal: BusinessGoal) => void;
}> = ({ selectedGoal, onSelectGoal }) => {
  const goals: { id: BusinessGoal; label: string; description: string; icon: string }[] = [
    {
      id: 'build-authority',
      label: 'Build Authority',
      description: 'Become the go-to expert in your industry',
      icon: '🎓',
    },
    {
      id: 'increase-local-traffic',
      label: 'Increase Local Traffic',
      description: 'Get more local customers through your door',
      icon: '🏘️',
    },
    {
      id: 'build-trust',
      label: 'Build Trust',
      description: 'Establish credibility with social proof',
      icon: '🤝',
    },
    {
      id: 'drive-sales',
      label: 'Drive Sales',
      description: 'Generate immediate revenue and conversions',
      icon: '💰',
    },
    {
      id: 'increase-awareness',
      label: 'Increase Awareness',
      description: 'Get discovered by more people',
      icon: '🚀',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          What do you want to achieve?
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choose your primary business goal for this campaign
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onSelectGoal(goal.id)}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              selectedGoal === goal.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-4xl mb-3">{goal.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {goal.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {goal.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

// Duration & Schedule Step
const DurationScheduleStep: React.FC<{
  campaignType: CampaignTypeV3;
  duration?: CampaignDuration;
  startDate: Date;
  onChangeStartDate: (date: Date) => void;
}> = ({ campaignType, duration, startDate, onChangeStartDate }) => {
  const campaignTypeData = CampaignTypeEngine.getType(campaignType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Campaign Schedule
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {campaignTypeData?.name} campaigns run for {duration} days
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{campaignTypeData?.icon}</span>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">
              {duration} Day Campaign
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {DurationEnforcer.getOption(duration!)?.description}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Start Date
        </label>
        <input
          type="date"
          value={startDate.toISOString().split('T')[0]}
          onChange={(e) => onChangeStartDate(new Date(e.target.value))}
          className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          End date: {DurationEnforcer.calculateEndDate(startDate, duration!).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

// Products Step (optional)
const ProductsStep: React.FC<{
  brandId: string;
  selectedProducts: Product[];
  onSelectionChange: (products: Product[]) => void;
}> = ({ brandId, selectedProducts, onSelectionChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-7 h-7" />
          Feature Products
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Optionally select products or services to feature in your campaign
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div>
            <p className="text-sm text-purple-900 dark:text-purple-200">
              <strong>Pro tip:</strong> Campaigns with featured products typically see 2-3x higher engagement.
              The AI will create content specifically highlighting your selected products.
            </p>
          </div>
        </div>
      </div>

      <ProductSelector
        brandId={brandId}
        selectedProducts={selectedProducts}
        onSelectionChange={onSelectionChange}
        maxSelection={3}
        showRecommendations={true}
      />
    </div>
  );
};

// Review Step
const ReviewStep: React.FC<{
  campaignType: CampaignTypeV3;
  platforms: PlatformV3[];
  duration: CampaignDuration;
  startDate: Date;
  businessName: string;
  selectedProducts?: Product[];
}> = ({ campaignType, platforms, duration, startDate, businessName, selectedProducts }) => {
  const campaignTypeData = CampaignTypeEngine.getType(campaignType);
  const estimatedPosts = CampaignTypeEngine.getEstimatedPostCount(campaignType, platforms.length);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Review Your Campaign
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Everything looks good? Let's launch!
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Campaign Type
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {campaignTypeData?.icon} {campaignTypeData?.name}
          </p>
        </div>

        {/* Featured Products */}
        {selectedProducts && selectedProducts.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Featured Products ({selectedProducts.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <span
                  key={product.id}
                  className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-purple-200 dark:border-purple-600"
                >
                  {product.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Platforms ({platforms.length})
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {platforms.join(', ')}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Duration & Schedule
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {duration} days • {estimatedPosts} posts
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {startDate.toLocaleDateString()} - {DurationEnforcer.calculateEndDate(startDate, duration).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilderV3;
