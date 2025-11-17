/**
 * SmartSuggestions Component
 *
 * AI-generated campaign and post suggestions based on business insights.
 *
 * Three-column layout:
 * 1. Suggested Campaigns (3-4 full campaign ideas)
 * 2. Quick Posts (4-5 single post ideas)
 * 3. Custom Builder (build from scratch)
 *
 * Suggestions intelligently generated from actual business data.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Zap,
  Wand2,
  Star,
  TrendingUp,
  Users,
  MessageCircle,
  Award,
  Lightbulb,
  Target,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExtractedUVPData } from '@/types/smart-uvp.types';

interface WebsiteMessagingAnalysis {
  valuePropositions: string[];
  targetAudience: string[];
  customerProblems: string[];
  solutions: string[];
  proofPoints: string[];
  differentiators: string[];
  confidence: number;
}

interface RefinedBusinessData {
  businessName: string;
  specialization: string;
  location: string;
  selectedServices: string[];
  selectedCustomers: string[];
  selectedValueProps: string[];
  selectedTestimonials: string[];
}

export interface CampaignSuggestion {
  id: string;
  name: string;
  description: string;
  postCount: number;
  timeline: string;
  reasoning: string;
  icon: React.ReactNode;
  color: string;
  platforms: string[];
  expectedResults: string[];
}

export interface PostSuggestion {
  id: string;
  type: 'customer_success' | 'service_spotlight' | 'problem_solution' | 'value_proposition' | 'community_engagement';
  title: string;
  description: string;
  previewSnippet: string;
  icon: React.ReactNode;
  color: string;
  platform: string;
}

export interface SuggestionData {
  campaigns: CampaignSuggestion[];
  posts: PostSuggestion[];
}

export interface SmartSuggestionsProps {
  refinedData: RefinedBusinessData;
  uvpData: ExtractedUVPData;
  websiteAnalysis: WebsiteMessagingAnalysis;
  onSelectCampaign: (campaignId: string) => void;
  onSelectPost: (postId: string) => void;
  onBuildCustom: () => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  refinedData,
  uvpData,
  websiteAnalysis,
  onSelectCampaign,
  onSelectPost,
  onBuildCustom,
}) => {
  // Generate intelligent campaign suggestions based on business data
  const generateCampaignSuggestions = (): CampaignSuggestion[] => {
    const campaigns: CampaignSuggestion[] = [];
    const hasTestimonials = refinedData.selectedTestimonials.length > 0;
    const primaryCustomer = refinedData.selectedCustomers[0] || 'customers';
    const topService = refinedData.selectedServices[0] || 'services';
    const primaryValueProp = refinedData.selectedValueProps[0] || 'unique value';

    // Campaign 1: Customer Success Stories (if testimonials available)
    if (hasTestimonials) {
      campaigns.push({
        id: 'success-stories-campaign',
        name: 'Customer Success Showcase',
        description: `7-day campaign highlighting real results from your ${primaryCustomer}`,
        postCount: 7,
        timeline: '7 days',
        reasoning: `You have ${refinedData.selectedTestimonials.length} testimonials. Social proof builds trust and drives conversions.`,
        icon: <Star className="w-6 h-6" />,
        color: 'from-yellow-500 to-orange-500',
        platforms: ['LinkedIn', 'Facebook', 'Instagram'],
        expectedResults: ['Higher engagement', 'Build trust', 'Drive conversions'],
      });
    }

    // Campaign 2: Service Education
    campaigns.push({
      id: 'service-education-campaign',
      name: 'Service Deep Dive',
      description: `10-day campaign educating ${primaryCustomer} about ${topService}`,
      postCount: 10,
      timeline: '10 days',
      reasoning: `You offer ${refinedData.selectedServices.length} services. Educating prospects builds authority and generates qualified leads.`,
      icon: <Lightbulb className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      platforms: ['LinkedIn', 'Twitter', 'Facebook'],
      expectedResults: ['Position as expert', 'Generate leads', 'Increase awareness'],
    });

    // Campaign 3: Problem/Solution Series
    if (websiteAnalysis.customerProblems.length > 0) {
      campaigns.push({
        id: 'problem-solution-campaign',
        name: 'Problem Solver Series',
        description: `14-day campaign addressing ${websiteAnalysis.customerProblems.length} pain points your ${primaryCustomer} face`,
        postCount: 14,
        timeline: '14 days',
        reasoning: `You solve specific problems. Addressing pain points directly resonates with ideal customers.`,
        icon: <Target className="w-6 h-6" />,
        color: 'from-purple-500 to-pink-500',
        platforms: ['LinkedIn', 'Facebook'],
        expectedResults: ['Attract ideal customers', 'Demonstrate expertise', 'Build pipeline'],
      });
    }

    // Campaign 4: Value Proposition Launch
    campaigns.push({
      id: 'value-launch-campaign',
      name: 'Value Proposition Launch',
      description: `7-day campaign showcasing ${primaryValueProp}`,
      postCount: 7,
      timeline: '7 days',
      reasoning: `Your differentiators make you unique. A focused campaign highlights what sets you apart.`,
      icon: <Award className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      platforms: ['LinkedIn', 'Instagram', 'Twitter'],
      expectedResults: ['Stand out from competitors', 'Clarify positioning', 'Attract premium clients'],
    });

    return campaigns.slice(0, 4);
  };

  // Generate intelligent post suggestions based on business data
  const generatePostSuggestions = (): PostSuggestion[] => {
    const posts: PostSuggestion[] = [];
    const primaryCustomer = refinedData.selectedCustomers[0] || 'customers';
    const topService = refinedData.selectedServices[0] || 'our services';
    const secondService = refinedData.selectedServices[1] || 'our solutions';
    const topProblem = websiteAnalysis.customerProblems[0] || 'common challenges';
    const topValueProp = refinedData.selectedValueProps[0] || 'what makes us different';

    // Post 1: Customer Success Story (if testimonials available)
    if (refinedData.selectedTestimonials.length > 0) {
      const testimonialSnippet = refinedData.selectedTestimonials[0].substring(0, 100);
      posts.push({
        id: 'post-customer-success',
        type: 'customer_success',
        title: 'Customer Success Story',
        description: 'Share a real result from your customer base',
        previewSnippet: `"${testimonialSnippet}..." - See how we helped ${primaryCustomer} achieve real results.`,
        icon: <Star className="w-5 h-5" />,
        color: 'from-yellow-500 to-orange-500',
        platform: 'LinkedIn',
      });
    }

    // Post 2: Service Spotlight
    posts.push({
      id: 'post-service-spotlight',
      type: 'service_spotlight',
      title: 'Service Spotlight',
      description: `Highlight ${topService} with key benefits`,
      previewSnippet: `What makes ${topService} different? Here are 3 key benefits that ${primaryCustomer} love...`,
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      platform: 'Facebook',
    });

    // Post 3: Problem/Solution
    if (websiteAnalysis.customerProblems.length > 0) {
      posts.push({
        id: 'post-problem-solution',
        type: 'problem_solution',
        title: 'Problem/Solution Post',
        description: `Address ${topProblem} your customers face`,
        previewSnippet: `Struggling with ${topProblem}? Here's how ${secondService} solves this problem for ${primaryCustomer}...`,
        icon: <Target className="w-5 h-5" />,
        color: 'from-purple-500 to-pink-500',
        platform: 'LinkedIn',
      });
    }

    // Post 4: Value Proposition
    posts.push({
      id: 'post-value-prop',
      type: 'value_proposition',
      title: 'Value Proposition Post',
      description: 'Showcase what makes you unique',
      previewSnippet: `Why choose us? ${topValueProp}. Here's what that means for ${primaryCustomer}...`,
      icon: <Award className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-500',
      platform: 'Instagram',
    });

    // Post 5: Community Engagement
    posts.push({
      id: 'post-community',
      type: 'community_engagement',
      title: 'Community Engagement',
      description: `Ask a question to engage ${primaryCustomer}`,
      previewSnippet: `Question for ${primaryCustomer}: What's your biggest challenge with ${topProblem}? Let's discuss solutions in the comments...`,
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'from-indigo-500 to-violet-500',
      platform: 'LinkedIn',
    });

    return posts.slice(0, 5);
  };

  const campaignSuggestions = generateCampaignSuggestions();
  const postSuggestions = generatePostSuggestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              AI-Powered Suggestions
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Smart Content Suggestions
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Pick a ready-made campaign, quick post, or build your own
          </p>
        </motion.div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Suggested Campaigns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Suggested Campaigns
                </h2>
              </div>

              <div className="space-y-4">
                {campaignSuggestions.map((campaign, idx) => (
                  <motion.button
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    onClick={() => onSelectCampaign(campaign.id)}
                    className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-purple-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {/* Icon & Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${campaign.color} rounded-lg flex items-center justify-center text-white`}>
                        {campaign.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {campaign.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-3 text-sm">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {campaign.postCount} posts
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {campaign.timeline}
                      </span>
                    </div>

                    {/* Why This Works */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 mb-3">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                        Why this works for you:
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {campaign.reasoning}
                      </p>
                    </div>

                    {/* Expected Results */}
                    <div className="space-y-1">
                      {campaign.expectedResults.slice(0, 2).map((result, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                          {result}
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {campaign.platforms.join(', ')}
                      </span>
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        Select →
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Column 2: Quick Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Posts</h2>
            </div>

            <div className="space-y-4">
              {postSuggestions.map((post, idx) => (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  onClick={() => onSelectPost(post.id)}
                  className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${post.color} rounded-lg flex items-center justify-center text-white`}>
                      {post.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {post.description}
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700 mb-3">
                    <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-3">
                      {post.previewSnippet}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {post.platform}
                    </span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Create →
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Column 3: Custom Builder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Custom Builder</h2>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto">
                  <Wand2 className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-3">
                  Build Your Own
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                  Want more control? Create a fully custom campaign or post with our step-by-step builder.
                </p>

                {/* Custom Options List */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Choose Your Own Topics
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Select exactly what you want to talk about
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Set Custom Timeline
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Decide how many posts and when to publish
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Pick Platforms
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Target specific social media channels
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Customize Tone & Style
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Match your brand voice perfectly
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onBuildCustom}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-h-[48px]"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Build Custom Campaign
                </Button>

                {/* Alternative: Quick Single Post */}
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 mb-3">
                    Or create a single custom post
                  </p>
                  <Button
                    onClick={onBuildCustom}
                    variant="outline"
                    className="w-full min-h-[44px] border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Custom Post
                  </Button>
                </div>
              </div>

              {/* Info Card */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Pro Tip
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Our AI suggestions are based on {refinedData.selectedServices.length} services,{' '}
                      {refinedData.selectedCustomers.length} customer types, and{' '}
                      {refinedData.selectedValueProps.length} value propositions from your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
