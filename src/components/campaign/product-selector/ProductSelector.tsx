/**
 * Product Selector Component for Campaign Builder
 *
 * Allows users to select products/services to feature in their campaigns.
 * Integrates with the product catalog and shows AI recommendations.
 *
 * Part of Phase 4: Campaign Builder Integration
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Star,
  TrendingUp,
  Calendar,
  Check,
  Search,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { productsApiService } from '@/services/api/products.service';
import type { Product } from '@/features/product-marketing/types/product.types';
import type { ProductRecommendation } from '@/services/product-marketing/product-recommendation.service';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductSelectorProps {
  brandId: string;
  /** Pre-selected products */
  selectedProducts?: Product[];
  /** Callback when selection changes */
  onSelectionChange: (products: Product[]) => void;
  /** Optional product recommendations from AI */
  recommendations?: ProductRecommendation[];
  /** Maximum products that can be selected */
  maxSelection?: number;
  /** Whether to show recommendations section */
  showRecommendations?: boolean;
  /** Campaign type for context */
  campaignType?: string;
}

interface ProductCardCompactProps {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  recommendation?: ProductRecommendation;
}

// ============================================================================
// PRODUCT CARD COMPACT
// ============================================================================

const ProductCardCompact: React.FC<ProductCardCompactProps> = ({
  product,
  isSelected,
  onToggle,
  recommendation,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onToggle}
      className={`
        relative p-3 rounded-lg border-2 transition-all cursor-pointer
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
        }
      `}
    >
      {/* Selection indicator */}
      <div className={`
        absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${isSelected
          ? 'border-blue-500 bg-blue-500'
          : 'border-gray-300 dark:border-gray-600'
        }
      `}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* AI Recommendation badge */}
      {recommendation && (
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>AI Pick</span>
          </div>
        </div>
      )}

      {/* Product info */}
      <div className="flex items-start gap-3 pr-6">
        {/* Product icon/thumbnail */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
          {product.images && product.images.length > 0 ? (
            <img
              src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Product name */}
          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {product.name}
          </h4>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-1">
            {product.isBestseller && (
              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Best
              </span>
            )}
            {product.isFeatured && (
              <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded flex items-center gap-0.5">
                <Star className="w-3 h-3" /> Featured
              </span>
            )}
            {product.isSeasonal && (
              <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded flex items-center gap-0.5">
                <Calendar className="w-3 h-3" /> Seasonal
              </span>
            )}
          </div>

          {/* Price */}
          {(product.priceDisplay || product.price) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {product.priceDisplay || `$${product.price}`}
            </p>
          )}
        </div>
      </div>

      {/* Recommendation reason */}
      {recommendation && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-purple-600 dark:text-purple-400 line-clamp-1">
            {recommendation.reason}
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN PRODUCT SELECTOR
// ============================================================================

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  brandId,
  selectedProducts = [],
  onSelectionChange,
  recommendations = [],
  maxSelection = 3,
  showRecommendations = true,
  campaignType,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      if (!brandId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await productsApiService.getActiveProducts(brandId);

        console.log('[ProductSelector] Loaded products:', data.length);
        setProducts((data || []).map(mapRowToProduct));
      } catch (err) {
        console.error('[ProductSelector] Error:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [brandId]);

  // Filter products by search
  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Get recommended product IDs for highlighting
  const recommendedProductIds = new Set(recommendations.map(r => r.product.id));

  // Sort: recommended first, then featured, then bestseller
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aRec = recommendedProductIds.has(a.id) ? 1 : 0;
    const bRec = recommendedProductIds.has(b.id) ? 1 : 0;
    if (aRec !== bRec) return bRec - aRec;
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (a.isBestseller !== b.isBestseller) return a.isBestseller ? -1 : 1;
    return 0;
  });

  // Toggle product selection
  const toggleProduct = (product: Product) => {
    const isSelected = selectedProducts.some(p => p.id === product.id);

    if (isSelected) {
      onSelectionChange(selectedProducts.filter(p => p.id !== product.id));
    } else if (selectedProducts.length < maxSelection) {
      onSelectionChange([...selectedProducts, product]);
    }
  };

  const isProductSelected = (product: Product) =>
    selectedProducts.some(p => p.id === product.id);

  const getRecommendation = (productId: string) =>
    recommendations.find(r => r.product.id === productId);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mb-3" />
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
          No Products Found
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add products in the Intelligence Library to feature them in campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Select Products to Feature
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose up to {maxSelection} products to include in your campaign
          {selectedProducts.length > 0 && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              ({selectedProducts.length} selected)
            </span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* AI Recommendations Section */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-medium text-purple-900 dark:text-purple-200">
              AI Recommended Products
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                onClick={() => toggleProduct(rec.product)}
                className={`
                  flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                  ${isProductSelected(rec.product)
                    ? 'bg-purple-100 dark:bg-purple-800/30 border border-purple-300 dark:border-purple-600'
                    : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${isProductSelected(rec.product)
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-purple-300 dark:border-purple-600'
                  }
                `}>
                  {isProductSelected(rec.product) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {rec.product.name}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                    {rec.reason}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {sortedProducts.map((product) => (
            <ProductCardCompact
              key={product.id}
              product={product}
              isSelected={isProductSelected(product)}
              onToggle={() => toggleProduct(product)}
              recommendation={getRecommendation(product.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* No results */}
      {filteredProducts.length === 0 && searchQuery && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No products match "{searchQuery}"
        </div>
      )}

      {/* Selection limit warning */}
      {selectedProducts.length >= maxSelection && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Maximum of {maxSelection} products selected. Deselect one to choose another.</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    brandId: row.brand_id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    price: row.price,
    priceDisplay: row.price_display,
    currency: row.currency || 'USD',
    features: row.features || [],
    benefits: row.benefits || [],
    images: row.images || [],
    status: row.status,
    isService: row.is_service || false,
    isFeatured: row.is_featured || false,
    isBestseller: row.is_bestseller || false,
    isSeasonal: row.is_seasonal || false,
    seasonalStart: row.seasonal_start,
    seasonalEnd: row.seasonal_end,
    tags: row.tags || [],
    externalId: row.external_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default ProductSelector;
