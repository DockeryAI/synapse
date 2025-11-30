/**
 * AddEditProductModal Component
 *
 * Modal dialog for adding or editing brand products with full form fields.
 *
 * Created: 2025-11-29
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { BrandProduct, BrandProductInput, ProductType, ProductTier, ProductPriority } from '@/types/product.types';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: BrandProductInput) => Promise<void>;
  product?: BrandProduct | null;
  isLoading?: boolean;
}

const productTypes: { value: ProductType; label: string }[] = [
  { value: 'product', label: 'Physical Product' },
  { value: 'service', label: 'Service' },
  { value: 'hybrid', label: 'Product + Service' }
];

const productTiers: { value: ProductTier; label: string }[] = [
  { value: 'basic', label: 'Basic / Starter' },
  { value: 'premium', label: 'Premium / Professional' },
  { value: 'enterprise', label: 'Enterprise / Business' },
  { value: 'custom', label: 'Custom / Bespoke' }
];

const productPriorities: { value: ProductPriority; label: string }[] = [
  { value: 'primary', label: 'Primary (Main Offering)' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'addon', label: 'Add-on / Upsell' }
];

export function AddEditProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  isLoading
}: AddEditProductModalProps) {
  const isEditing = !!product;

  const [form, setForm] = useState<BrandProductInput>({
    name: '',
    description: '',
    category: '',
    product_type: undefined,
    tier: undefined,
    priority: 'secondary',
    price_range: '',
    duration_minutes: undefined,
    features: [],
    is_confirmed: true
  });

  const [newFeature, setNewFeature] = useState('');

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || '',
        category: product.category || '',
        product_type: product.product_type,
        tier: product.tier,
        priority: product.priority || 'secondary',
        price_range: product.price_range || '',
        duration_minutes: product.duration_minutes,
        features: product.features || [],
        is_confirmed: product.is_confirmed
      });
    } else {
      setForm({
        name: '',
        description: '',
        category: '',
        product_type: undefined,
        tier: undefined,
        priority: 'secondary',
        price_range: '',
        duration_minutes: undefined,
        features: [],
        is_confirmed: true
      });
    }
    setNewFeature('');
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    await onSave(form);
    onClose();
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !form.features?.includes(newFeature.trim())) {
      setForm(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setForm(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Product/Service' : 'Add Product/Service'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this product or service.'
              : 'Add a new product or service to your brand profile.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Premium SEO Package"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this product or service..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Marketing Services, Software, Consulting"
            />
          </div>

          {/* Type & Tier Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.product_type || ''}
                onValueChange={(value) => setForm(prev => ({
                  ...prev,
                  product_type: value as ProductType || undefined
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={form.tier || ''}
                onValueChange={(value) => setForm(prev => ({
                  ...prev,
                  tier: value as ProductTier || undefined
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier..." />
                </SelectTrigger>
                <SelectContent>
                  {productTiers.map(tier => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={form.priority || 'secondary'}
              onValueChange={(value) => setForm(prev => ({
                ...prev,
                priority: value as ProductPriority
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority..." />
              </SelectTrigger>
              <SelectContent>
                {productPriorities.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_range">Price Range</Label>
              <Input
                id="price_range"
                value={form.price_range}
                onChange={(e) => setForm(prev => ({ ...prev, price_range: e.target.value }))}
                placeholder="e.g., $99/mo, $500-$1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={form.duration_minutes || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  duration_minutes: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                placeholder="e.g., 60"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a feature..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFeature}
                disabled={!newFeature.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {form.features && form.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.features.map((feature, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !form.name.trim()}>
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Add Product'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddEditProductModal;
