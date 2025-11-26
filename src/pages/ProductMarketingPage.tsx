/**
 * Product Marketing Page
 *
 * Manage product catalog and extract products from various sources.
 * Styled to match Synapse design language.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Sparkles,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Globe,
  MessageSquare,
  Key,
  FileText,
  X,
  Edit3,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useProductCatalog,
  useProductExtraction,
  type Product,
  type CreateProductDTO,
  type UpdateProductDTO,
  type ProductStatus,
  type ExtractionSourcesConfig,
} from '../features/product-marketing';

// Demo brand ID - in production this would come from auth context
const DEMO_BRAND_ID = 'demo-brand-001';

// Status color mapping
const statusColors: Record<ProductStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  seasonal: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  discontinued: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  draft: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};

// Source icons
const sourceIcons: Record<keyof ExtractionSourcesConfig, React.ReactNode> = {
  uvp: <FileText className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  reviews: <MessageSquare className="w-4 h-4" />,
  keywords: <Key className="w-4 h-4" />,
};

export function ProductMarketingPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'extraction'>('catalog');
  const [showEditor, setShowEditor] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'draft' as ProductStatus,
    isService: false,
    tags: '',
  });

  // Product catalog hook
  const catalog = useProductCatalog({
    brandId: DEMO_BRAND_ID,
    autoLoad: true,
  });

  // Product extraction hook
  const extraction = useProductExtraction({
    brandId: DEMO_BRAND_ID,
    onComplete: () => catalog.refresh(),
  });

  // Handle form submit
  const handleSaveProduct = async () => {
    const data: CreateProductDTO = {
      name: formData.name,
      description: formData.description || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      status: formData.status,
      isService: formData.isService,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    };

    if (editingProduct) {
      await catalog.update(editingProduct.id, data as UpdateProductDTO);
    } else {
      await catalog.create(data);
    }

    setShowEditor(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', status: 'draft', isService: false, tags: '' });
  };

  // Open editor for new product
  const openNewProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', status: 'draft', isService: false, tags: '' });
    setShowEditor(true);
  };

  // Open editor for existing product
  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      status: product.status,
      isService: product.isService || false,
      tags: product.tags?.join(', ') || '',
    });
    setShowEditor(true);
  };

  // Save extracted products
  const handleSaveExtracted = async () => {
    const count = await extraction.saveSelectedProducts();
    if (count > 0) {
      extraction.clearResults();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Product Catalog
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage products and extract from various sources
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => catalog.refresh()}
                disabled={catalog.isLoading}
                className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${catalog.isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={openNewProduct}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Catalog ({catalog.pagination.total})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('extraction')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'extraction'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Extract Products
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Catalog Tab */}
          {activeTab === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search & Filter Bar */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={catalog.searchQuery}
                    onChange={(e) => catalog.search(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <select
                  value={catalog.filters.status?.toString() || ''}
                  onChange={(e) =>
                    catalog.setFilters({
                      ...catalog.filters,
                      status: e.target.value ? (e.target.value as ProductStatus) : undefined,
                    })
                  }
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-200"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              {/* Error Display */}
              {catalog.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
                >
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-400">{catalog.error}</span>
                </motion.div>
              )}

              {/* Product Grid */}
              {catalog.isLoading && catalog.products.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 animate-pulse">
                      <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-lg mb-4" />
                      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : catalog.products.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No products yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Add your first product or extract from sources
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={openNewProduct}
                      variant="outline"
                      className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Manually
                    </Button>
                    <Button
                      onClick={() => setActiveTab('extraction')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract Products
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catalog.products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
                    >
                      {/* Product Image Placeholder */}
                      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                        <span className="text-4xl">{product.isService ? '🔧' : '📦'}</span>
                      </div>

                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {product.name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${statusColors[product.status].bg} ${statusColors[product.status].text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[product.status].dot}`} />
                            {product.status}
                          </span>
                        </div>

                        {/* Description */}
                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        )}

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {product.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {product.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{product.tags.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
                          {product.price ? (
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${product.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">No price set</span>
                          )}

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditProduct(product)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${product.name}"?`)) {
                                  catalog.remove(product.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load More */}
              {catalog.pagination.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => catalog.loadMore()}
                    disabled={catalog.isLoadingMore}
                    className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    {catalog.isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Extraction Tab */}
          {activeTab === 'extraction' && (
            <motion.div
              key="extraction"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Source Selection */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Extract Products From
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Object.keys(extraction.availableSources) as Array<keyof ExtractionSourcesConfig>).map((source) => (
                    <button
                      key={source}
                      onClick={() => extraction.startQuickExtraction(source)}
                      disabled={extraction.isExtracting || !extraction.availableSources[source]}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        extraction.availableSources[source]
                          ? 'border-gray-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                          : 'border-gray-100 dark:border-slate-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-3 rounded-lg ${
                          extraction.availableSources[source]
                            ? 'bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                        }`}>
                          {sourceIcons[source]}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {source === 'uvp' ? 'UVP Data' : source}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <Button
                    onClick={() => extraction.startFullExtraction()}
                    disabled={extraction.isExtracting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                  >
                    {extraction.isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Extract From All Sources
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress */}
              {extraction.progress && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Extraction Progress
                    </h3>
                    <span className="text-sm text-gray-500">
                      {extraction.progress.sourcesCompleted} / {extraction.progress.totalSources} sources
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(extraction.progress.sourcesCompleted / extraction.progress.totalSources) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Processing: <span className="font-medium capitalize">{extraction.progress.currentSource}</span>
                    {' • '}
                    Found: <span className="font-medium">{extraction.progress.productsFound} products</span>
                  </p>
                  {extraction.isExtracting && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => extraction.cancelExtraction()}
                      className="mt-4 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Error */}
              {extraction.error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3"
                >
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-400">{extraction.error}</span>
                </motion.div>
              )}

              {/* Results */}
              {extraction.extractedProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Extracted Products ({extraction.extractedProducts.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => extraction.selectAllProducts()}
                        className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => extraction.clearSelection()}
                        className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {extraction.extractedProducts.map((product) => (
                      <div
                        key={product.tempId}
                        onClick={() => extraction.toggleProductSelection(product.tempId)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          extraction.selectedProducts.has(product.tempId)
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              extraction.selectedProducts.has(product.tempId)
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300 dark:border-slate-600'
                            }`}>
                              {extraction.selectedProducts.has(product.tempId) && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded capitalize">
                              {product.source}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(product.confidence * 100)}% conf
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {extraction.selectedProducts.size > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <Button
                        onClick={handleSaveExtracted}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Save {extraction.selectedProducts.size} Selected Products
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe your product"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isService"
                    checked={formData.isService}
                    onChange={(e) => setFormData({ ...formData, isService: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isService" className="text-sm text-gray-700 dark:text-gray-300">
                    This is a service (not a physical product)
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditor(false)}
                  className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProduct}
                  disabled={!formData.name.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProductMarketingPage;
