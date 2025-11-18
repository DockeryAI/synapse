/**
 * SinglePostTypeSelector Component
 *
 * 5 post types with SOURCE REQUIREMENT badges.
 * Customer Success Stories REQUIRE user input or source link - NO FABRICATION.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Shield,
  Link as LinkIcon,
  Edit3,
  BookOpen,
  Mail,
  GraduationCap,
} from 'lucide-react';
import type { PostType } from '@/types/campaign-generation.types';

interface PostTypeOption {
  id: PostType;
  title: string;
  description: string;
  badge: {
    text: string;
    type: 'user_input' | 'source_verified' | 'fact_based';
  };
  icon: React.ReactNode;
  example: string;
  requiresModal: boolean;
}

const POST_TYPES: PostTypeOption[] = [
  {
    id: 'customer_success',
    title: 'Customer Success Story',
    description: 'Share real results from actual customers. Builds trust through proof.',
    badge: { text: 'User Input Required', type: 'user_input' },
    icon: <Star className="w-6 h-6" />,
    example: '"How [Customer] achieved [Result] with our [Service]"',
    requiresModal: true,
  },
  {
    id: 'service_spotlight',
    title: 'Service Spotlight',
    description: 'Highlight a specific service with verified website data.',
    badge: { text: 'Source Verified', type: 'source_verified' },
    icon: <Lightbulb className="w-6 h-6" />,
    example: '"What makes our [Service] different: [Key Benefits]"',
    requiresModal: false,
  },
  {
    id: 'problem_solution',
    title: 'Problem/Solution Post',
    description: 'Address customer pain points with your verified solutions.',
    badge: { text: 'Source Verified', type: 'source_verified' },
    icon: <AlertCircle className="w-6 h-6" />,
    example: '"Struggling with [Problem]? Here\'s how we solve it..."',
    requiresModal: false,
  },
  {
    id: 'value_proposition',
    title: 'Value Proposition Post',
    description: 'Showcase what makes you unique using verified differentiators.',
    badge: { text: 'Source Verified', type: 'source_verified' },
    icon: <TrendingUp className="w-6 h-6" />,
    example: '"Why choose us? [Verified Differentiators]"',
    requiresModal: false,
  },
  {
    id: 'community_engagement',
    title: 'Community Engagement',
    description: 'Ask fact-based questions to engage your audience.',
    badge: { text: 'Fact-Based', type: 'fact_based' },
    icon: <MessageCircle className="w-6 h-6" />,
    example: '"What\'s your biggest challenge with [Topic]?"',
    requiresModal: false,
  },
  {
    id: 'educational',
    title: 'Educational Content',
    description: 'In-depth article based on your expertise and verified content.',
    badge: { text: 'Source Verified', type: 'source_verified' },
    icon: <BookOpen className="w-6 h-6" />,
    example: '"The Complete Guide to [Service/Topic]"',
    requiresModal: false,
  },
  {
    id: 'promotional',
    title: 'Promotional Content',
    description: 'Promotional content highlighting your services or offerings.',
    badge: { text: 'Source Verified', type: 'source_verified' },
    icon: <Mail className="w-6 h-6" />,
    example: '"Special offer: [Service/Product]"',
    requiresModal: false,
  },
  {
    id: 'behind_the_scenes',
    title: 'Behind the Scenes',
    description: 'Share insights about your process or business operations.',
    badge: { text: 'Source Verified', type: 'source_verified' },
    icon: <GraduationCap className="w-6 h-6" />,
    example: '"How we [Process/Method]"',
    requiresModal: false,
  },
];

interface SinglePostTypeSelectorProps {
  onSelectType: (type: PostType) => void;
}

export const SinglePostTypeSelector: React.FC<SinglePostTypeSelectorProps> = ({ onSelectType }) => {
  const getBadgeStyles = (type: 'user_input' | 'source_verified' | 'fact_based') => {
    switch (type) {
      case 'user_input':
        return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700';
      case 'source_verified':
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'fact_based':
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
    }
  };

  const getBadgeIcon = (type: 'user_input' | 'source_verified' | 'fact_based') => {
    switch (type) {
      case 'user_input':
        return <Edit3 className="w-3 h-3" />;
      case 'source_verified':
        return <Shield className="w-3 h-3" />;
      case 'fact_based':
        return <LinkIcon className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Choose Your Post Type
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            All content is source-verified. No fabrication. Ever.
          </p>
        </div>

        {/* Post Types Grid */}
        <div className="space-y-4">
          {POST_TYPES.map((postType, index) => (
            <motion.button
              key={postType.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectType(postType.id)}
              className="w-full text-left p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-purple-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[56px]"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white">
                  {postType.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {postType.title}
                    </h3>

                    {/* Badge */}
                    <span
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap
                        ${getBadgeStyles(postType.badge.type)}
                      `}
                    >
                      {getBadgeIcon(postType.badge.type)}
                      {postType.badge.text}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {postType.description}
                  </p>

                  {/* Example */}
                  <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                      Example:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      {postType.example}
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              100% Authentic Content - Sources Always Visible
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
