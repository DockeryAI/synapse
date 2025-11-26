/**
 * ProductCard Component
 *
 * Displays a single product in card format.
 * Supports selection, actions, and status display.
 */

import React from 'react';
import type { Product, ProductStatus } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  showActions?: boolean;
  onSelect?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onStatusChange?: (product: Product, status: ProductStatus) => void;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatusBadge: React.FC<{ status: ProductStatus }> = ({ status }) => {
  const colors: Record<ProductStatus, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    seasonal: 'bg-orange-100 text-orange-700',
    discontinued: 'bg-red-100 text-red-700',
    draft: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
};

const PriceDisplay: React.FC<{ price?: number | null; currency?: string }> = ({ price, currency = 'USD' }) => {
  if (price === undefined || price === null) return null;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);

  return (
    <span className="text-lg font-semibold text-gray-900">
      {formatted}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected = false,
  showActions = true,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  className = '',
}) => {
  const handleClick = () => {
    onSelect?.(product);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(product);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange?.(product, e.target.value as ProductStatus);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative bg-white rounded-lg border shadow-sm transition-all
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-300'}
        ${onSelect ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Image placeholder */}
      {product.images && product.images.length > 0 ? (
        <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          <img
            src={product.images.find(i => i.isPrimary)?.url || product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
          <span className="text-gray-400 text-4xl">
            {product.isService ? '🔧' : '📦'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          <StatusBadge status={product.status} />
        </div>

        {/* Description */}
        {(product.shortDescription || product.description) && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.shortDescription || product.description}
          </p>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="px-2 py-0.5 text-gray-500 text-xs">
                +{product.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <PriceDisplay price={product.price} currency={product.currency} />
            {product.isService && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                Service
              </span>
            )}
          </div>
          {product.isFeatured && (
            <span className="text-xs text-yellow-600">★ Featured</span>
          )}
        </div>

        {/* Seasonal badge */}
        {product.isSeasonal && (
          <div className="mt-2 text-xs text-orange-600">
            🍂 Seasonal product
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (onEdit || onDelete || onStatusChange) && (
        <div className="px-4 pb-4 flex items-center gap-2">
          {onStatusChange && (
            <select
              value={product.status}
              onChange={handleStatusChange}
              onClick={e => e.stopPropagation()}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="seasonal">Seasonal</option>
              <option value="discontinued">Discontinued</option>
            </select>
          )}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
