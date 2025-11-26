/**
 * Catalog Services - Main Export
 *
 * Re-exports all catalog services for easy importing.
 */

// Supabase client
export {
  getPMSupabaseClient,
  resetPMSupabaseClient,
  PM_TABLES,
  toPMError,
  isDuplicateError,
  isForeignKeyError,
  withPMDatabase,
  checkPMTablesExist,
  type PMDatabaseError,
} from './supabase-pm.client';

// Product CRUD operations
export {
  createProduct,
  bulkCreateProducts,
  getProduct,
  getProductBySlug,
  listProducts,
  countProducts,
  updateProduct,
  bulkUpdateStatus,
  deleteProduct,
  bulkDeleteProducts,
} from './product-crud.service';

// Category operations
export {
  createCategory,
  getCategory,
  getCategoryBySlug,
  listCategories,
  getCategoryTree,
  getFlatCategoryList,
  updateCategory,
  reorderCategories,
  deleteCategory,
  getCategoryAncestors,
  isAncestorOf,
  getCategoryDescendantIds,
  ensureDefaultCategories,
} from './category.service';

// Search operations
export {
  searchProducts,
  filterByCategory,
  filterByStatus,
  filterByPriceRange,
  getSeasonalProducts,
  getInSeasonProducts,
  getBestsellers,
  getFeaturedProducts,
  searchByTags,
  getProductFacets,
  getSearchSuggestions,
  getRelatedProducts,
  type ProductSearchOptions,
  type ProductSearchParams,
  type ProductSearchResult,
  type ProductFacets,
} from './product-search.service';
