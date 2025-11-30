/**
 * useProducts Hook
 *
 * Manages brand products with CRUD operations, website rescanning,
 * and UVP migration capabilities.
 *
 * Created: 2025-11-29
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BrandProduct, BrandProductInput } from '@/types/product.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import { productScannerService } from '@/services/intelligence/product-scanner.service';
import { scrapeWebsite } from '@/services/scraping/websiteScraper';

interface UseProductsOptions {
  autoMigrateFromUVP?: boolean;
  uvp?: CompleteUVP | null;
}

interface UseProductsReturn {
  products: BrandProduct[];
  loading: boolean;
  scanning: boolean;
  error: string | null;
  addProduct: (product: BrandProductInput) => Promise<BrandProduct | null>;
  updateProduct: (id: string, updates: Partial<BrandProductInput>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  rescanProducts: (websiteUrl: string, brandName: string, industry?: string) => Promise<void>;
  refresh: () => Promise<void>;
  migrateFromUVP: (uvp: CompleteUVP) => Promise<void>;
}

export function useProducts(
  brandId: string | undefined,
  options: UseProductsOptions = {}
): UseProductsReturn {
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMigrated, setHasMigrated] = useState(false);

  // Load products from database
  const loadProducts = useCallback(async () => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Debug: Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[useProducts] Auth session:', session ? `User ${session.user?.id?.slice(0, 8)}...` : 'NO SESSION');

      const { data, error: fetchError } = await supabase
        .from('brand_products')
        .select('*')
        .eq('brand_id', brandId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Table might not exist yet - that's ok
        if (fetchError.code === '42P01') {
          console.log('[useProducts] brand_products table does not exist yet');
          setProducts([]);
        } else {
          throw fetchError;
        }
      } else {
        // Parse features from JSONB
        const parsedProducts = (data || []).map((p: any) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : []
        })) as BrandProduct[];

        setProducts(parsedProducts);
      }
    } catch (err) {
      console.error('[useProducts] Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  // Migrate products from UVP JSON on first load
  const migrateFromUVP = useCallback(async (uvp: CompleteUVP) => {
    if (!brandId || hasMigrated) return;

    // Check if we already have products
    const { data: existing } = await supabase
      .from('brand_products')
      .select('id')
      .eq('brand_id', brandId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('[useProducts] Products already exist, skipping migration');
      setHasMigrated(true);
      return;
    }

    // Extract products from UVP
    const uvpProducts = uvp.productsServices?.categories?.flatMap(cat =>
      (cat.items || []).map(item => ({
        brand_id: brandId,
        name: item.name,
        description: item.description || '',
        category: cat.name || item.category || '',
        source: 'uvp' as const,
        source_url: item.sourceUrl,
        source_excerpt: item.sourceExcerpt,
        confidence: (item.confidence || 80) / 100,
        is_confirmed: item.confirmed || false,
        features: [] as string[]
      }))
    ) || [];

    if (uvpProducts.length === 0) {
      console.log('[useProducts] No UVP products to migrate');
      setHasMigrated(true);
      return;
    }

    console.log('[useProducts] Migrating', uvpProducts.length, 'products from UVP');

    try {
      const { error: insertError } = await supabase
        .from('brand_products')
        .insert(uvpProducts);

      if (insertError) {
        // Ignore table not found errors
        if (insertError.code !== '42P01') {
          throw insertError;
        }
      }

      setHasMigrated(true);
      await loadProducts();
    } catch (err) {
      console.error('[useProducts] Migration failed:', err);
    }
  }, [brandId, hasMigrated, loadProducts]);

  // Add a new product
  const addProduct = useCallback(async (product: BrandProductInput): Promise<BrandProduct | null> => {
    if (!brandId) {
      setError('No brand selected');
      return null;
    }

    try {
      setError(null);

      const newProduct = {
        brand_id: brandId,
        name: product.name,
        description: product.description || null,
        category: product.category || null,
        product_type: product.product_type || null,
        tier: product.tier || null,
        priority: product.priority || 'secondary',
        price_range: product.price_range || null,
        duration_minutes: product.duration_minutes || null,
        features: product.features || [],
        source: product.source || 'manual',
        source_url: product.source_url || null,
        source_excerpt: product.source_excerpt || null,
        confidence: product.confidence ?? 1.0,
        is_confirmed: product.is_confirmed ?? true
      };

      const { data, error: insertError } = await supabase
        .from('brand_products')
        .insert(newProduct)
        .select()
        .single();

      if (insertError) throw insertError;

      const addedProduct = {
        ...data,
        features: Array.isArray(data.features) ? data.features : []
      } as BrandProduct;

      setProducts(prev => [addedProduct, ...prev]);
      return addedProduct;
    } catch (err) {
      console.error('[useProducts] Failed to add product:', err);
      setError(err instanceof Error ? err.message : 'Failed to add product');
      return null;
    }
  }, [brandId]);

  // Update a product
  const updateProduct = useCallback(async (id: string, updates: Partial<BrandProductInput>): Promise<boolean> => {

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('brand_products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ));

      return true;
    } catch (err) {
      console.error('[useProducts] Failed to update product:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product');
      return false;
    }
  }, []);

  // Delete a product
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('brand_products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      console.error('[useProducts] Failed to delete product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      return false;
    }
  }, []);

  // Rescan website for products
  const rescanProducts = useCallback(async (
    websiteUrl: string,
    brandName: string,
    industry?: string
  ): Promise<void> => {
    if (!brandId) {
      setError('No brand selected');
      return;
    }

    try {
      setScanning(true);
      setError(null);

      // Fetch website content using CORS-safe scraper
      console.log('[useProducts] Fetching website content for scan:', websiteUrl);

      const websiteData = await scrapeWebsite(websiteUrl);
      if (!websiteData.html) {
        throw new Error('Failed to fetch website content');
      }
      const websiteContent = websiteData.html;

      // Scan for products
      const scanResult = await productScannerService.scanProducts(
        websiteContent,
        brandName,
        industry
      );

      if (scanResult.products.length === 0) {
        console.log('[useProducts] No products found in scan');
        return;
      }

      // Convert scanned products to BrandProduct format and save
      const newProducts = scanResult.products.map(p => ({
        brand_id: brandId,
        name: p.name,
        description: p.description || null,
        category: p.category || null,
        product_type: p.type,
        tier: p.tier || null,
        priority: p.category,
        price_range: p.priceRange || null,
        duration_minutes: p.durationMinutes || null,
        features: p.features || [],
        source: 'rescan' as const,
        confidence: p.confidence,
        is_confirmed: false,
        last_scanned_at: new Date().toISOString()
      }));

      // Check for duplicates by name
      const existingNames = new Set(products.map(p => p.name.toLowerCase()));
      const uniqueProducts = newProducts.filter(p => !existingNames.has(p.name.toLowerCase()));

      if (uniqueProducts.length > 0) {
        const { data, error: insertError } = await supabase
          .from('brand_products')
          .insert(uniqueProducts)
          .select();

        if (insertError) throw insertError;

        const addedProducts = (data || []).map((p: any) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : []
        })) as BrandProduct[];

        setProducts(prev => [...addedProducts, ...prev]);
        console.log('[useProducts] Added', addedProducts.length, 'new products from scan');
      } else {
        console.log('[useProducts] All scanned products already exist');
      }
    } catch (err) {
      console.error('[useProducts] Rescan failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to rescan website');
    } finally {
      setScanning(false);
    }
  }, [brandId, products]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-migrate from UVP if enabled
  useEffect(() => {
    if (options.autoMigrateFromUVP && options.uvp && !hasMigrated && !loading && products.length === 0) {
      migrateFromUVP(options.uvp);
    }
  }, [options.autoMigrateFromUVP, options.uvp, hasMigrated, loading, products.length, migrateFromUVP]);

  return {
    products,
    loading,
    scanning,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    rescanProducts,
    refresh: loadProducts,
    migrateFromUVP
  };
}
