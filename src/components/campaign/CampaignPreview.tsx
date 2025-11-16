/**
 * CampaignPreview Component
 *
 * Shows example outputs and capabilities for each campaign type:
 * - Example content headlines
 * - Platform compatibility icons
 * - Data sources used
 * - Content formats generated
 */

import React from 'react';
import { CampaignType } from '../../types/campaign.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CampaignPreviewProps {
  type: CampaignType;
  className?: string;
}

export const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  type,
  className = ''
}) => {
  const IconComponent = (Icons as any)[type.icon] || Icons.HelpCircle;

  // Color mapping
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400',
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      icon: 'text-orange-600 dark:text-orange-400',
    }
  };

  const colors = colorClasses[type.color as keyof typeof colorClasses] || colorClasses.blue;

  // Platform icon mapping
  const platformIcons: Record<string, string> = {
    'LinkedIn': 'Linkedin',
    'X (Twitter)': 'Twitter',
    'Facebook': 'Facebook',
    'Instagram': 'Instagram',
    'TikTok': 'Music',
    'Blog': 'FileText',
    'Email': 'Mail',
    'Google Business': 'MapPin',
    'Nextdoor': 'Home'
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className={cn(
          'w-20 h-20 rounded-2xl flex items-center justify-center mx-auto',
          colors.badge
        )}>
          <IconComponent className={cn('w-10 h-10', colors.icon)} />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">{type.name}</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {type.description}
          </p>
        </div>
      </div>

      {/* Example Outputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Sparkles className="w-5 h-5" />
            Example Content You'll Get
          </CardTitle>
          <CardDescription>
            Real headlines generated for campaigns like yours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {type.exampleOutputs.map((example, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border-l-4 bg-muted/30 hover:bg-muted/50 transition-colors"
              style={{
                borderLeftColor: type.color === 'blue' ? '#3b82f6' :
                                 type.color === 'green' ? '#10b981' : '#f59e0b'
              }}
            >
              <p className="font-medium">{example}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Layout className="w-5 h-5" />
            Content Formats
          </CardTitle>
          <CardDescription>
            Types of content this campaign generates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {type.contentFormats.map((format, idx) => (
              <Badge key={idx} variant="secondary">
                {format}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Share2 className="w-5 h-5" />
            Best Platforms
          </CardTitle>
          <CardDescription>
            Where this content performs best
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {type.platforms.map((platform, idx) => {
              const iconName = platformIcons[platform] || 'Globe';
              const PlatformIcon = (Icons as any)[iconName] || Icons.Globe;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <PlatformIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{platform}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Database className="w-5 h-5" />
            Intelligence Sources
          </CardTitle>
          <CardDescription>
            Data sources analyzed for this campaign type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {type.dataSources.map((source, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded"
              >
                <Icons.Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{source}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confidence Indicator */}
      {type.confidenceScore !== undefined && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Data Match Confidence
                </p>
                <p className="text-3xl font-bold">
                  {Math.round(type.confidenceScore * 100)}%
                </p>
              </div>
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                'bg-gradient-to-br',
                colors.gradient
              )}>
                <Icons.TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            {type.recommendationReason && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why this works: </span>
                  {type.recommendationReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
