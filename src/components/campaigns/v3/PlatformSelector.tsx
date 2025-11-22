/**
 * Platform Selector Component
 *
 * Week 4 - Campaign Types V3
 * 2-3 platform maximum enforcement with business-type matching
 */

import React, { useState, useEffect } from 'react';
import { PlatformV3 } from '../../../types/campaign-v3.types';

interface PlatformOption {
  id: PlatformV3;
  name: string;
  icon: string;
  description: string;
  bestFor: string[];
  engagementRate: string;
  costPer: string;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    description: 'Local businesses, service providers, B2B',
    bestFor: ['local-business', 'service', 'b2b'],
    engagementRate: '1-2%',
    costPer: '$8-15 CPM (feed), $0.50-2 CPM (stories)'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    description: 'Retail, e-commerce, visual brands',
    bestFor: ['retail', 'ecommerce', 'visual'],
    engagementRate: '2-3%',
    costPer: '$0.50-2 CPM (stories)'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'B2B, professional services, consultants',
    bestFor: ['b2b', 'professional', 'consulting'],
    engagementRate: '2-3%',
    costPer: '$10-20 CPM'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    description: 'Under-40 audience, viral potential',
    bestFor: ['retail', 'ecommerce', 'young-audience'],
    engagementRate: '5-8%',
    costPer: '$2-10 CPM'
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '🐦',
    description: 'News, tech, real-time engagement',
    bestFor: ['tech', 'news', 'b2b'],
    engagementRate: '1-2%',
    costPer: '$6-12 CPM'
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    icon: '📹',
    description: 'Video content, tutorials, demos',
    bestFor: ['education', 'demo', 'entertainment'],
    engagementRate: '3-5%',
    costPer: '$4-8 CPM'
  },
  {
    id: 'google-business',
    name: 'Google Business',
    icon: '📍',
    description: 'Local visibility, 2x/week posts',
    bestFor: ['local-business', 'service'],
    engagementRate: '5x local visibility',
    costPer: 'Free (organic)'
  }
];

interface PlatformSelectorProps {
  selectedPlatforms: PlatformV3[];
  onPlatformsChange: (platforms: PlatformV3[]) => void;
  businessType?: string;
  maxPlatforms?: number;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformsChange,
  businessType = 'general',
  maxPlatforms = 3
}) => {
  const [warning, setWarning] = useState<string>('');

  useEffect(() => {
    if (selectedPlatforms.length > maxPlatforms) {
      setWarning(`Maximum ${maxPlatforms} platforms recommended for best results`);
    } else if (selectedPlatforms.length === 0) {
      setWarning('Select at least 1 platform to continue');
    } else {
      setWarning('');
    }
  }, [selectedPlatforms, maxPlatforms]);

  const handlePlatformToggle = (platformId: PlatformV3) => {
    const isSelected = selectedPlatforms.includes(platformId);

    if (isSelected) {
      // Deselect
      onPlatformsChange(selectedPlatforms.filter(p => p !== platformId));
    } else {
      // Select (with max limit)
      if (selectedPlatforms.length >= maxPlatforms) {
        setWarning(`You can only select up to ${maxPlatforms} platforms`);
        return;
      }
      onPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  const isRecommended = (platform: PlatformOption): boolean => {
    return platform.bestFor.includes(businessType);
  };

  const sortedPlatforms = [...PLATFORM_OPTIONS].sort((a, b) => {
    const aRec = isRecommended(a);
    const bRec = isRecommended(b);
    if (aRec && !bRec) return -1;
    if (!aRec && bRec) return 1;
    return 0;
  });

  return (
    <div className="platform-selector">
      <div className="platform-selector__header">
        <h2>Select Your Platforms</h2>
        <p>Choose 2-3 platforms for best results</p>
        <div className="platform-selector__counter">
          {selectedPlatforms.length} / {maxPlatforms} selected
        </div>
      </div>

      {warning && (
        <div className={`platform-selector__warning ${selectedPlatforms.length > maxPlatforms ? 'warning--error' : 'warning--info'}`}>
          {warning}
        </div>
      )}

      <div className="platform-selector__grid">
        {sortedPlatforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const recommended = isRecommended(platform);

          return (
            <button
              key={platform.id}
              className={`platform-card ${isSelected ? 'platform-card--selected' : ''} ${recommended ? 'platform-card--recommended' : ''}`}
              onClick={() => handlePlatformToggle(platform.id)}
              disabled={!isSelected && selectedPlatforms.length >= maxPlatforms}
            >
              {recommended && (
                <div className="platform-card__badge">
                  <span className="badge badge--recommended">Recommended</span>
                </div>
              )}

              <div className="platform-card__icon">{platform.icon}</div>
              <h3 className="platform-card__name">{platform.name}</h3>
              <p className="platform-card__description">{platform.description}</p>

              <div className="platform-card__stats">
                <div className="stat">
                  <span className="stat__label">Engagement:</span>
                  <span className="stat__value">{platform.engagementRate}</span>
                </div>
                <div className="stat">
                  <span className="stat__label">Cost:</span>
                  <span className="stat__value">{platform.costPer}</span>
                </div>
              </div>

              {isSelected && (
                <div className="platform-card__check">✓</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="platform-selector__info">
        <div className="info-box">
          <h4>Why 2-3 platforms?</h4>
          <p>Research shows campaigns with 2-3 platforms get:</p>
          <ul>
            <li>Better content quality (focused creative)</li>
            <li>Higher engagement (not spread too thin)</li>
            <li>Easier management (sustainable posting)</li>
            <li>Lower costs (optimized ad spend)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlatformSelector;
