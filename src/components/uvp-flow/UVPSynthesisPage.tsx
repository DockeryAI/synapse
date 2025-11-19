/**
 * UVP Synthesis Page - UVP Flow Step 6 of 6
 *
 * Final step showing complete value proposition with Why/What/How framework
 * Displays optimized value prop statement with celebration animation
 *
 * Created: 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import {
  Sparkles,
  Copy,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Save,
  Trophy,
  Target,
  Zap,
  Heart,
  Award,
  TrendingUp,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfidenceMeter } from '@/components/onboarding-v5/ConfidenceMeter';
import { SourceCitation } from '@/components/onboarding-v5/SourceCitation';
import { InfoTooltip } from '@/components/onboarding-v5/InfoTooltip';
import type { CompleteUVP } from '@/types/uvp-flow.types';

interface UVPSynthesisPageProps {
  completeUVP: CompleteUVP;
  onEdit: (step: 'customer' | 'transformation' | 'solution' | 'benefit') => void;
  onSave: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export function UVPSynthesisPage({
  completeUVP,
  onEdit,
  onSave,
  onDownload,
  onShare
}: UVPSynthesisPageProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [copiedVP, setCopiedVP] = useState(false);
  const [copiedWhy, setCopiedWhy] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState(false);
  const [copiedHow, setCopiedHow] = useState(false);
  const [isEditingVP, setIsEditingVP] = useState(false);
  const [isEditingWhy, setIsEditingWhy] = useState(false);
  const [isEditingWhat, setIsEditingWhat] = useState(false);
  const [isEditingHow, setIsEditingHow] = useState(false);
  const [editedVP, setEditedVP] = useState(completeUVP.valuePropositionStatement);
  const [editedWhy, setEditedWhy] = useState(completeUVP.whyStatement);
  const [editedWhat, setEditedWhat] = useState(completeUVP.whatStatement);
  const [editedHow, setEditedHow] = useState(completeUVP.howStatement);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async (text: string, type: 'vp' | 'why' | 'what' | 'how') => {
    try {
      await navigator.clipboard.writeText(text);

      if (type === 'vp') setCopiedVP(true);
      else if (type === 'why') setCopiedWhy(true);
      else if (type === 'what') setCopiedWhat(true);
      else if (type === 'how') setCopiedHow(true);

      setTimeout(() => {
        if (type === 'vp') setCopiedVP(false);
        else if (type === 'why') setCopiedWhy(false);
        else if (type === 'what') setCopiedWhat(false);
        else if (type === 'how') setCopiedHow(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const allSources = [
    ...completeUVP.targetCustomer.sources,
    ...completeUVP.transformationGoal.sources,
    ...completeUVP.uniqueSolution.sources,
    ...completeUVP.keyBenefit.sources,
  ];

  // Calculate aggregate confidence
  const aggregateConfidence = {
    overall: Math.round(
      (completeUVP.targetCustomer.confidence.overall +
        completeUVP.transformationGoal.confidence.overall +
        completeUVP.uniqueSolution.confidence.overall +
        completeUVP.keyBenefit.confidence.overall) / 4
    ),
    dataQuality: Math.round(
      (completeUVP.targetCustomer.confidence.dataQuality +
        completeUVP.transformationGoal.confidence.dataQuality +
        completeUVP.uniqueSolution.confidence.dataQuality +
        completeUVP.keyBenefit.confidence.dataQuality) / 4
    ),
    modelAgreement: Math.round(
      (completeUVP.targetCustomer.confidence.modelAgreement +
        completeUVP.transformationGoal.confidence.modelAgreement +
        completeUVP.uniqueSolution.confidence.modelAgreement +
        completeUVP.keyBenefit.confidence.modelAgreement) / 4
    ),
    sourceCount: allSources.length,
    reasoning: 'Aggregate confidence across all UVP components based on data quality, source reliability, and model agreement.',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Confetti Celebration */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full"
        >
          <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            UVP Step 6 of 6: Your Complete Value Proposition
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
        >
          🎉 Your UVP is Complete!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
        >
          We've synthesized your complete value proposition from real data.
          Review, edit, and deploy it across your marketing.
        </motion.p>
      </motion.div>

      {/* Main Value Proposition Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-200 dark:border-slate-700 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Optimized Value Proposition
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingVP(!isEditingVP)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditingVP ? 'Cancel' : 'Edit'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(editedVP, 'vp')}
              className="gap-2"
            >
              {copiedVP ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {isEditingVP ? (
          <div className="space-y-4">
            <textarea
              value={editedVP}
              onChange={(e) => setEditedVP(e.target.value)}
              className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-lg leading-relaxed resize-none"
              rows={4}
            />
            <Button
              onClick={() => setIsEditingVP(false)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        ) : (
          <p className="text-2xl leading-relaxed text-gray-900 dark:text-white font-medium">
            {editedVP}
          </p>
        )}
      </motion.div>

      {/* Why/What/How Framework */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Why/What/How Framework
          </h2>
          <InfoTooltip
            title="Golden Circle Framework"
            content="Simon Sinek's Why/What/How framework helps you communicate your value proposition at three levels: purpose (why), offering (what), and approach (how)."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Why Statement */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-pink-200 dark:border-pink-700 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">Why</h3>
                <InfoTooltip
                  title="Why Statement"
                  content="Your purpose and belief. Why does your business exist? What do you stand for?"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingWhy(!isEditingWhy)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(editedWhy, 'why')}
                >
                  {copiedWhy ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-semibold">
              Purpose • Belief
            </p>

            {isEditingWhy ? (
              <div className="space-y-2">
                <textarea
                  value={editedWhy}
                  onChange={(e) => setEditedWhy(e.target.value)}
                  className="w-full p-3 border-2 border-pink-300 dark:border-pink-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm resize-none"
                  rows={4}
                />
                <Button
                  size="sm"
                  onClick={() => setIsEditingWhy(false)}
                  className="gap-1 bg-pink-600 hover:bg-pink-700"
                >
                  <Check className="w-3 h-3" />
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {editedWhy}
              </p>
            )}
          </motion.div>

          {/* What Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-200 dark:border-blue-700 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">What</h3>
                <InfoTooltip
                  title="What Statement"
                  content="Your tangible offering. What do you actually provide? What products or services?"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingWhat(!isEditingWhat)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(editedWhat, 'what')}
                >
                  {copiedWhat ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-semibold">
              Tangible Offering
            </p>

            {isEditingWhat ? (
              <div className="space-y-2">
                <textarea
                  value={editedWhat}
                  onChange={(e) => setEditedWhat(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm resize-none"
                  rows={4}
                />
                <Button
                  size="sm"
                  onClick={() => setIsEditingWhat(false)}
                  className="gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="w-3 h-3" />
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {editedWhat}
              </p>
            )}
          </motion.div>

          {/* How Statement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">How</h3>
                <InfoTooltip
                  title="How Statement"
                  content="Your unique approach. How do you deliver differently? What makes your method special?"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingHow(!isEditingHow)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(editedHow, 'how')}
                >
                  {copiedHow ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-semibold">
              Unique Approach
            </p>

            {isEditingHow ? (
              <div className="space-y-2">
                <textarea
                  value={editedHow}
                  onChange={(e) => setEditedHow(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm resize-none"
                  rows={4}
                />
                <Button
                  size="sm"
                  onClick={() => setIsEditingHow(false)}
                  className="gap-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Check className="w-3 h-3" />
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {editedHow}
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Complete UVP Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6 space-y-4"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          Complete UVP Breakdown
        </h2>

        <div className="space-y-3">
          {/* Target Customer */}
          <CollapsibleSection
            title="Target Customer"
            isExpanded={expandedSections.has('customer')}
            onToggle={() => toggleSection('customer')}
            onEdit={() => onEdit('customer')}
            confidence={completeUVP.targetCustomer.confidence}
          >
            <p className="text-gray-900 dark:text-white font-medium">
              {completeUVP.targetCustomer.statement}
            </p>
            {completeUVP.targetCustomer.evidenceQuotes.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Evidence:
                </p>
                {completeUVP.targetCustomer.evidenceQuotes.map((quote, idx) => (
                  <p key={idx} className="text-sm text-gray-600 dark:text-gray-400 italic pl-4 border-l-2 border-gray-300 dark:border-slate-600">
                    "{quote}"
                  </p>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Transformation Goal */}
          <CollapsibleSection
            title="Transformation Goal"
            isExpanded={expandedSections.has('transformation')}
            onToggle={() => toggleSection('transformation')}
            onEdit={() => onEdit('transformation')}
            confidence={completeUVP.transformationGoal.confidence}
          >
            <p className="text-gray-900 dark:text-white font-medium">
              {completeUVP.transformationGoal.statement}
            </p>
            {(completeUVP.transformationGoal.emotionalDrivers.length > 0 ||
              completeUVP.transformationGoal.functionalDrivers.length > 0) && (
              <div className="mt-3 grid md:grid-cols-2 gap-4">
                {completeUVP.transformationGoal.emotionalDrivers.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Emotional Drivers:
                    </p>
                    <ul className="space-y-1">
                      {completeUVP.transformationGoal.emotionalDrivers.map((driver, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <Heart className="w-3 h-3 text-pink-500 mt-0.5 flex-shrink-0" />
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {completeUVP.transformationGoal.functionalDrivers.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Functional Drivers:
                    </p>
                    <ul className="space-y-1">
                      {completeUVP.transformationGoal.functionalDrivers.map((driver, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <Target className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* Unique Solution */}
          <CollapsibleSection
            title="Unique Solution"
            isExpanded={expandedSections.has('solution')}
            onToggle={() => toggleSection('solution')}
            onEdit={() => onEdit('solution')}
            confidence={completeUVP.uniqueSolution.confidence}
          >
            <p className="text-gray-900 dark:text-white font-medium">
              {completeUVP.uniqueSolution.statement}
            </p>
            {completeUVP.uniqueSolution.differentiators.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Differentiators:
                </p>
                {completeUVP.uniqueSolution.differentiators.map((diff) => (
                  <div key={diff.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {diff.statement}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {diff.evidence}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Key Benefit */}
          <CollapsibleSection
            title="Key Benefit"
            isExpanded={expandedSections.has('benefit')}
            onToggle={() => toggleSection('benefit')}
            onEdit={() => onEdit('benefit')}
            confidence={completeUVP.keyBenefit.confidence}
          >
            <p className="text-gray-900 dark:text-white font-medium">
              {completeUVP.keyBenefit.statement}
            </p>
            {completeUVP.keyBenefit.metrics && completeUVP.keyBenefit.metrics.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Metrics:
                </p>
                <div className="grid md:grid-cols-2 gap-2">
                  {completeUVP.keyBenefit.metrics.map((metric) => (
                    <div key={metric.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {metric.metric}
                      </p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        {metric.value}
                      </p>
                      {metric.timeframe && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          in {metric.timeframe}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>
      </motion.div>

      {/* Overall Confidence Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
          Overall Confidence Score
        </h2>
        <ConfidenceMeter score={aggregateConfidence} showBreakdown />

        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700 space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Component Breakdown:
          </p>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Target Customer:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {completeUVP.targetCustomer.confidence.overall}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transformation:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {completeUVP.transformationGoal.confidence.overall}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Solution:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {completeUVP.uniqueSolution.confidence.overall}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Benefit:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {completeUVP.keyBenefit.confidence.overall}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex flex-wrap items-center justify-center gap-4 py-8"
      >
        <Button
          onClick={onSave}
          size="lg"
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8"
        >
          <Save className="w-5 h-5" />
          Save & Finish
        </Button>
        <Button
          onClick={onDownload}
          size="lg"
          variant="outline"
          className="gap-2 text-lg px-8"
        >
          <Download className="w-5 h-5" />
          Download as PDF
        </Button>
        <Button
          onClick={onShare}
          size="lg"
          variant="outline"
          className="gap-2 text-lg px-8"
        >
          <Share2 className="w-5 h-5" />
          Share
        </Button>
      </motion.div>

      {/* Source Citations Summary */}
      {allSources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Data Sources ({allSources.length})
          </h3>
          <SourceCitation sources={allSources} />
        </motion.div>
      )}
    </div>
  );
}

/**
 * Collapsible Section Component
 */
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  confidence: any;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  onEdit,
  confidence,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border-2 border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
            {confidence.overall}% confidence
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
