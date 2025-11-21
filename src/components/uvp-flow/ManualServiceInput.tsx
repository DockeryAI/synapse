/**
 * Manual Service Input Component
 *
 * Allows users to manually add services/products that weren't detected
 * Includes guided questions for JTBD-based value extraction
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Lightbulb,
  X,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { outcomeMapper } from '@/services/intelligence/outcome-mapper.service';
import type { ProductService } from '@/types/uvp-flow.types';

interface ManualServiceInputProps {
  onAdd: (service: ProductService) => void;
  existingServices?: ProductService[];
  businessName?: string;
}

interface ServiceFormData {
  name: string;
  whatItDoes: string;
  whoItsFor: string;
  problemItSolves: string;
  transformation: string;
}

const GUIDED_QUESTIONS = [
  {
    field: 'name',
    label: 'What service or product are you offering?',
    helper: 'Be specific (e.g., "Tax Resolution Services" not just "Tax Help")',
    placeholder: 'e.g., IRS Debt Resolution, Estate Planning, Personal Injury Representation'
  },
  {
    field: 'whatItDoes',
    label: 'What does this service actually do?',
    helper: 'Describe the tangible actions or deliverables',
    placeholder: 'e.g., Negotiates payment plans with the IRS, Creates living trusts and wills'
  },
  {
    field: 'whoItsFor',
    label: 'Who specifically needs this service?',
    helper: 'Describe the person and their situation',
    placeholder: 'e.g., Small business owners facing IRS audits, Families planning their estate'
  },
  {
    field: 'problemItSolves',
    label: 'What painful problem does it solve?',
    helper: 'Focus on the emotional or financial pain',
    placeholder: 'e.g., Fear of losing business assets to IRS, Anxiety about family disputes after death'
  },
  {
    field: 'transformation',
    label: 'What transformation happens after using this service?',
    helper: 'Describe the "after" state - how is their life better?',
    placeholder: 'e.g., Peace of mind with manageable payments, Confidence that family is protected'
  }
];

export const ManualServiceInput: React.FC<ManualServiceInputProps> = ({
  onAdd,
  existingServices = [],
  businessName
}) => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    whatItDoes: '',
    whoItsFor: '',
    problemItSolves: '',
    transformation: ''
  });
  const [quickAddName, setQuickAddName] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setActiveStep(0);
    setFormData({
      name: '',
      whatItDoes: '',
      whoItsFor: '',
      problemItSolves: '',
      transformation: ''
    });
  };

  const handleClose = () => {
    setOpen(false);
    setShowQuickAdd(false);
    setQuickAddName('');
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFieldChange = (field: keyof ServiceFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickAdd = () => {
    if (!quickAddName.trim()) return;

    // Use outcome mapper to generate JTBD data
    const tempService: ProductService = {
      id: `manual-${Date.now()}`,
      name: quickAddName.trim(),
      description: '',
      category: 'Manual',
      confidence: 100, // User-provided
      source: 'manual',
      confirmed: true
    };

    const enhanced = outcomeMapper.enhanceWithOutcomes(tempService);

    onAdd({
      ...tempService,
      description: enhanced.outcomes.valueStatement
    });

    setQuickAddName('');
    setShowQuickAdd(false);
  };

  const handleGuidedSubmit = () => {
    // Create value statement from form data
    const valueStatement = `Transform ${formData.problemItSolves} into ${formData.transformation}`;

    const newService: ProductService = {
      id: `manual-${Date.now()}`,
      name: formData.name,
      description: valueStatement,
      category: 'Manual',
      confidence: 100, // User-provided is high confidence
      source: 'manual',
      confirmed: true
    };

    onAdd(newService);
    handleClose();
  };

  const isStepComplete = (step: number) => {
    const field = GUIDED_QUESTIONS[step].field;
    return formData[field as keyof ServiceFormData].trim().length > 0;
  };

  const currentQuestion = GUIDED_QUESTIONS[activeStep];

  return (
    <>
      {/* Add Service Button */}
      <div className="mt-4 mb-4">
        <Button
          variant="outline"
          onClick={handleOpen}
          className="w-full border-dashed border-2 py-6 gap-2 border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        >
          <Plus className="w-5 h-5" />
          Add a service we missed
        </Button>

        {/* Quick Add Option */}
        <AnimatePresence>
          {showQuickAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter service name..."
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAdd();
                    if (e.key === 'Escape') setShowQuickAdd(false);
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleQuickAdd}
                  disabled={!quickAddName.trim()}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowQuickAdd(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showQuickAdd && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowQuickAdd(true)}
          >
            Quick add (name only)
          </Button>
        )}
      </div>

      {/* Guided Input Dialog */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={handleClose}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Add a Service or Product
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Let's understand what value this service provides to customers
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeStep < GUIDED_QUESTIONS.length && (
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Step {activeStep + 1} of {GUIDED_QUESTIONS.length}
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          {Math.round(((activeStep + 1) / GUIDED_QUESTIONS.length) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${((activeStep + 1) / GUIDED_QUESTIONS.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Question */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 These questions help us create a powerful value proposition that focuses on customer outcomes, not just features.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                        {currentQuestion.label}
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentQuestion.helper}
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder={currentQuestion.placeholder}
                        value={formData[currentQuestion.field as keyof ServiceFormData]}
                        onChange={(e) => handleFieldChange(
                          currentQuestion.field as keyof ServiceFormData,
                          e.target.value
                        )}
                        autoFocus
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        className="gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={!isStepComplete(activeStep)}
                        className="gap-2"
                      >
                        {activeStep === GUIDED_QUESTIONS.length - 1 ? 'Review' : 'Continue'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {activeStep === GUIDED_QUESTIONS.length && (
                  <div className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                          Service Summary
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded mb-2">
                            Service
                          </span>
                          <p className="text-xl font-semibold text-gray-900 dark:text-white">
                            {formData.name}
                          </p>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <strong className="text-gray-700 dark:text-gray-300">What it does:</strong>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.whatItDoes}</p>
                          </div>

                          <div>
                            <strong className="text-gray-700 dark:text-gray-300">For:</strong>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.whoItsFor}</p>
                          </div>

                          <div>
                            <strong className="text-gray-700 dark:text-gray-300">Solves:</strong>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.problemItSolves}</p>
                          </div>

                          <div>
                            <strong className="text-gray-700 dark:text-gray-300">Creates:</strong>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.transformation}</p>
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-4">
                          <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                            Generated Value Statement:
                          </p>
                          <p className="text-purple-700 dark:text-purple-300">
                            "Transform {formData.problemItSolves} into {formData.transformation}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Final Actions */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        className="gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        onClick={handleGuidedSubmit}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Add This Service
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
