/**
 * CampaignTypeCard Component
 * 
 * Displays a single campaign type option with:
 * - Icon and title
 * - Description
 * - "Recommended" badge
 * - Ideal for tags
 * - Selection state
 * - Click interaction
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CampaignType } from '../../types/campaign.types';
import * as Icons from 'lucide-react';

export interface CampaignTypeCardProps {
  type: CampaignType;
  selected: boolean;
  onClick: () => void;
}

export const CampaignTypeCard: React.FC<CampaignTypeCardProps> = ({
  type,
  selected,
  onClick
}) => {
  // Get icon component dynamically
  const IconComponent = (Icons as any)[type.icon] || Icons.HelpCircle;
  
  // Color mapping
  const colorClasses = {
    blue: {
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-700',
      recommended: 'bg-blue-600'
    },
    green: {
      badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400',
      border: 'border-green-300 dark:border-green-700',
      recommended: 'bg-green-600'
    },
    orange: {
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      icon: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-300 dark:border-orange-700',
      recommended: 'bg-orange-600'
    }
  };
  
  const colors = colorClasses[type.color as keyof typeof colorClasses] || colorClasses.blue;
  
  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg',
        'relative overflow-hidden',
        selected && `ring-2 ${colors.border}`,
        !selected && 'hover:border-gray-300 dark:hover:border-gray-600'
      )}
      onClick={onClick}
    >
      {/* Recommended Badge */}
      {type.recommended && (
        <div className="absolute top-0 right-0">
          <div className={cn(
            'px-3 py-1 text-xs font-semibold text-white rounded-bl-lg',
            colors.recommended
          )}>
            ✨ Recommended
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              colors.badge
            )}>
              <IconComponent className={cn('w-6 h-6', colors.icon)} />
            </div>
            <div>
              <CardTitle className="text-xl">{type.name}</CardTitle>
              {type.confidenceScore !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(type.confidenceScore * 100)}% data match
                </p>
              )}
            </div>
          </div>
        </div>
        
        <CardDescription className="mt-3">
          {type.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recommendation Reason */}
        {type.recommendationReason && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Why this works: </span>
              {type.recommendationReason}
            </p>
          </div>
        )}
        
        {/* Ideal For */}
        <div>
          <h4 className="text-sm font-medium mb-2">Best for:</h4>
          <div className="flex flex-wrap gap-1.5">
            {type.idealFor.slice(0, 3).map((ideal, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {ideal}
              </Badge>
            ))}
            {type.idealFor.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{type.idealFor.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        {/* Platforms */}
        <div>
          <h4 className="text-sm font-medium mb-2">Top platforms:</h4>
          <div className="flex flex-wrap gap-1.5">
            {type.platforms.slice(0, 4).map((platform, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      
      {/* Selection Indicator */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
      )}
    </Card>
  );
};
