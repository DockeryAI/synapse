/**
 * Category Service
 *
 * CRUD operations for product categories with tree structure support.
 */

import {
  getPMSupabaseClient,
  PM_TABLES,
  toPMError,
  isDuplicateError,
} from './supabase-pm.client';
import { requireFeature } from '../../config/feature-flags';
import {
  type ProductCategory,
  type CategoryRow,
  type CreateCategoryDTO,
  type UpdateCategoryDTO,
  type CategoryTreeNode,
  type FlatCategoryNode,
  mapRowToCategory,
} from '../../types';

// ============================================================================
// SLUG GENERATION
// ============================================================================

/**
 * Generate URL-safe slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new category
 */
export async function createCategory(dto: CreateCategoryDTO): Promise<ProductCategory> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'createCategory');

  const client = getPMSupabaseClient();

  // Generate slug if not provided
  const slug = dto.slug || generateSlug(dto.name);

  const categoryData = {
    name: dto.name,
    slug,
    description: dto.description || null,
    parent_category_id: dto.parentCategoryId || null,
    display_order: dto.displayOrder ?? 0,
    icon: dto.icon || null,
    color: dto.color || null,
    is_active: dto.isActive ?? true,
  };

  const { data, error } = await client
    .from(PM_TABLES.CATEGORIES)
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    const pmError = toPMError(error);
    if (isDuplicateError(error)) {
      throw new Error(`Category with slug "${slug}" already exists`);
    }
    throw new Error(`Failed to create category: ${pmError.message}`);
  }

  return mapRowToCategory(data as CategoryRow);
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get category by ID
 */
export async function getCategory(id: string): Promise<ProductCategory | null> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getCategory');

  const client = getPMSupabaseClient();

  const { data, error } = await client
    .from(PM_TABLES.CATEGORIES)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get category: ${toPMError(error).message}`);
  }

  return mapRowToCategory(data as CategoryRow);
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getCategoryBySlug');

  const client = getPMSupabaseClient();

  const { data, error } = await client
    .from(PM_TABLES.CATEGORIES)
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get category: ${toPMError(error).message}`);
  }

  return mapRowToCategory(data as CategoryRow);
}

/**
 * List categories
 */
export async function listCategories(parentId?: string | null): Promise<ProductCategory[]> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'listCategories');

  const client = getPMSupabaseClient();

  let query = client
    .from(PM_TABLES.CATEGORIES)
    .select('*')
    .order('display_order', { ascending: true });

  if (parentId === null) {
    // Get root categories only
    query = query.is('parent_category_id', null);
  } else if (parentId !== undefined) {
    // Get children of specific parent
    query = query.eq('parent_category_id', parentId);
  }
  // If parentId is undefined, get all categories

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list categories: ${toPMError(error).message}`);
  }

  return (data || []).map(row => mapRowToCategory(row as CategoryRow));
}

/**
 * Get all categories as a tree structure
 */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getCategoryTree');

  const allCategories = await listCategories();

  // Build tree from flat list
  const categoryMap = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // First pass: create nodes
  for (const category of allCategories) {
    categoryMap.set(category.id, {
      ...category,
      children: [],
    });
  }

  // Second pass: build tree
  for (const category of allCategories) {
    const node = categoryMap.get(category.id)!;

    if (category.parentCategoryId) {
      const parent = categoryMap.get(category.parentCategoryId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphaned node, treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort children by display order
  const sortChildren = (node: CategoryTreeNode): void => {
    node.children.sort((a, b) => a.displayOrder - b.displayOrder);
    node.children.forEach(sortChildren);
  };

  roots.sort((a, b) => a.displayOrder - b.displayOrder);
  roots.forEach(sortChildren);

  return roots;
}

/**
 * Get categories as flat list with depth (for dropdowns/selects)
 */
export async function getFlatCategoryList(): Promise<FlatCategoryNode[]> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getFlatCategoryList');

  const tree = await getCategoryTree();
  const result: FlatCategoryNode[] = [];

  const flatten = (
    nodes: CategoryTreeNode[],
    depth: number,
    path: string[]
  ): void => {
    for (const node of nodes) {
      const currentPath = [...path, node.name];
      result.push({
        ...node,
        depth,
        path: currentPath,
      });
      flatten(node.children, depth + 1, currentPath);
    }
  };

  flatten(tree, 0, []);
  return result;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  dto: UpdateCategoryDTO
): Promise<ProductCategory> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'updateCategory');

  const client = getPMSupabaseClient();

  const updateData: Record<string, unknown> = {};

  if (dto.name !== undefined) updateData.name = dto.name;
  if (dto.slug !== undefined) updateData.slug = dto.slug;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.parentCategoryId !== undefined) updateData.parent_category_id = dto.parentCategoryId;
  if (dto.displayOrder !== undefined) updateData.display_order = dto.displayOrder;
  if (dto.icon !== undefined) updateData.icon = dto.icon;
  if (dto.color !== undefined) updateData.color = dto.color;
  if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

  const { data, error } = await client
    .from(PM_TABLES.CATEGORIES)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const pmError = toPMError(error);
    if (pmError.code === 'PGRST116') {
      throw new Error(`Category with ID "${id}" not found`);
    }
    throw new Error(`Failed to update category: ${pmError.message}`);
  }

  return mapRowToCategory(data as CategoryRow);
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<void> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'reorderCategories');

  const client = getPMSupabaseClient();

  // Update each category's display order
  await Promise.all(
    orderedIds.map((id, index) =>
      client
        .from(PM_TABLES.CATEGORIES)
        .update({ display_order: index })
        .eq('id', id)
    )
  );
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a category
 * Note: Products in this category will have their category_id set to null
 */
export async function deleteCategory(id: string): Promise<boolean> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'deleteCategory');

  const client = getPMSupabaseClient();

  const { error } = await client
    .from(PM_TABLES.CATEGORIES)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete category: ${toPMError(error).message}`);
  }

  return true;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get category ancestors (path from root to this category)
 */
