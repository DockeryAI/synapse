/**
 * ProductReview Component
 *
 * Displays AI-extracted products/services for user confirmation
 * Allows editing, removing, and adding manual entries
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Product, ProductType } from '../../types/product.types';
import { AlertCircle, Check, DollarSign, Clock, Edit2, Trash2, Plus, Loader2, ArrowRight, Star, Sparkles } from 'lucide-react';

export interface ProductReviewProps {
  products: Product[];
  onConfirm: (confirmedProducts: Product[]) => void;
  onSkip?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ProductReview: React.FC<ProductReviewProps> = ({
  products: initialProducts,
  onConfirm,
  onSkip,
  isLoading = false,
  className = ''
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Update products when initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Product type icons (emojis for Synapse consistency)
  const typeEmojis = {
    product: '📦',
    service: '💼',
    hybrid: '🎯'
  };

  // Product type colors
  const typeColors = {
    product: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    service: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    hybrid: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  };

  // Handle product removal
  const handleRemove = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  // Handle product edit
  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
  };

  // Save edited product
  const handleSaveEdit = () => {
    if (!editingProduct) return;

    setProducts(products.map(p =>
      p.name === editingProduct.name ? editingProduct : p
    ));
    setEditingProduct(null);
  };

  // Add new product
  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingProduct({
      name: '',
      type: 'service',
      category: 'secondary',
      confidence: 1.0
    });
  };

  // Save new product
  const handleSaveNew = () => {
    if (!editingProduct || !editingProduct.name) return;

    setProducts([...products, editingProduct]);
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(products);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Review Your Products & Services
        </h2>
        <p className="text-muted-foreground text-lg">
          We found {products.length} offering{products.length !== 1 ? 's' : ''} on your website.
          Confirm, edit, or add to this list.
        </p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="relative hover:shadow-lg transition-shadow duration-200">
                {/* Confidence Badge */}
                {product.confidence < 0.7 && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Low confidence
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl',
                      typeColors[product.type]
                    )}>
                      {typeEmojis[product.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {product.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Type Badge */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {product.type}
                    </Badge>
                    {product.tier && (
                      <Badge variant="outline" className="capitalize">
                        {product.tier}
                      </Badge>
                    )}
                    {product.category === 'primary' && (
                      <Badge className="bg-amber-500">
                        <Star className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>

                  {/* Price & Duration */}
                  <div className="text-sm space-y-1">
                    {product.priceRange && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>{product.priceRange}</span>
                      </div>
                    )}
                    {product.durationMinutes && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{product.durationMinutes} min</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="text-xs space-y-1">
                      {product.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{feature}</span>
                        </div>
                      ))}
                      {product.features.length > 3 && (
                        <span className="text-muted-foreground">
                          +{product.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="text-6xl mb-4"
              >
                📦
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                We couldn't find any products or services on your website. Add them manually below.
              </p>
              <Button onClick={handleAddNew} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Product/Service
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add New Button */}
      {products.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Another Product/Service
          </Button>
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={editingProduct !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null);
          setIsAddingNew(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? 'Add New' : 'Edit'} Product/Service
            </DialogTitle>
            <DialogDescription>
              Update the details below
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g., Premium Car Detailing"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Brief description of this offering..."
                  rows={3}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={editingProduct.type}
                  onValueChange={(value: ProductType) => setEditingProduct({ ...editingProduct, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product (physical)</SelectItem>
                    <SelectItem value="service">Service (intangible)</SelectItem>
                    <SelectItem value="hybrid">Hybrid (both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range</label>
                <Input
                  value={editingProduct.priceRange || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, priceRange: e.target.value })}
                  placeholder="e.g., $99, $50-$150, Starting at $99"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={editingProduct.durationMinutes || ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    durationMinutes: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="e.g., 60"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingProduct(null);
              setIsAddingNew(false);
            }}>
              Cancel
            </Button>
            <Button onClick={isAddingNew ? handleSaveNew : handleSaveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip this step
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading || products.length === 0}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Confirm {products.length} Product{products.length !== 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
