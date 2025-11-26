/**
 * ProductEditor Component
 *
 * Form for creating and editing products.
 * Supports all product fields with validation.
 */

import React, { useState, useEffect } from 'react';
import type { Product, ProductCategory, CreateProductDTO, UpdateProductDTO } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductEditorProps {
  product?: Product | null;
  categories: ProductCategory[];
  isLoading?: boolean;
  onSave: (data: CreateProductDTO | UpdateProductDTO) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

interface FormData {
  name: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  status: Product['status'];
  price: string;
  currency: string;
  isService: boolean;
  isSeasonal: boolean;
  tags: string;
  externalId: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const initialFormData = (product?: Product | null): FormData => ({
  name: product?.name || '',
  description: product?.description || '',
  shortDescription: product?.shortDescription || '',
  categoryId: product?.categoryId || '',
  status: product?.status || 'draft',
  price: product?.price?.toString() || '',
  currency: product?.currency || 'USD',
  isService: product?.isService || false,
  isSeasonal: product?.isSeasonal || false,
  tags: product?.tags?.join(', ') || '',
  externalId: product?.externalId || '',
});

// ============================================================================
// FORM FIELD COMPONENTS
// ============================================================================

const FormField: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProductEditor: React.FC<ProductEditorProps> = ({
  product,
  categories,
  isLoading = false,
  onSave,
  onCancel,
  className = '',
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData(product));
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!product;

  // Reset form when product changes
  useEffect(() => {
    setFormData(initialFormData(product));
    setErrors({});
  }, [product]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is modified
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    } else if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);

    try {
      const data: CreateProductDTO | UpdateProductDTO = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        shortDescription: formData.shortDescription.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        status: formData.status,
        price: formData.price ? parseFloat(formData.price) : undefined,
        currency: formData.currency,
        isService: formData.isService,
        isSeasonal: formData.isSeasonal,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : undefined,
        externalId: formData.externalId.trim() || undefined,
      };

      await onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Name */}
      <FormField label="Product Name" required error={errors.name}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter product name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormField>

      {/* Short Description */}
      <FormField label="Short Description">
        <input
          type="text"
          name="shortDescription"
          value={formData.shortDescription}
          onChange={handleChange}
          placeholder="Brief description for listings"
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormField>

      {/* Description */}
      <FormField label="Full Description">
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed product description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormField>

      {/* Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <FormField label="Category">
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Status */}
        <FormField label="Status">
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="seasonal">Seasonal</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </FormField>

        {/* Price */}
        <FormField label="Price" error={errors.price}>
          <div className="flex">
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50"
            >
              <option value="USD">$</option>
              <option value="EUR">€</option>
              <option value="GBP">£</option>
            </select>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </FormField>

        {/* External ID */}
        <FormField label="External ID">
          <input
            type="text"
            name="externalId"
            value={formData.externalId}
            onChange={handleChange}
            placeholder="External reference ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </FormField>
      </div>

      {/* Tags */}
      <FormField label="Tags">
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="Enter tags separated by commas"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Separate multiple tags with commas
        </p>
      </FormField>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isService"
            checked={formData.isService}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">This is a service</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isSeasonal"
            checked={formData.isSeasonal}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Seasonal product</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            isEditing ? 'Update Product' : 'Create Product'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductEditor;
