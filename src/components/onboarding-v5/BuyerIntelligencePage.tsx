/**
 * Buyer Intelligence Page - Onboarding V5
 *
 * Second page of the 3-page onboarding flow
 * Displays buyer psychology insights, customer triggers, and transformation journeys
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Heart,
  Zap,
  TrendingUp,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Target,
  Flame
} from 'lucide-react';
import { TransformationCascade, type Transformation } from './TransformationCascade';
import { ConfidenceMeter, type ConfidenceScore } from './ConfidenceMeter';
import { SourceCitation, type DataSource } from './SourceCitation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export interface CustomerTrigger {
  id: string;
  type: 'pain' | 'desire' | 'fear' | 'aspiration';
  description: string;
  urgency: number; // 0-100
  frequency: number; // How often this appears in data (0-100)
  emotionalWeight: number; // 0-100 (EQ score)
  sources: DataSource[];
}

export interface BuyerPersona {
  id: string;
  name: string;
  archetype: string; // e.g., "Budget-conscious parent", "Status-seeking professional"
  demographics: {
    ageRange?: string;
    income?: string;
    location?: string;
  };
  psychographics: {
    values: string[];
    fears: string[];
    goals: string[];
  };
  decisionDrivers: {
    emotional: number; // 0-100
    rational: number; // 0-100
    social: number; // 0-100
  };
  confidence: ConfidenceScore;
}

interface BuyerIntelligencePageProps {
  businessName: string;
  industry: string;
  isLoading?: boolean;
  triggers?: CustomerTrigger[];
  personas?: BuyerPersona[];
  transformations?: Transformation[];
  eqScore?: number; // Overall industry EQ score
  onValidateTrigger: (id: string) => void;
  onValidatePersona: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BuyerIntelligencePage({
  businessName,
  industry,
  isLoading = false,
  triggers = [],
  personas = [],
  transformations = [],
  eqScore = 50,
  onValidateTrigger,
  onValidatePersona,
  onNext,
  onBack
}: BuyerIntelligencePageProps) {
  const [selectedTab, setSelectedTab] = useState<'triggers' | 'personas' | 'transformations'>('triggers');

  const getTriggerIcon = (type: CustomerTrigger['type']) => {
    switch (type) {
      case 'pain':
        return <AlertCircle className="w-5 h-5" />;
      case 'desire':
        return <Heart className="w-5 h-5" />;
      case 'fear':
        return <Flame className="w-5 h-5" />;
      case 'aspiration':
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getTriggerColor = (type: CustomerTrigger['type']) => {
    switch (type) {
      case 'pain':
        return 'from-red-500 to-orange-500';
      case 'desire':
        return 'from-pink-500 to-rose-500';
      case 'fear':
        return 'from-purple-500 to-indigo-500';
      case 'aspiration':
        return 'from-blue-500 to-cyan-500';
    }
  };

  const getEQLevel = (score: number) => {
    if (score >= 70) return { label: 'Highly Emotional', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/20' };
    if (score >= 50) return { label: 'Mixed Emotional/Rational', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' };
    return { label: 'Highly Rational', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' };
  };

  const eqLevel = getEQLevel(eqScore);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
          <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Step 2 of 3: Buyer Intelligence
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Understanding Your Customers
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Deep psychological analysis of what drives your customers' purchasing decisions
        </p>
      </motion.div>

      {/* EQ Score Banner */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${eqLevel.bg} rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
                <Brain className={`w-8 h-8 ${eqLevel.color}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Industry Emotional Quotient
                </h3>
                <p className={`text-2xl font-bold ${eqLevel.color}`}>
                  {eqScore}% - {eqLevel.label}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {eqScore >= 70
                    ? 'Customers make decisions based primarily on emotions and feelings'
                    : eqScore >= 50
                    ? 'Customers balance emotional desires with rational considerations'
                    : 'Customers prioritize logic, features, and measurable outcomes'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b-2 border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSelectedTab('triggers')}
          className={`px-4 py-3 font-medium transition-all ${
            selectedTab === 'triggers'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 -mb-0.5'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Customer Triggers ({triggers.length})
          </div>
        </button>

        <button
          onClick={() => setSelectedTab('personas')}
          className={`px-4 py-3 font-medium transition-all ${
            selectedTab === 'personas'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 -mb-0.5'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Buyer Personas ({personas.length})
          </div>
        </button>

        <button
          onClick={() => setSelectedTab('transformations')}
          className={`px-4 py-3 font-medium transition-all ${
            selectedTab === 'transformations'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 -mb-0.5'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Transformations ({transformations.length})
          </div>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <Skeleton className="h-6 w-full mb-3" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Customer Triggers */}
        {!isLoading && selectedTab === 'triggers' && (
          <motion.div
            key="triggers"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {triggers.map((trigger, index) => (
              <motion.div
                key={trigger.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-gradient-to-br ${getTriggerColor(trigger.type)} rounded-lg text-white`}>
                      {getTriggerIcon(trigger.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          {trigger.type}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700">
                          {trigger.frequency}% frequency
                        </span>
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {trigger.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Urgency</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${trigger.urgency}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">
                        {trigger.urgency}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Frequency</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${trigger.frequency}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">
                        {trigger.frequency}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Emotional Weight</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                          style={{ width: `${trigger.emotionalWeight}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">
                        {trigger.emotionalWeight}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <SourceCitation sources={trigger.sources} compact />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Buyer Personas */}
        {!isLoading && selectedTab === 'personas' && (
          <motion.div
            key="personas"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {personas.map((persona, index) => (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6 space-y-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {persona.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {persona.archetype}
                  </p>
                </div>

                {/* Decision Drivers */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Decision Drivers
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Emotional</span>
                      <span className="font-medium">{persona.decisionDrivers.emotional}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Rational</span>
                      <span className="font-medium">{persona.decisionDrivers.rational}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Social</span>
                      <span className="font-medium">{persona.decisionDrivers.social}%</span>
                    </div>
                  </div>
                </div>

                {/* Psychographics */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Values
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {persona.psychographics.values.map((value, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs">
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Fears
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {persona.psychographics.fears.map((fear, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-xs">
                          {fear}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Goals
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {persona.psychographics.goals.map((goal, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <ConfidenceMeter score={persona.confidence} compact />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Transformations */}
        {!isLoading && selectedTab === 'transformations' && (
          <motion.div
            key="transformations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {transformations.map((transformation) => (
                <div
                  key={transformation.id}
                  className="p-6 rounded-xl bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">Pain Point</h4>
                        <p className="text-xs opacity-90">{transformation.painPoint}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">Desired Outcome</h4>
                        <p className="text-xs opacity-90">{transformation.pleasureGoal}</p>
                      </div>
                    </div>
                    {transformation.mechanism && (
                      <div className="pt-3 border-t border-white/20">
                        <p className="text-xs opacity-80">
                          <span className="font-semibold">How:</span> {transformation.mechanism}
                        </p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-white/20">
                      <ConfidenceMeter score={transformation.confidence} compact />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Value Props
        </Button>

        <Button onClick={onNext} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
          Continue to Core Truth
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
