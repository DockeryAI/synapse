/**
 * Onboarding Flow V5 - Main Orchestrator
 *
 * Manages navigation between the 3 onboarding pages:
 * 1. Value Proposition Discovery
 * 2. Buyer Intelligence Analysis
 * 3. Core Truth Synthesis
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ValuePropositionPage, type ValueProposition } from './ValuePropositionPage';
import { BuyerIntelligencePage, type CustomerTrigger, type BuyerPersona } from './BuyerIntelligencePage';
import { CoreTruthPage, type CoreTruth } from './CoreTruthPage';
import type { Transformation } from './TransformationCascade';

type OnboardingStep = 'value-props' | 'buyer-intel' | 'core-truth' | 'complete';

interface OnboardingFlowV5Props {
  businessName: string;
  industry: string;
  websiteUrl?: string;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  valuePropositions: ValueProposition[];
  customerTriggers: CustomerTrigger[];
  buyerPersonas: BuyerPersona[];
  transformations: Transformation[];
  coreTruth: CoreTruth;
  eqScore: number;
}

export function OnboardingFlowV5({
  businessName,
  industry,
  websiteUrl,
  onComplete
}: OnboardingFlowV5Props) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('value-props');
  const [isLoading, setIsLoading] = useState(false);

  // State for each page's data
  const [valuePropositions, setValuePropositions] = useState<ValueProposition[]>([]);
  const [customerTriggers, setCustomerTriggers] = useState<CustomerTrigger[]>([]);
  const [buyerPersonas, setBuyerPersonas] = useState<BuyerPersona[]>([]);
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [coreTruth, setCoreTruth] = useState<CoreTruth | undefined>();
  const [eqScore, setEqScore] = useState<number>(50);

  /**
   * Navigation handlers
   */
  const handleNext = (from: OnboardingStep) => {
    if (from === 'value-props') {
      setCurrentStep('buyer-intel');
      // In real app: trigger buyer intelligence analysis
    } else if (from === 'buyer-intel') {
      setCurrentStep('core-truth');
      // In real app: trigger core truth synthesis
    } else if (from === 'core-truth') {
      setCurrentStep('complete');
      handleComplete();
    }
  };

  const handleBack = (to: OnboardingStep) => {
    setCurrentStep(to);
  };

  /**
   * Value Proposition handlers
   */
  const handleValidateValueProp = (id: string) => {
    setValuePropositions(prev =>
      prev.map(vp => (vp.id === id ? { ...vp, validated: !vp.validated } : vp))
    );
  };

  const handleRejectValueProp = (id: string) => {
    setValuePropositions(prev => prev.filter(vp => vp.id !== id));
  };

  const handleEditValueProp = (id: string, newStatement: string) => {
    setValuePropositions(prev =>
      prev.map(vp =>
        vp.id === id ? { ...vp, statement: newStatement, userEdited: true } : vp
      )
    );
  };

  const handleRegenerateAll = async () => {
    setIsLoading(true);
    // In real app: call AI orchestrator to regenerate
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  /**
   * Buyer Intelligence handlers
   */
  const handleValidateTrigger = (id: string) => {
    console.log('Validate trigger:', id);
  };

  const handleValidatePersona = (id: string) => {
    console.log('Validate persona:', id);
  };

  /**
   * Core Truth handlers
   */
  const handleExport = () => {
    console.log('Export core truth');
    // In real app: generate PDF or export data
  };

  /**
   * Complete onboarding
   */
  const handleComplete = () => {
    if (!coreTruth) return;

    const data: OnboardingData = {
      valuePropositions,
      customerTriggers,
      buyerPersonas,
      transformations,
      coreTruth,
      eqScore
    };

    onComplete(data);
  };

  /**
   * Progress calculation
   */
  const getProgress = (): number => {
    switch (currentStep) {
      case 'value-props':
        return 33;
      case 'buyer-intel':
        return 66;
      case 'core-truth':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {businessName} Onboarding
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentStep === 'value-props' && 'Step 1: Value Discovery'}
                {currentStep === 'buyer-intel' && 'Step 2: Buyer Intelligence'}
                {currentStep === 'core-truth' && 'Step 3: Core Truth'}
              </span>
            </div>
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {getProgress()}%
            </span>
          </div>

          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getProgress()}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="pt-24 pb-12">
        <AnimatePresence mode="wait">
          {currentStep === 'value-props' && (
            <motion.div
              key="value-props"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <ValuePropositionPage
                businessName={businessName}
                industry={industry}
                isLoading={isLoading}
                propositions={valuePropositions}
                onValidate={handleValidateValueProp}
                onReject={handleRejectValueProp}
                onEdit={handleEditValueProp}
                onRegenerateAll={handleRegenerateAll}
                onNext={() => handleNext('value-props')}
              />
            </motion.div>
          )}

          {currentStep === 'buyer-intel' && (
            <motion.div
              key="buyer-intel"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <BuyerIntelligencePage
                businessName={businessName}
                industry={industry}
                isLoading={isLoading}
                triggers={customerTriggers}
                personas={buyerPersonas}
                transformations={transformations}
                eqScore={eqScore}
                onValidateTrigger={handleValidateTrigger}
                onValidatePersona={handleValidatePersona}
                onNext={() => handleNext('buyer-intel')}
                onBack={() => handleBack('value-props')}
              />
            </motion.div>
          )}

          {currentStep === 'core-truth' && (
            <motion.div
              key="core-truth"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <CoreTruthPage
                businessName={businessName}
                industry={industry}
                isLoading={isLoading}
                coreTruth={coreTruth}
                onComplete={() => handleNext('core-truth')}
                onBack={() => handleBack('buyer-intel')}
                onExport={handleExport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
