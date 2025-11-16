/**
 * ProductScanningStep Component
 *
 * Orchestrates the product scanning workflow:
 * 1. Scans website content for products/services
 * 2. Displays results in ProductReview component
 * 3. Saves confirmed products to database
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReview } from './ProductReview';
import { productScannerService } from '../../services/intelligence/product-scanner.service';
import type { Product, ProductScanResult } from '../../types/product.types';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle, XCircle, Award, Sparkles } from 'lucide-react';

export interface ProductScanningStepProps {
  businessId: string;
  businessName: string;
  industry?: string;
  websiteContent: string;
  onComplete: (products: Product[]) => void;
  onSkip?: () => void;
  autoScan?: boolean; // Auto-scan on mount
  className?: string;
}

export const ProductScanningStep: React.FC<ProductScanningStepProps> = ({
  businessId,
  businessName,
  industry,
  websiteContent,
  onComplete,
  onSkip,
  autoScan = true,
  className = ''
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanResult, setScanResult] = useState<ProductScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-scan on mount if enabled
  useEffect(() => {
    if (autoScan && websiteContent && !scanResult && !isScanning) {
      handleScan();
    }
  }, [autoScan, websiteContent]);

  // Perform product scan
  const handleScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      console.log('[ProductScanningStep] Starting scan...');

      const result = await productScannerService.scanProducts(
        websiteContent,
        businessName,
        industry
      );

      console.log('[ProductScanningStep] Scan complete:', result);
      setScanResult(result);
    } catch (err) {
      console.error('[ProductScanningStep] Scan failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan products');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle product confirmation
  const handleConfirm = async (confirmedProducts: Product[]) => {
    setIsSaving(true);
    setError(null);

    try {
      console.log('[ProductScanningStep] Saving', confirmedProducts.length, 'products...');

      // Save to database
      await productScannerService.saveProducts(businessId, confirmedProducts);

      console.log('[ProductScanningStep] Products saved successfully');

      // Complete the step
      onComplete(confirmedProducts);
    } catch (err) {
      console.error('[ProductScanningStep] Save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save products');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      // If no skip handler, complete with empty array
      onComplete([]);
    }
  };

  // Show loading state
  if (isScanning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="border-2 border-primary/20">
          <CardContent className="py-16">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">
                Scanning Your Website
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI is analyzing your content to discover what you sell
              </p>
            </motion.div>

            {/* Animated Spinner */}
            <div className="flex justify-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-12 h-12 text-primary" />
              </motion.div>
            </div>

            {/* Scanning Steps */}
            <motion.div
              className="max-w-md mx-auto space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[
                { emoji: '📝', text: 'Extracting product names' },
                { emoji: '💰', text: 'Identifying pricing info' },
                { emoji: '⭐', text: 'Detecting tiers & features' },
                { emoji: '🎯', text: 'Categorizing offerings' }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <span className="text-2xl">{step.emoji}</span>
                  <span className="text-muted-foreground">{step.text}</span>
                  <motion.span
                    className="ml-auto"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                  >
                    ⚡
                  </motion.span>
                </motion.div>
              ))}
            </motion.div>

            {/* Estimated Time */}
            <motion.p
              className="text-center text-sm text-muted-foreground mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              ~3-5 seconds remaining
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show error state
  if (error && !scanResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="text-6xl mb-4"
            >
              ⚠️
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">
              Scanning Failed
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              {error}
            </p>
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={handleScan}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Scan
              </button>
              {onSkip && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  Skip for Now
                </button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show review component
  if (scanResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={className}
      >
        {/* Confidence Banner */}
        <AnimatePresence>
          {scanResult.confidence < 0.5 && scanResult.products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Low Confidence Detection
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                    We had difficulty identifying your products/services from the website.
                    Please review carefully and make any necessary edits.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner (if error during save) */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">
                    Save Failed
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Offering Highlight */}
        <AnimatePresence>
          {scanResult.primaryOffering && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-5 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border-l-4 border-primary"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    Primary Offering Identified
                    <Sparkles className="w-4 h-4 text-primary" />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We identified <strong className="text-foreground">{scanResult.primaryOffering}</strong> as your main product/service
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Review Component */}
        <ProductReview
          products={scanResult.products}
          onConfirm={handleConfirm}
          onSkip={handleSkip}
          isLoading={isSaving}
        />
      </motion.div>
    );
  }

  // Initial state (shouldn't reach here with autoScan=true)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="text-6xl mb-4"
          >
            📦
          </motion.div>
          <h3 className="text-2xl font-bold mb-2">
            Ready to Scan
          </h3>
          <p className="text-muted-foreground max-w-md mb-8">
            Click below to scan your website for products and services
          </p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleScan}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Scan Website
          </motion.button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
