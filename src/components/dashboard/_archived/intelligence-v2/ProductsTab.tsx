/**
 * Products Tab Component
 *
 * Displays the product catalog in the Intelligence Library.
 * Allows selecting products for content creation.
 *
 * Part of Phase 1.3: Product Management UI
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Star,
  TrendingUp,
  Calendar,
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/features/product-marketing/types/product.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductsTabProps {
  brandId: string;
  onSelectProduct?: (product: Product) => void;
  selectedProducts?: Product[];
  onPromoteProduct?: (product: Product) => void;
}

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: () => void;
  onPromote: () => void;
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  onSelect,
  onPromote,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative p-4 rounded-xl border-2 transition-all cursor-pointer
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
        }
      `}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-blue-500" />
        </div>
      )}

      {/* Product badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        {product.isFeatured && (
          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" /> Featured
          </span>
        )}
        {product.isBestseller && (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Bestseller
          </span>
        )}
        {product.isSeasonal && (
          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Seasonal
          </span>
        )}
        {product.isService && (
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            Service
          </span>
        )}
      </div>

      {/* Product name */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
        {product.name}
      </h3>

      {/* Short description */}
      {product.shortDescription && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {product.shortDescription}
        </p>
      )}

      {/* Features preview */}
      {product.features && product.features.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {product.features.slice(0, 2).map((feature, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
            >
              {feature.length > 30 ? feature.substring(0, 27) + '...' : feature}
            </span>
          ))}
          {product.features.length > 2 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{product.features.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Price and action */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {product.priceDisplay || product.price ? (
          <span className="font-medium text-gray-900 dark:text-white">
            {product.priceDisplay || `$${product.price}`}
          </span>
        ) : (
          <span className="text-sm text-gray-500">No price set</span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPromote();
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Promote
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyState: React.FC<{ onAddProduct?: () => void }> = ({ onAddProduct }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
      <Package className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      No Products Yet
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
      Products from your UVP onboarding will appear here. You can also add products manually.
    </p>
    {onAddProduct && (
      <button
        onClick={onAddProduct}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Product
      </button>
    )}
  </div>
);

// ============================================================================
// MAIN PRODUCTS TAB COMPONENT
// ============================================================================

export const ProductsTab: React.FC<ProductsTabProps> = ({
  brandId,
  onSelectProduct,
  selectedProducts = [],
  onPromoteProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'featured' | 'bestseller' | 'seasonal'>('all');

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      if (!brandId) return;

      setLoading(true);
      try {
        // ARCHIVED COMPONENT - Direct database call disabled for security compliance
        // This component is in _archived folder and should not be used in production
        // If needed, implement proper data fetching through approved service layer
        /*
        const { data, error } = await supabase
          .from('pm_products')
          .select('*')
          .eq('brand_id', brandId)
          .eq('status', 'active')
          .order('is_featured', { ascending: false })
          .order('is_bestseller', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[ProductsTab] Failed to load products:', error);
          setProducts([]);
        } else {
          setProducts((data || []).map(mapRowToProduct));
        */

        // Return empty state for archived component
        setProducts([]);
        }
      } catch (err) {
        console.error('[ProductsTab] Error:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [brandId]);

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    switch (filter) {
      case 'featured':
        return product.isFeatured;
      case 'bestseller':
        return product.isBestseller;
      case 'seasonal':
        return product.isSeasonal;
      default:
        return true;
    }
  });

  // Handlers
  const handleSelectProduct = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const handlePromoteProduct = (product: Product) => {
    if (onPromoteProduct) {
      onPromoteProduct(product);
    }
  };

  const isProductSelected = (product: Product) =>
    selectedProducts.some(p => p.id === product.id);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'featured', 'bestseller', 'seasonal'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{filteredProducts.length} products</span>
        <span>•</span>
        <span>{products.filter(p => p.isFeatured).length} featured</span>
        <span>•</span>
        <span>{products.filter(p => p.isBestseller).length} bestsellers</span>
        {selectedProducts.length > 0 && (
          <>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400">
              {selectedProducts.length} selected
            </span>
          </>
        )}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={isProductSelected(product)}
              onSelect={() => handleSelectProduct(product)}
              onPromote={() => handlePromoteProduct(product)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* No results */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No products match your search
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

export default ProductsTab;
