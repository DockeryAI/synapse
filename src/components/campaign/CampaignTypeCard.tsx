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
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CampaignType } from '../../types/campaign.types';
import * as Icons from 'lucide-react';
import { Sparkles } from 'lucide-react';

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

  // Synapse purple/blue gradient color scheme
  const colorClasses = {
    blue: {
      badge: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'ring-purple-500 dark:ring-purple-400',
      recommended: 'bg-gradient-to-r from-purple-600 to-blue-600'
    },
    green: {
      badge: 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'ring-purple-500 dark:ring-purple-400',
      recommended: 'bg-gradient-to-r from-purple-600 to-blue-600'
    },
    orange: {
      badge: 'bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30',
      icon: 'text-violet-600 dark:text-violet-400',
      border: 'ring-purple-500 dark:ring-purple-400',
      recommended: 'bg-gradient-to-r from-purple-600 to-blue-600'
    }
  };

  const colors = colorClasses[type.color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300 relative overflow-hidden h-full',
          'bg-white dark:bg-slate-800 border-2',
          selected
            ? `${colors.border} ring-2 shadow-xl`
            : 'border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg'
        )}
        onClick={onClick}
      >
        {/* Recommended Badge */}
        {type.recommended && (
          <motion.div
            className="absolute top-0 right-0 z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={cn(
              'px-3 py-1 text-xs font-semibold text-white rounded-bl-lg shadow-md flex items-center gap-1',
              colors.recommended
            )}>
              <Sparkles className="h-3 w-3" />
              Recommended
            </div>
          </motion.div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shadow-sm',
                colors.badge
              )}>
                <IconComponent className={cn('w-6 h-6', colors.icon)} />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {type.name}
                </CardTitle>
                {type.confidenceScore !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {Math.round(type.confidenceScore * 100)}%
                    </span>
                    data match
                  </p>
                )}
              </div>
            </div>
          </div>

          <CardDescription className="mt-3 text-sm">
            {type.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Recommendation Reason */}
          {type.recommendationReason && (
            <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 text-sm border border-purple-100 dark:border-purple-800">
              <p className="text-muted-foreground">
                <span className="font-medium text-purple-700 dark:text-purple-300">Why this works: </span>
                {type.recommendationReason}
              </p>
            </div>
          )}

          {/* Ideal For */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-purple-700 dark:text-purple-300">Best for:</h4>
            <div className="flex flex-wrap gap-1.5">
              {type.idealFor.slice(0, 3).map((ideal, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                >
                  {ideal}
                </Badge>
              ))}
              {type.idealFor.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  +{type.idealFor.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-purple-700 dark:text-purple-300">Top platforms:</h4>
            <div className="flex flex-wrap gap-1.5">
              {type.platforms.slice(0, 4).map((platform, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Selection Indicator */}
        {selected && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600"
            layoutId="selectedCard"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </Card>
    </motion.div>
  );
};
