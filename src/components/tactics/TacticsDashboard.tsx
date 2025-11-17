/**
 * Tactics Dashboard
 * Copy-paste tactics SMBs can start Monday morning
 *
 * Display all 6 immediate win tactics:
 * 1. UGC Contests
 * 2. Hashtag Formula (3+10+5)
 * 3. Email Capture Pages
 * 4. Seasonal Calendar
 * 5. Google My Business Posts (coming soon)
 * 6. Instagram Stories Ads (coming soon)
 *
 * Features: One-click activate, expected results, cost, "Start Monday" CTA
 */

import React, { useState } from 'react';
import {
  Tactic,
  TacticCategory,
  BusinessContext,
  UGCContestType,
  EmailCaptureTemplate,
} from '../../types/tactics.types';
import {
  Trophy,
  Hash,
  Mail,
  Calendar,
  MapPin,
  Zap,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

interface TacticsDashboardProps {
  businessContext: BusinessContext;
  onActivateTactic: (tacticId: string, config?: unknown) => void;
}

export const TacticsDashboard: React.FC<TacticsDashboardProps> = ({
  businessContext,
  onActivateTactic,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TacticCategory | 'all'>('all');

  // Define all tactics
  const tactics: Tactic[] = [
    {
      id: 'ugc-contest',
      name: 'UGC Contest Generator',
      description:
        'Auto-generate photo, video, or review contests with rules, hashtags, prizes, and post templates. Boost engagement 30% at $0 cost.',
      category: 'engagement',
      difficulty: 'easy',
      timeToImplement: '15 minutes',
      cost: 0,
      expectedResults: {
        metric: 'engagement boost',
        value: '30%',
        timeframe: 'within 2 weeks',
        confidence: 'high',
      },
      status: 'available',
      icon: 'Trophy',
      tags: ['engagement', 'ugc', 'contests', 'free'],
    },
    {
      id: 'hashtag-formula',
      name: 'Hashtag Formula Builder',
      description:
        'Generate the proven 3+10+5 hashtag formula: 3 branded + 10 niche (10K-50K) + 5 trending. Maximize reach without getting lost.',
      category: 'social',
      difficulty: 'easy',
      timeToImplement: '5 minutes',
      cost: 0,
      expectedResults: {
        metric: 'reach increase',
        value: '50%+',
        timeframe: 'immediate',
        confidence: 'high',
      },
      status: 'available',
      icon: 'Hash',
      tags: ['social', 'instagram', 'hashtags', 'free'],
    },
    {
      id: 'email-capture',
      name: 'Email Capture Pages',
      description:
        '"Link in bio" landing pages that convert followers to subscribers at 2-5%. Discount, guide, or checklist templates. GDPR compliant.',
      category: 'conversion',
      difficulty: 'easy',
      timeToImplement: '20 minutes',
      cost: 0,
      expectedResults: {
        metric: 'conversion rate',
        value: '2-5%',
        timeframe: 'ongoing',
        confidence: 'medium',
      },
      status: 'available',
      icon: 'Mail',
      tags: ['email', 'conversion', 'lead-gen', 'free'],
    },
    {
      id: 'seasonal-calendar',
      name: 'Seasonal Calendar',
      description:
        'Never miss an opportunity. Major holidays + industry dates + local events. Q4 emphasis (40% of SMB revenue). 2-3 week promotion windows.',
      category: 'content',
      difficulty: 'easy',
      timeToImplement: '5 minutes',
      cost: 0,
      expectedResults: {
        metric: 'revenue capture',
        value: '40% in Q4',
        timeframe: 'seasonal',
        confidence: 'high',
      },
      status: 'available',
      icon: 'Calendar',
      tags: ['planning', 'seasonal', 'holidays', 'free'],
    },
    {
      id: 'gmb-posts',
      name: 'Google My Business Posts',
      description:
        'Auto-generate weekly GMB posts from your content. Local SEO boost, show up in "near me" searches. 2x local visibility.',
      category: 'seo',
      difficulty: 'easy',
      timeToImplement: '10 minutes',
      cost: 0,
      expectedResults: {
        metric: 'local visibility',
        value: '2x',
        timeframe: 'within 4 weeks',
        confidence: 'medium',
      },
      status: 'available',
      icon: 'MapPin',
      tags: ['local', 'seo', 'gmb', 'free'],
    },
    {
      id: 'stories-ads',
      name: 'Instagram Stories Ads',
      description:
        '$5/day Instagram Stories ads that actually convert. Auto-optimize for local audience. Reach 1000+ people for $35/week.',
      category: 'social',
      difficulty: 'medium',
      timeToImplement: '30 minutes',
      cost: 35,
      expectedResults: {
        metric: 'reach',
        value: '1000+ people',
        timeframe: 'per week',
        confidence: 'high',
      },
      status: 'available',
      icon: 'Zap',
      tags: ['ads', 'instagram', 'paid', 'local'],
    },
  ];

  const filteredTactics =
    selectedCategory === 'all'
      ? tactics
      : tactics.filter((t) => t.category === selectedCategory);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Trophy: <Trophy className="w-6 h-6" />,
      Hash: <Hash className="w-6 h-6" />,
      Mail: <Mail className="w-6 h-6" />,
      Calendar: <Calendar className="w-6 h-6" />,
      MapPin: <MapPin className="w-6 h-6" />,
      Zap: <Zap className="w-6 h-6" />,
    };
    return icons[iconName] || <Zap className="w-6 h-6" />;
  };

  const getCategoryColor = (category: TacticCategory): string => {
    const colors: Record<TacticCategory, string> = {
      content: 'bg-blue-100 text-blue-700',
      engagement: 'bg-purple-100 text-purple-700',
      conversion: 'bg-green-100 text-green-700',
      seo: 'bg-orange-100 text-orange-700',
      email: 'bg-pink-100 text-pink-700',
      social: 'bg-indigo-100 text-indigo-700',
    };
    return colors[category];
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      easy: 'text-green-600',
      medium: 'text-yellow-600',
      hard: 'text-red-600',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Immediate Win Tactics</h1>
        <p className="text-xl text-gray-600">
          Copy-paste tactics you can start Monday morning. Zero cost, proven results.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Tactics ({tactics.length})
        </button>
        {(['content', 'engagement', 'conversion', 'seo', 'email', 'social'] as TacticCategory[]).map(
          (cat) => {
            const count = tactics.filter((t) => t.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Free Tactics</div>
          <div className="text-3xl font-bold">{tactics.filter((t) => t.cost === 0).length}</div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Avg Setup Time</div>
          <div className="text-3xl font-bold">15 min</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Easy to Start</div>
          <div className="text-3xl font-bold">
            {tactics.filter((t) => t.difficulty === 'easy').length}
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Available Now</div>
          <div className="text-3xl font-bold">
            {tactics.filter((t) => t.status === 'available').length}
          </div>
        </div>
      </div>

      {/* Tactics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTactics.map((tactic) => (
          <div
            key={tactic.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
              <div className="flex items-start justify-between mb-2">
                <div className="bg-white/20 rounded-lg p-2">
                  {getIconComponent(tactic.icon)}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(tactic.category)}`}>
                  {tactic.category}
                </span>
              </div>
              <h3 className="text-xl font-bold">{tactic.name}</h3>
            </div>

            {/* Card Body */}
            <div className="p-4">
              <p className="text-gray-600 mb-4 min-h-[60px]">{tactic.description}</p>

              {/* Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-700">
                    <span className="font-medium">Setup:</span> {tactic.timeToImplement}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-700">
                    <span className="font-medium">Cost:</span>{' '}
                    {tactic.cost === 0 ? (
                      <span className="text-green-600 font-bold">FREE</span>
                    ) : (
                      `$${tactic.cost}/week`
                    )}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-700">
                    <span className="font-medium">Difficulty:</span>{' '}
                    <span className={`capitalize ${getDifficultyColor(tactic.difficulty)}`}>
                      {tactic.difficulty}
                    </span>
                  </span>
                </div>
              </div>

              {/* Expected Results */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-900">Expected Results</div>
                    <div className="text-sm text-green-700">
                      {tactic.expectedResults.value} {tactic.expectedResults.metric}{' '}
                      <span className="text-green-600">{tactic.expectedResults.timeframe}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {tactic.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onActivateTactic(tactic.id)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center group"
              >
                <span>Start Monday</span>
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTactics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tactics found</h3>
          <p className="text-gray-500">Try selecting a different category</p>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to Start Winning?</h2>
        <p className="text-lg opacity-90 mb-6">
          Pick a tactic above and implement it this Monday. 15 minutes to your first win.
        </p>
        <div className="flex items-center justify-center gap-8 text-sm">
          <div>
            <div className="text-3xl font-bold">{tactics.filter((t) => t.cost === 0).length}</div>
            <div className="opacity-75">Free Tactics</div>
          </div>
          <div>
            <div className="text-3xl font-bold">15min</div>
            <div className="opacity-75">Average Setup</div>
          </div>
          <div>
            <div className="text-3xl font-bold">30%+</div>
            <div className="opacity-75">Engagement Boost</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticsDashboard;
