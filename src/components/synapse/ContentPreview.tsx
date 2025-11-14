/**
 * Content Preview Component
 * Displays generated content ideas grouped by week
 *
 * Features:
 * - Group content ideas by week (4 weeks = 30 days)
 * - Display content type badges (educational, promotional, engagement)
 * - Show platform assignments
 * - Highlight specialty-focused content
 * - Show reasoning for each idea
 * - Mobile responsive grid layout
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Target,
  TrendingUp,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit,
  Check
} from 'lucide-react';

// Types
export interface ContentIdea {
  id: string;
  topic: string;
  scheduledDate: string;
  contentType: 'educational' | 'promotional' | 'engagement';
  platform: string;
  specialty: string;
  reasoning: string;
}

export interface SpecialtyDetection {
  specialty: string;
  confidence: number;
  reasoning: string;
  targetMarket: string;
  nicheKeywords: string[];
}

interface ContentPreviewProps {
  ideas: ContentIdea[];
  specialty: SpecialtyDetection;
  className?: string;
  onEditIdea?: (idea: ContentIdea) => void;
}

/**
 * ContentPreview Component
 * Main preview component for generated content calendar
 */
export const ContentPreview: React.FC<ContentPreviewProps> = ({
  ideas,
  specialty,
  className = '',
  onEditIdea
}) => {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3, 4]));

  /**
   * Group ideas by week
   */
  const groupedByWeek = ideas.reduce((acc, idea) => {
    const date = new Date(idea.scheduledDate);
    const week = Math.floor((date.getDate() - 1) / 7) + 1;
    if (!acc[week]) acc[week] = [];
    acc[week].push(idea);
    return acc;
  }, {} as Record<number, ContentIdea[]>);

  /**
   * Toggle week expansion
   */
  const toggleWeek = (week: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(week)) {
      newExpanded.delete(week);
    } else {
      newExpanded.add(week);
    }
    setExpandedWeeks(newExpanded);
  };

  /**
   * Expand all weeks
   */
  const expandAll = () => {
    setExpandedWeeks(new Set([1, 2, 3, 4]));
  };

  /**
   * Collapse all weeks
   */
  const collapseAll = () => {
    setExpandedWeeks(new Set());
  };

  /**
   * Get content type badge variant
   */
  const getContentTypeBadge = (type: string) => {
    switch (type) {
      case 'educational':
        return { variant: 'default' as const, icon: <Sparkles className="w-3 h-3 mr-1" /> };
      case 'promotional':
        return { variant: 'secondary' as const, icon: <TrendingUp className="w-3 h-3 mr-1" /> };
      case 'engagement':
        return { variant: 'outline' as const, icon: <Users className="w-3 h-3 mr-1" /> };
      default:
        return { variant: 'outline' as const, icon: null };
    }
  };

  /**
   * Get platform badge color
   */
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return 'bg-blue-100 text-blue-800';
      case 'instagram':
        return 'bg-pink-100 text-pink-800';
      case 'facebook':
        return 'bg-indigo-100 text-indigo-800';
      case 'twitter':
        return 'bg-sky-100 text-sky-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            30-Day Content Calendar Preview
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {ideas.length} posts optimized for {specialty.specialty}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {ideas.filter(i => i.contentType === 'educational').length}
            </div>
            <div className="text-xs text-muted-foreground">Educational</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {ideas.filter(i => i.contentType === 'promotional').length}
            </div>
            <div className="text-xs text-muted-foreground">Promotional</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {ideas.filter(i => i.contentType === 'engagement').length}
            </div>
            <div className="text-xs text-muted-foreground">Engagement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {ideas.filter(i => i.specialty === specialty.specialty).length}
            </div>
            <div className="text-xs text-muted-foreground">Specialty-Focused</div>
          </div>
        </div>
      </Card>

      {/* Weekly Content Groups */}
      <div className="space-y-4">
        {Object.entries(groupedByWeek)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([week, weekIdeas]) => {
            const isExpanded = expandedWeeks.has(Number(week));

            return (
              <Card key={week} className="overflow-hidden">
                {/* Week Header */}
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                  onClick={() => toggleWeek(Number(week))}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                      <h4 className="font-semibold">Week {week}</h4>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {weekIdeas.length} posts
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {new Date(weekIdeas[0].scheduledDate).toLocaleDateString()} -{' '}
                    {new Date(weekIdeas[weekIdeas.length - 1].scheduledDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Week Content */}
                {isExpanded && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {weekIdeas.map((idea) => {
                        const contentTypeBadge = getContentTypeBadge(idea.contentType);

                        return (
                          <Card key={idea.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium mb-1 line-clamp-2">{idea.topic}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(idea.scheduledDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>

                              {onEditIdea && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => onEditIdea(idea)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              )}
                            </div>

                            {/* Content Type Badge */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <Badge variant={contentTypeBadge.variant}>
                                {contentTypeBadge.icon}
                                {idea.contentType}
                              </Badge>

                              {/* Platform Badge */}
                              <Badge variant="outline" className={`text-xs ${getPlatformColor(idea.platform)}`}>
                                {idea.platform}
                              </Badge>

                              {/* Specialty Badge */}
                              {idea.specialty === specialty.specialty && (
                                <Badge variant="secondary" className="text-xs">
                                  <Target className="w-3 h-3 mr-1" />
                                  Specialty
                                </Badge>
                              )}
                            </div>

                            {/* Reasoning */}
                            <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {idea.reasoning}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      {/* Footer Summary */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-green-900 mb-1">
              Ready to Schedule
            </div>
            <div className="text-sm text-green-800">
              {ideas.length} posts spanning 30 days, all optimized for your {specialty.specialty} specialty.
              Click "Save to Calendar" to add these to your content calendar and start scheduling.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContentPreview;
