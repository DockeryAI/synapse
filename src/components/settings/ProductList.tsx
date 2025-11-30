/**
 * ProductList Component
 *
 * Displays a list of brand products with edit/delete actions,
 * priority badges, confidence indicators, and source labels.
 *
 * Created: 2025-11-29
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Edit2,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Globe,
  User,
  RefreshCw,
  FileText,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BrandProduct } from '@/types/product.types';

interface ProductListProps {
  products: BrandProduct[];
  onEdit: (product: BrandProduct) => void;
  onDelete: (productId: string) => void;
  isLoading?: boolean;
}

// Source icon mapping
const sourceIcons: Record<string, React.ReactNode> = {
  website: <Globe className="w-3 h-3" />,
  manual: <User className="w-3 h-3" />,
  rescan: <RefreshCw className="w-3 h-3" />,
  uvp: <FileText className="w-3 h-3" />
};

// Source labels
const sourceLabels: Record<string, string> = {
  website: 'Website',
  manual: 'Manual',
  rescan: 'Rescan',
  uvp: 'UVP Import'
};

// Priority colors
const priorityColors: Record<string, string> = {
  primary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  addon: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
};

// Type colors
const typeColors: Record<string, string> = {
  product: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  service: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  hybrid: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
};

export function ProductList({ products, onEdit, onDelete, isLoading }: ProductListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-100 dark:bg-slate-800 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No products or services added yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Add products manually or rescan your website
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Primary badge */}
                  {product.priority === 'primary' && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}

                  {/* Product name */}
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h4>

                  {/* Confirmed indicator */}
                  {product.is_confirmed ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {product.description}
                  </p>
                )}

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Priority badge */}
                  {product.priority && (
                    <Badge
                      variant="secondary"
                      className={`text-xs capitalize ${priorityColors[product.priority] || ''}`}
                    >
                      {product.priority}
                    </Badge>
                  )}

                  {/* Type badge */}
                  {product.product_type && (
                    <Badge
                      variant="secondary"
                      className={`text-xs capitalize ${typeColors[product.product_type] || ''}`}
                    >
                      {product.product_type}
                    </Badge>
                  )}

                  {/* Tier badge */}
                  {product.tier && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {product.tier}
                    </Badge>
                  )}

                  {/* Category */}
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  )}

                  {/* Price range */}
                  {product.price_range && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {product.price_range}
                    </span>
                  )}

                  {/* Source */}
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    {sourceIcons[product.source] || <FileText className="w-3 h-3" />}
                    <span>{sourceLabels[product.source] || product.source}</span>
                  </div>

                  {/* Confidence */}
                  {product.confidence < 1 && (
                    <span className="text-xs text-gray-400">
                      {Math.round(product.confidence * 100)}% confidence
                    </span>
                  )}
                </div>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {product.features.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{product.features.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {product.source_url && (
                      <DropdownMenuItem asChild>
                        <a href={product.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Source
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ProductList;
