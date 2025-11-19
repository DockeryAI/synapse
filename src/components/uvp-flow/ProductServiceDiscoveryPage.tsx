/**
 * Product/Service Discovery Page - UVP Flow Step 1
 *
 * Displays extracted products/services organized by category
 * for user confirmation before proceeding
 *
 * Created: 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Plus,
  ArrowRight,
  Package,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceMeter } from '@/components/onboarding-v5/ConfidenceMeter';
import { SourceCitation } from '@/components/onboarding-v5/SourceCitation';
import type { ProductServiceData, ProductService } from '@/types/uvp-flow.types';

interface ProductServiceDiscoveryPageProps {
  businessName: string;
  isLoading?: boolean;
  data?: ProductServiceData;
  onConfirm: (confirmedItems: ProductService[]) => void;
  onAddManual: (item: Partial<ProductService>) => void;
  onNext: () => void;
}

export function ProductServiceDiscoveryPage({
  businessName,
  isLoading = false,
  data,
  onConfirm,
  onAddManual,
  onNext
}: ProductServiceDiscoveryPageProps) {
  // Auto-confirm all extracted products on initial load (high confidence extractions)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(() => {
    if (!data) return new Set();
    const allItems = data.categories.flatMap(cat => cat.items);
    return new Set(allItems.map(item => item.id));
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  // Notify parent of auto-confirmed items on mount
  useEffect(() => {
    if (data && confirmedIds.size > 0) {
      const allItems = data.categories.flatMap(cat => cat.items);
      const confirmed = allItems.filter(item => confirmedIds.has(item.id));
      onConfirm(confirmed);
    }
  }, [data]); // Only run when data changes

  const toggleConfirm = (id: string) => {
    const newSet = new Set(confirmedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setConfirmedIds(newSet);

    // Update confirmed items
    if (data) {
      const allItems = data.categories.flatMap(cat => cat.items);
      const confirmed = allItems.filter(item => newSet.has(item.id));
      onConfirm(confirmed);
    }
  };

  const handleAddManual = () => {
    if (!newItemName.trim()) return;

    onAddManual({
      name: newItemName,
      description: newItemDescription,
      category: newItemCategory || 'Other',
      source: 'manual',
      confidence: 100,
      confirmed: true
    });

    // Reset form
    setNewItemName('');
    setNewItemDescription('');
    setNewItemCategory('');
    setShowAddForm(false);
  };

  const totalItems = data?.categories.reduce((sum, cat) => sum + cat.items.length, 0) || 0;
  const confirmedCount = confirmedIds.size;
  const canProceed = confirmedCount > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            UVP Step 1 of 6: Product & Service Discovery
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Confirm Your Offerings
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We've analyzed {businessName}'s website and found these products and services.
          Please confirm what you offer.
        </p>
      </motion.div>

      {/* Progress Summary */}
      {!isLoading && data && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Confirmation Progress
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {confirmedCount} of {totalItems} confirmed
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Missing
              </Button>

              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="h-2 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalItems > 0 ? (confirmedCount / totalItems) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            />
          </div>

          {/* Extraction Confidence */}
          {data.extractionConfidence && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Extraction Confidence
              </h4>
              <ConfidenceMeter score={data.extractionConfidence} compact />
            </div>
          )}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Manual Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Product/Service
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g., Website Design"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  placeholder="Brief description of this offering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g., Core Services"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddManual}
                  disabled={!newItemName.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <AnimatePresence mode="popLayout">
        {!isLoading && data?.categories.map((category, catIndex) => (
          <motion.div
            key={category.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: catIndex * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-md"
          >
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {category.name}
              </h2>
              <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                {category.items.length}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {category.items.map((item) => {
                const isConfirmed = confirmedIds.has(item.id);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={`
                      p-4 rounded-lg border transition-all cursor-pointer
                      ${isConfirmed
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }
                    `}
                    onClick={() => toggleConfirm(item.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          {item.source === 'manual' && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded">
                              Manual
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.description}
                          </p>
                        )}

                        {item.source === 'website' && item.sourceExcerpt && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                            "{item.sourceExcerpt}"
                          </p>
                        )}

                        {item.source === 'website' && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              Confidence: {item.confidence}%
                            </span>
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View source
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        {isConfirmed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && (!data || data.categories.length === 0) && (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No products or services found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't extract any offerings from your website.
            Add them manually to continue.
          </p>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Product/Service
          </Button>
        </div>
      )}

      {/* Data Sources */}
      {!isLoading && data && data.sources.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Data Sources
          </h3>
          <SourceCitation sources={data.sources} />
        </div>
      )}
    </div>
  );
}
