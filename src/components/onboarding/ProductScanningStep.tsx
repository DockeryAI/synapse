/**
 * ProductScanningStep Component
 *
 * Orchestrates the product scanning workflow:
 * 1. Scans website content for products/services
 * 2. Displays results in ProductReview component
 * 3. Saves confirmed products to database
 */

import React, { useState, useEffect } from 'react';
import { ProductReview } from './ProductReview';
import { productScannerService } from '../../services/intelligence/product-scanner.service';
import type { Product, ProductScanResult } from '../../types/product.types';
import { Card, CardContent } from '@/components/ui/card';
import * as Icons from 'lucide-react';

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
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Icons.Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Scanning your website...
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            Our AI is analyzing your website content to identify the products
            and services you offer.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error && !scanResult) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <Icons.AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Scanning Failed
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {error}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleScan}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Icons.RefreshCw className="w-4 h-4 mr-2 inline" />
              Retry Scan
            </button>
            {onSkip && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Skip for Now
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show review component
  if (scanResult) {
    return (
      <div className={className}>
        {/* Confidence Banner */}
        {scanResult.confidence < 0.5 && scanResult.products.length > 0 && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Icons.AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Low Confidence Detection
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  We had difficulty identifying your products/services from the website.
                  Please review carefully and make any necessary edits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner (if error during save) */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Icons.XCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Save Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Primary Offering Highlight */}
        {scanResult.primaryOffering && (
          <div className="mb-6 p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border-l-4 border-primary">
            <div className="flex items-start gap-3">
              <Icons.Award className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Primary Offering Identified</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We identified <strong>{scanResult.primaryOffering}</strong> as your main product/service
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Product Review Component */}
        <ProductReview
          products={scanResult.products}
          onConfirm={handleConfirm}
          onSkip={handleSkip}
          isLoading={isSaving}
        />
      </div>
    );
  }

  // Initial state (shouldn't reach here with autoScan=true)
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Icons.Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          Ready to Scan
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Click below to scan your website for products and services
        </p>
        <button
          onClick={handleScan}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Icons.Search className="w-4 h-4 mr-2 inline" />
          Scan Website
        </button>
      </CardContent>
    </Card>
  );
};
