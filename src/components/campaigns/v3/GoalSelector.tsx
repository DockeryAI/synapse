/**
 * Goal Selector Component
 *
 * Week 4 - Campaign Types V3
 * Goal-first selection UI for campaign creation
 */

import React from 'react';
import { BusinessGoal, CampaignTypeV3 } from '../../../types/campaign-v3.types';

interface GoalOption {
  id: BusinessGoal;
  title: string;
  description: string;
  icon: string;
  suggestedCampaign: CampaignTypeV3;
  timeline: string;
  expectedResults: string[];
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'build-authority',
    title: 'Build Authority',
    description: 'Establish yourself as the expert in your field',
    icon: '🎓',
    suggestedCampaign: 'authority-builder',
    timeline: '7 days',
    expectedResults: [
      'Increased trust and credibility',
      'More qualified leads',
      'Higher conversion rates'
    ]
  },
  {
    id: 'increase-local-traffic',
    title: 'Increase Local Traffic',
    description: 'Get more customers from your community',
    icon: '📍',
    suggestedCampaign: 'community-champion',
    timeline: '14 days',
    expectedResults: [
      '5x local visibility',
      'More foot traffic',
      'Community recognition'
    ]
  },
  {
    id: 'build-trust',
    title: 'Build Trust',
    description: 'Establish credibility with new audiences',
    icon: '🤝',
    suggestedCampaign: 'trust-builder',
    timeline: '10 days',
    expectedResults: [
      'Higher engagement rates',
      'Reduced objections',
      'Repeat customers'
    ]
  },
  {
    id: 'drive-sales',
    title: 'Drive Sales',
    description: 'Generate immediate revenue',
    icon: '💰',
    suggestedCampaign: 'revenue-rush',
    timeline: '5 days',
    expectedResults: [
      '2-5% conversion rate',
      'Quick revenue boost',
      'Clear ROI tracking'
    ]
  },
  {
    id: 'increase-awareness',
    title: 'Increase Awareness',
    description: 'Get discovered by more people',
    icon: '🚀',
    suggestedCampaign: 'viral-spark',
    timeline: '7 days',
    expectedResults: [
      '10x engagement vs normal',
      'Viral potential',
      'Brand recognition'
    ]
  }
];

interface GoalSelectorProps {
  selectedGoal?: BusinessGoal;
  onGoalSelect: (goal: BusinessGoal) => void;
  onContinue?: () => void;
}

export const GoalSelector: React.FC<GoalSelectorProps> = ({
  selectedGoal,
  onGoalSelect,
  onContinue
}) => {
  return (
    <div className="goal-selector">
      <div className="goal-selector__header">
        <h2>What's your primary goal right now?</h2>
        <p>Choose the outcome that matters most to your business</p>
      </div>

      <div className="goal-selector__grid">
        {GOAL_OPTIONS.map((goal) => (
          <button
            key={goal.id}
            className={`goal-card ${selectedGoal === goal.id ? 'goal-card--selected' : ''}`}
            onClick={() => onGoalSelect(goal.id)}
          >
            <div className="goal-card__icon">{goal.icon}</div>
            <h3 className="goal-card__title">{goal.title}</h3>
            <p className="goal-card__description">{goal.description}</p>

            <div className="goal-card__meta">
              <span className="goal-card__timeline">
                ⏱️ {goal.timeline}
              </span>
            </div>

            <div className="goal-card__results">
              <h4>Expected Results:</h4>
              <ul>
                {goal.expectedResults.map((result, idx) => (
                  <li key={idx}>{result}</li>
                ))}
              </ul>
            </div>

            <div className="goal-card__suggestion">
              <span className="badge badge--ai">
                AI Recommended: {goal.suggestedCampaign.replace('-', ' ')}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedGoal && onContinue && (
        <div className="goal-selector__actions">
          <button
            className="btn btn--primary btn--large"
            onClick={onContinue}
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalSelector;
