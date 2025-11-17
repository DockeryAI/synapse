/**
 * Campaign Type Selector V3
 *
 * Goal-first campaign type selection with beautiful cards.
 * Shows the 5 V3 campaign types with all their glory.
 */

import React, { useState } from 'react';
import { CampaignTypeEngine } from '../../services/campaign-v3/CampaignTypeEngine';
import type { CampaignTypeV3, BusinessGoal, BusinessType } from '../../types/campaign-v3.types';

interface CampaignTypeSelectorProps {
  businessType: BusinessType;
  selectedGoal?: BusinessGoal;
  selectedType?: CampaignTypeV3;
  onSelectType: (type: CampaignTypeV3) => void;
}

export const CampaignTypeSelector: React.FC<CampaignTypeSelectorProps> = ({
  businessType,
  selectedGoal,
  selectedType,
  onSelectType,
}) => {
  const [hoveredType, setHoveredType] = useState<CampaignTypeV3 | null>(null);

  // Get all campaign types
  const allTypes = CampaignTypeEngine.getAllTypes();

  // Filter by goal if selected
  const filteredTypes = selectedGoal
    ? allTypes.filter(type => type.goal === selectedGoal)
    : allTypes;

  // Check if type is recommended for business
  const isRecommended = (typeId: CampaignTypeV3): boolean => {
    const type = CampaignTypeEngine.getType(typeId);
    return type?.recommendedFor.includes(businessType) || false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose Your Campaign Type
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {selectedGoal
            ? 'Select the campaign that matches your goal'
            : 'Pick a campaign strategy based on what you want to achieve'}
        </p>
      </div>

      {/* Campaign Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const recommended = isRecommended(type.id);
          const isHovered = hoveredType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              onMouseEnter={() => setHoveredType(type.id)}
              onMouseLeave={() => setHoveredType(null)}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-500/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${isHovered ? 'transform -translate-y-1 shadow-lg' : 'shadow'}
              `}
            >
              {/* Recommended Badge */}
              {recommended && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Recommended
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="text-4xl mb-3">{type.icon}</div>

              {/* Name */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {type.name}
              </h3>

              {/* Tagline */}
              <p className="text-sm font-medium" style={{ color: type.color }}>
                {type.tagline}
              </p>

              {/* Duration */}
              <div className="mt-3 flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  {type.duration} days
                </span>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {type.description}
              </p>

              {/* Story Arc Preview */}
              {isHovered && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Journey:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-start space-x-2">
                      <span className="text-xs text-gray-500">Phase 1:</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {type.storyArc.phase1.focus}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-xs text-gray-500">Phase 2:</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {type.storyArc.phase2.focus}
                      </span>
                    </div>
                    {type.storyArc.phase3 && (
                      <div className="flex items-start space-x-2">
                        <span className="text-xs text-gray-500">Phase 3:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {type.storyArc.phase3.focus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* No Results */}
      {filteredTypes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No campaign types match your selected goal.
          </p>
        </div>
      )}
    </div>
  );
};

export default CampaignTypeSelector;
