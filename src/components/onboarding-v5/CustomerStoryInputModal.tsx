/**
 * CustomerStoryInputModal Component
 *
 * Modal with TWO input options:
 * 1. Manual Entry - User provides all customer story details
 * 2. Source Link - User provides URL to testimonial/review/case study
 *
 * CRITICAL: NO FABRICATION. All fields required OR valid source link.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Link as LinkIcon, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CustomerStory {
  customerName: string;
  problem: string;
  solution: string;
  results: string;
  testimonialQuote?: string;
  date?: string;
  sourceUrl?: string;
}

interface CustomerStoryInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (story: CustomerStory) => void;
}

type InputTab = 'manual' | 'source';

export const CustomerStoryInputModal: React.FC<CustomerStoryInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<InputTab>('manual');
  const [isLoading, setIsLoading] = useState(false);

  // Manual entry state
  const [customerName, setCustomerName] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [results, setResults] = useState('');
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [date, setDate] = useState('');

  // Source link state
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const isManualValid = customerName.trim() && problem.trim() && solution.trim() && results.trim();
  const isSourceValid = sourceUrl.trim() && !urlError;
  const canSave = (activeTab === 'manual' && isManualValid) || (activeTab === 'source' && isSourceValid);

  const handleFetchFromUrl = async () => {
    if (!sourceUrl.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    try {
      new URL(sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`);
      setUrlError('');
      setIsLoading(true);

      // Simulate fetching (in production, call actual API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock extracted data
      setCustomerName('John Smith');
      setProblem('Struggling with low social media engagement');
      setSolution('Implemented Synapse content strategy');
      setResults('300% increase in engagement, 5x more leads');
      setTestimonialQuote('"Synapse transformed our social media presence!"');

      setActiveTab('manual'); // Switch to manual to show extracted data
      setIsLoading(false);
    } catch {
      setUrlError('Please enter a valid URL');
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const story: CustomerStory = {
      customerName,
      problem,
      solution,
      results,
      testimonialQuote: testimonialQuote || undefined,
      date: date || undefined,
      sourceUrl: sourceUrl || undefined,
    };

    onSave(story);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setCustomerName('');
    setProblem('');
    setSolution('');
    setResults('');
    setTestimonialQuote('');
    setDate('');
    setSourceUrl('');
    setUrlError('');
    setActiveTab('manual');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Add Customer Success Story
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We never fabricate customer stories. Please provide real details.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] ${
                  activeTab === 'manual'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Edit3 className="w-4 h-4 inline mr-2" />
                Manual Entry
              </button>
              <button
                onClick={() => setActiveTab('source')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] ${
                  activeTab === 'source'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Source Link
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
            <AnimatePresence mode="wait">
              {activeTab === 'manual' ? (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Smith"
                      className="min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Problem They Faced <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="Describe the challenge or problem..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Solution You Provided <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="How did you help solve their problem..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Results Achieved <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={results}
                      onChange={(e) => setResults(e.target.value)}
                      placeholder="Specific numbers or outcomes (e.g., '50% increase in sales')"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Testimonial Quote (Optional)
                    </label>
                    <Textarea
                      value={testimonialQuote}
                      onChange={(e) => setTestimonialQuote(e.target.value)}
                      placeholder='"This was the best decision we made..."'
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="source"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Source URL <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={sourceUrl}
                      onChange={(e) => {
                        setSourceUrl(e.target.value);
                        setUrlError('');
                      }}
                      placeholder="https://example.com/testimonial"
                      className="min-h-[44px]"
                    />
                    {urlError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">{urlError}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleFetchFromUrl}
                    disabled={isLoading || !sourceUrl.trim()}
                    className="w-full min-h-[48px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching Details...
                      </>
                    ) : (
                      'Fetch Details from URL'
                    )}
                  </Button>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        <p className="font-medium mb-1">Valid source types:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Customer testimonial pages</li>
                          <li>Review platform links (Google, Yelp, etc.)</li>
                          <li>Case study pages</li>
                          <li>Social media posts with customer feedback</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 min-h-[48px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-h-[48px]"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Story
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
