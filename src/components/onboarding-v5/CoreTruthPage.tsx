/**
 * Core Truth Page - Onboarding V5
 *
 * Final page of the 3-page onboarding flow
 * Synthesizes all discoveries into a cohesive brand narrative and messaging framework
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Download,
  Share2,
  Copy,
  MessageSquare,
  Target,
  Heart,
  Zap,
  Crown
} from 'lucide-react';
import { ConfidenceMeter, type ConfidenceScore } from './ConfidenceMeter';
import { TransformationCard } from './TransformationCascade';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Transformation } from './TransformationCascade';

export interface CoreTruth {
  id: string;
  narrative: string; // The core brand narrative (2-3 sentences)
  tagline: string; // Punchy tagline
  positioning: string; // Market positioning statement
  messagingPillars: MessagingPillar[];
  brandVoice: {
    personality: string[];
    tone: string[];
    avoidWords: string[];
  };
  keyTransformation: Transformation;
  confidence: ConfidenceScore;
}

export interface MessagingPillar {
  id: string;
  title: string;
  description: string;
  supportingPoints: string[];
  whenToUse: string; // Context for using this pillar
}

interface CoreTruthPageProps {
  businessName: string;
  industry: string;
  isLoading?: boolean;
  coreTruth?: CoreTruth;
  onComplete: () => void;
  onBack: () => void;
  onExport: () => void;
}

export function CoreTruthPage({
  businessName,
  industry,
  isLoading = false,
  coreTruth,
  onComplete,
  onBack,
  onExport
}: CoreTruthPageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNarrative = () => {
    if (coreTruth) {
      navigator.clipboard.writeText(coreTruth.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full">
          <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Step 3 of 3: Your Core Truth
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Your Brand's Core Truth
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We've synthesized all insights into a cohesive brand narrative that captures
          the essence of what makes {businessName} unique and valuable.
        </p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      )}

      {/* Core Truth Content */}
      {!isLoading && coreTruth && (
        <div className="space-y-6">
          {/* Main Narrative */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-purple-300 dark:border-purple-700 p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Core Brand Narrative
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The essence of your brand in one statement
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyNarrative}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <p className="text-xl md:text-2xl leading-relaxed text-gray-900 dark:text-white font-medium mb-6">
              {coreTruth.narrative}
            </p>

            <div className="pt-6 border-t-2 border-purple-200 dark:border-purple-800">
              <ConfidenceMeter score={coreTruth.confidence} />
            </div>
          </motion.div>

          {/* Tagline & Positioning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tagline
                </h3>
              </div>
              <p className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                "{coreTruth.tagline}"
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Market Positioning
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {coreTruth.positioning}
              </p>
            </motion.div>
          </div>

          {/* Key Transformation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Primary Customer Transformation
            </h3>
            <TransformationCard transformation={coreTruth.keyTransformation} />
          </motion.div>

          {/* Messaging Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Messaging Pillars
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coreTruth.messagingPillars.map((pillar, index) => (
                <div
                  key={pillar.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                      {index === 0 && <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                      {index === 1 && <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                      {index === 2 && <Target className="w-5 h-5 text-green-600 dark:text-green-400" />}
                      {index >= 3 && <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {pillar.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pillar.description}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-1 pl-11">
                    {pillar.supportingPoints.map((point, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pl-11 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Use when: {pillar.whenToUse}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Brand Voice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Brand Voice Guidelines
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Personality
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coreTruth.brandVoice.personality.map((trait, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Tone
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coreTruth.brandVoice.tone.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Avoid Words
                </h4>
                <div className="flex flex-wrap gap-2">
                  {coreTruth.brandVoice.avoidWords.map((word, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-sm font-medium line-through"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Your Brand Foundation
            </h3>

            <div className="flex flex-wrap gap-3">
              <Button onClick={onExport} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>

              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share with Team
              </Button>

              <Button variant="outline" className="gap-2" onClick={handleCopyNarrative}>
                <Copy className="w-4 h-4" />
                Copy All Text
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Buyer Intel
        </Button>

        <Button
          onClick={onComplete}
          className="gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-lg px-8 py-6"
        >
          <CheckCircle2 className="w-5 h-5" />
          Complete Onboarding
        </Button>
      </div>

      {/* Celebration */}
      {!isLoading && coreTruth && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🎉 You're all set! Your brand foundation is ready to power your marketing.
          </p>
        </motion.div>
      )}
    </div>
  );
}
