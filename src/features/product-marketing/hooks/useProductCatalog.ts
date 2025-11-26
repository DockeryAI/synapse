/**
 * useProductCatalog Hook
 *
 * React hook for managing product catalog operations.
 * Provides CRUD, filtering, and search capabilities.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  Product,
  ProductCategory,
  ProductFilters,
  ProductSortOptions,
  CreateProductDTO,
  UpdateProductDTO,
  CategoryTreeNode,
} from '../types';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateStatus,
  bulkDeleteProducts,
  searchProducts,
  listCategories,
  getCategoryTree,
} from '../services/catalog';
import { isProductMarketingEnabled } from '../config/feature-flags';

// ============================================================================
// TYPES
// ============================================================================

export interface UseProductCatalogOptions {
  brandId: string;
  initialFilters?: ProductFilters;
  initialSort?: ProductSortOptions;
  initialPage?: number;
  initialLimit?: number;
  autoLoad?: boolean;
}

export interface UseProductCatalogReturn {
  // State
  products: Product[];
  categories: ProductCategory[];
  categoryTree: CategoryTreeNode[];
  selectedProduct: Product | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Filters
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;

  // Sort
  sort: ProductSortOptions;
  setSort: (sort: ProductSortOptions) => void;

  // Actions
  loadProducts: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  selectProduct: (id: string | null) => Promise<void>;

  // CRUD
  create: (data: CreateProductDTO) => Promise<Product | null>;
  update: (id: string, data: UpdateProductDTO) => Promise<Product | null>;
  remove: (id: string) => Promise<boolean>;

  // Bulk actions
  bulkUpdateStatus: (ids: string[], status: Product['status']) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<boolean>;

  // Search
  search: (query: string) => Promise<void>;
  searchQuery: string;

  // Categories
  loadCategories: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useProductCatalog(
  options: UseProductCatalogOptions
): UseProductCatalogReturn {
  const { brandId, initialFilters, initialSort, initialPage = 1, initialLimit = 20, autoLoad = true } = options;

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  // Filters and sort
  const [filters, setFiltersState] = useState<ProductFilters>(initialFilters ?? {});
  const [sort, setSortState] = useState<ProductSortOptions>(
    initialSort ?? { field: 'createdAt', direction: 'desc' }
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Check if feature is enabled
  const isEnabled = useMemo(() => isProductMarketingEnabled(), []);

  // Calculate hasMore
  const hasMore = useMemo(() => {
    return page * limit < total;
  }, [page, limit, total]);

  // Load products
  const loadProducts = useCallback(async () => {
    if (!isEnabled) {
      setError('Product marketing feature is disabled');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listProducts(brandId, filters, sort, { page: 1, limit });

      setProducts(result.data);
      setTotal(result.total);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, brandId, filters, sort, limit]);

  // Load more products
  const loadMore = useCallback(async () => {
    if (!isEnabled || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await listProducts(brandId, filters, sort, { page: nextPage, limit });

      setProducts(prev => [...prev, ...result.data]);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more products');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isEnabled, hasMore, isLoadingMore, page, brandId, filters, sort, limit]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  // Select product
  const selectProduct = useCallback(async (id: string | null) => {
    if (!id) {
      setSelectedProduct(null);
      return;
    }

    try {
      const product = await getProduct(id);
      setSelectedProduct(product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    }
  }, []);

  // Create product
  const create = useCallback(async (data: CreateProductDTO): Promise<Product | null> => {
    if (!isEnabled) return null;

    try {
      const product = await createProduct({ ...data, brandId });
      setProducts(prev => [product, ...prev]);
      setTotal(prev => prev + 1);
      return product;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      return null;
    }
  }, [isEnabled, brandId]);

  // Update product
  const update = useCallback(async (
    id: string,
    data: UpdateProductDTO
  ): Promise<Product | null> => {
    if (!isEnabled) return null;

    try {
      const updated = await updateProduct(id, data);
      setProducts(prev =>
        prev.map(p => (p.id === id ? updated : p))
      );
      if (selectedProduct?.id === id) {
        setSelectedProduct(updated);
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      return null;
    }
  }, [isEnabled, selectedProduct]);

  // Delete product
  const remove = useCallback(async (id: string): Promise<boolean> => {
    if (!isEnabled) return false;

    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      return false;
    }
  }, [isEnabled, selectedProduct]);

  // Bulk update status
  const handleBulkUpdateStatus = useCallback(async (
    ids: string[],
    status: Product['status']
  ): Promise<boolean> => {
    if (!isEnabled) return false;

    try {
      await bulkUpdateStatus(ids, status);
      setProducts(prev =>
        prev.map(p => (ids.includes(p.id) ? { ...p, status } : p))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update products');
      return false;
    }
  }, [isEnabled]);

  // Bulk delete
  const handleBulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!isEnabled) return false;

    try {
      await bulkDeleteProducts(ids);
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
      setTotal(prev => prev - ids.length);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete products');
      return false;
    }
  }, [isEnabled]);

  // Search
  const search = useCallback(async (query: string) => {
    if (!isEnabled) return;

    setSearchQuery(query);
    setIsLoading(true);
    setError(null);

    try {
      if (!query.trim()) {
        await loadProducts();
        return;
      }

      const result = await searchProducts(brandId, { query, page: 1, limit });

      setProducts(result.products);
      setTotal(result.total);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, brandId, limit, loadProducts]);

  // Set filters
  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setSearchQuery('');
  }, []);

  // Set sort
  const setSort = useCallback((newSort: ProductSortOptions) => {
    setSortState(newSort);
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!isEnabled) return;

    try {
      const [cats, tree] = await Promise.all([
        listCategories(),
        getCategoryTree(),
      ]);
      setCategories(cats);
      setCategoryTree(tree);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [isEnabled]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && isEnabled) {
      loadProducts();
      loadCategories();
    }
  }, [autoLoad, isEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when filters or sort change
  useEffect(() => {
    if (isEnabled && !isLoading) {
      loadProducts();
    }
  }, [filters, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    products,
    categories,
    categoryTree,
    selectedProduct,
    isLoading,
    isLoadingMore,
    error,
    pagination: {
      page,
      limit,
      total,
      hasMore,
    },

    // Filters
    filters,
    setFilters,
    clearFilters,

    // Sort
    sort,
    setSort,

    // Actions
    loadProducts,
    loadMore,
    refresh,
    selectProduct,

    // CRUD
    create,
    update,
    remove,

    // Bulk actions
    bulkUpdateStatus: handleBulkUpdateStatus,
    bulkDelete: handleBulkDelete,

    // Search
    search,
    searchQuery,

    // Categories
    loadCategories,
  };
}

export default useProductCatalog;