export async function getCategoryAncestors(id: string): Promise<ProductCategory[]> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getCategoryAncestors');

  const ancestors: ProductCategory[] = [];
  let currentId: string | null = id;

  while (currentId) {
    const category = await getCategory(currentId);
    if (!category) break;

    ancestors.unshift(category);
    currentId = category.parentCategoryId;
  }

  return ancestors;
}

/**
 * Check if a category is an ancestor of another
 */
export async function isAncestorOf(
  ancestorId: string,
  descendantId: string
): Promise<boolean> {
  const ancestors = await getCategoryAncestors(descendantId);
  return ancestors.some(a => a.id === ancestorId);
}

/**
 * Get all descendant category IDs
 */
export async function getCategoryDescendantIds(id: string): Promise<string[]> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'getCategoryDescendantIds');

  const tree = await getCategoryTree();
  const ids: string[] = [];

  const findAndCollect = (nodes: CategoryTreeNode[], found: boolean): boolean => {
    for (const node of nodes) {
      if (found || node.id === id) {
        if (found) ids.push(node.id);
        findAndCollect(node.children, true);
        if (node.id === id) return true;
      } else {
        if (findAndCollect(node.children, false)) return true;
      }
    }
    return false;
  };

  findAndCollect(tree, false);
  return ids;
}

/**
 * Ensure default categories exist
 */
export async function ensureDefaultCategories(): Promise<void> {
  requireFeature('PRODUCT_MARKETING_ENABLED', 'ensureDefaultCategories');

  const defaults = [
    { name: 'Products', slug: 'products', icon: 'package', color: '#3B82F6' },
    { name: 'Services', slug: 'services', icon: 'briefcase', color: '#10B981' },
    { name: 'Subscriptions', slug: 'subscriptions', icon: 'repeat', color: '#8B5CF6' },
    { name: 'Events', slug: 'events', icon: 'calendar', color: '#F59E0B' },
    { name: 'Bundles', slug: 'bundles', icon: 'layers', color: '#EC4899' },
  ];

  for (const def of defaults) {
    const existing = await getCategoryBySlug(def.slug);
    if (!existing) {
      await createCategory({
        name: def.name,
        slug: def.slug,
        icon: def.icon,
        color: def.color,
        displayOrder: defaults.indexOf(def),
      });
    }
  }
}
