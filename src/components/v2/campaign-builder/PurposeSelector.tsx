/**
 * Purpose Selector - Campaign Template Selection UI
 * Displays all 15 campaign templates with metadata and performance predictions
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { performancePredictor } from '@/services/v2/performance-predictor.service';

export interface CampaignTemplateOption {
  id: string;
  name: string;
  description: string;
  pieces: number;
  duration: number;
  category: 'premium' | 'authority' | 'quickwin';
  expectedROI: number;
  bestFor: string[];
}

const CAMPAIGN_TEMPLATES: CampaignTemplateOption[] = [
  // Premium Tier (85+ breakthrough score)
  {
    id: 'heros_journey',
    name: "Hero's Journey",
    description: 'Transform your audience through a compelling narrative arc',
    pieces: 5,
    duration: 21,
    category: 'premium',
    expectedROI: 5.0,
    bestFor: ['Brand stories', 'Transformations', 'Case studies'],
  },
  {
    id: 'race_journey',
    name: 'RACE Journey',
    description: 'Reach, Act, Convert, Engage - full funnel campaign',
    pieces: 4,
    duration: 14,
    category: 'premium',
    expectedROI: 4.5,
    bestFor: ['Lead generation', 'Product launches', 'Nurture sequences'],
  },
  {
    id: 'trust_ladder',
    name: 'Trust Ladder',
    description: 'Build credibility step by step with social proof',
    pieces: 5,
    duration: 21,
    category: 'premium',
    expectedROI: 4.2,
    bestFor: ['New audiences', 'High-ticket offers', 'B2B'],
  },
  // Authority Tier (70-84 breakthrough score)
  {
    id: 'authority_builder',
    name: 'Authority Builder',
    description: 'Establish expertise and thought leadership',
    pieces: 4,
    duration: 14,
    category: 'authority',
    expectedROI: 3.5,
    bestFor: ['Consultants', 'Coaches', 'Expert positioning'],
  },
  {
    id: 'education_first',
    name: 'Education First',
    description: 'Lead with value, then present your solution',
    pieces: 4,
    duration: 14,
    category: 'authority',
    expectedROI: 3.8,
    bestFor: ['Complex products', 'B2B sales', 'Technical audiences'],
  },
  {
    id: 'social_proof',
    name: 'Social Proof',
    description: 'Let your results and testimonials do the talking',
    pieces: 4,
    duration: 14,
    category: 'authority',
    expectedROI: 4.2,
    bestFor: ['Service businesses', 'E-commerce', 'Local businesses'],
  },
  // Quick Win Tier (60-69 breakthrough score)
  {
    id: 'quick_win_campaign',
    name: 'Quick Win',
    description: 'Deliver immediate value and fast results',
    pieces: 3,
    duration: 5,
    category: 'quickwin',
    expectedROI: 3.5,
    bestFor: ['Lead magnets', 'Email lists', 'Quick conversions'],
  },
  {
    id: 'pas_series',
    name: 'PAS Series',
    description: 'Problem, Agitate, Solution - classic conversion flow',
    pieces: 3,
    duration: 7,
    category: 'quickwin',
    expectedROI: 3.8,
    bestFor: ['Pain-point marketing', 'Urgency campaigns', 'Direct response'],
  },
  {
    id: 'value_stack',
    name: 'Value Stack',
    description: 'Build irresistible offers with stacked bonuses',
    pieces: 4,
    duration: 14,
    category: 'quickwin',
    expectedROI: 4.0,
    bestFor: ['Product launches', 'Promotions', 'Limited offers'],
  },
  // Additional templates
  {
    id: 'bab_campaign',
    name: 'BAB Campaign',
    description: 'Before, After, Bridge - transformation focused',
    pieces: 3,
    duration: 7,
    category: 'quickwin',
    expectedROI: 4.0,
    bestFor: ['Transformations', 'Weight loss', 'Skill development'],
  },
  {
    id: 'product_launch',
    name: 'Product Launch',
    description: 'Build anticipation and launch with impact',
    pieces: 4,
    duration: 14,
    category: 'premium',
    expectedROI: 4.8,
    bestFor: ['New products', 'Feature releases', 'Rebrands'],
  },
  {
    id: 'seasonal_urgency',
    name: 'Seasonal Urgency',
    description: 'Capitalize on time-sensitive opportunities',
    pieces: 3,
    duration: 7,
    category: 'quickwin',
    expectedROI: 4.5,
    bestFor: ['Holiday sales', 'Limited time offers', 'Seasonal products'],
  },
  {
    id: 'comparison_campaign',
    name: 'Comparison Campaign',
    description: 'Position against alternatives with clarity',
    pieces: 3,
    duration: 7,
    category: 'authority',
    expectedROI: 4.0,
    bestFor: ['Competitive markets', 'Feature comparison', 'Value positioning'],
  },
  {
    id: 'objection_crusher',
    name: 'Objection Crusher',
    description: 'Address concerns and remove buying barriers',
    pieces: 4,
    duration: 14,
    category: 'authority',
    expectedROI: 4.5,
    bestFor: ['High-ticket sales', 'Complex decisions', 'B2B'],
  },
  {
    id: 'scarcity_sequence',
    name: 'Scarcity Sequence',
    description: 'Create urgency with genuine limitations',
    pieces: 4,
    duration: 7,
    category: 'quickwin',
    expectedROI: 4.8,
    bestFor: ['Flash sales', 'Limited inventory', 'Exclusive offers'],
  },
];

export interface PurposeSelectorProps {
  onSelect: (templateId: string) => void;
  selectedTemplateId: string | null;
  industry?: string;
  className?: string;
}

export const PurposeSelector: React.FC<PurposeSelectorProps> = ({
  onSelect,
  selectedTemplateId,
  industry,
  className,
}) => {
  const [filter, setFilter] = React.useState<'all' | 'premium' | 'authority' | 'quickwin'>('all');

  const filteredTemplates = CAMPAIGN_TEMPLATES.filter(
    t => filter === 'all' || t.category === filter
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Choose Your Campaign Template</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a template that matches your campaign goals
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'premium', 'authority', 'quickwin'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md capitalize font-medium',
              filter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            )}
          >
            {cat === 'all' ? 'All Templates' : cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedTemplateId === template.id}
            industry={industry}
            onSelect={() => onSelect(template.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface TemplateCardProps {
  template: CampaignTemplateOption;
  selected: boolean;
  industry?: string;
  onSelect: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  selected,
  industry,
  onSelect,
}) => {
  const prediction = performancePredictor.getAggregatedPrediction(
    template.id,
    'campaign',
    industry
  );

  const categoryColors = {
    premium: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    authority: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    quickwin: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        'text-left p-4 rounded-lg border-2 transition-all bg-white dark:bg-slate-800',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary/20'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
        <span
          className={cn(
            'px-2 py-0.5 text-xs rounded-full capitalize font-medium',
            categoryColors[template.category]
          )}
        >
          {template.category}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {template.description}
      </p>

      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Pieces</span>
          <div className="font-medium text-gray-900 dark:text-white">{template.pieces}</div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Days</span>
          <div className="font-medium text-gray-900 dark:text-white">{template.duration}</div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">ROI</span>
          <div className="font-medium text-green-600 dark:text-green-400">{template.expectedROI}x</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {template.bestFor.slice(0, 2).map(use => (
          <span
            key={use}
            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded"
          >
            {use}
          </span>
        ))}
      </div>

      {/* Performance Score */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Performance Score</span>
          <span className={cn(
            'font-medium',
            prediction.overallScore >= 70 ? 'text-green-600 dark:text-green-400' :
            prediction.overallScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          )}>
            {prediction.overallScore}/100
          </span>
        </div>
      </div>
    </button>
  );
};

export default PurposeSelector;
