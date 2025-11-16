import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import categoryService from '../service/categoryService';
import type { Category } from '../service/categoryService';

/**
 * Query Keys - Centralized for consistency
 */
export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch all categories with caching
 * 
 * Cache Strategy:
 * - staleTime: 30 minutes (categories rarely change)
 * - Cached data shared across all components
 * - Auto-refetch on mount disabled
 * 
 * Usage:
 * ```tsx
 * const { data: categories, isLoading, error } = useCategories();
 * ```
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const data = await categoryService.getAllCategories();
      // Ensure data is array
      if (Array.isArray(data)) {
        return data;
      }
      console.warn('Categories data is not an array:', data);
      return [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories change infrequently
    gcTime: 60 * 60 * 1000, // 1 hour cache
    retry: 2, // Retry twice for critical data
  });
}

/**
 * Hook to fetch single category by ID
 */
export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId),
    queryFn: async () => {
      return await categoryService.getCategoryById(categoryId);
    },
    enabled: !!categoryId, // Only fetch if ID provided
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to invalidate/refetch categories cache
 * Use after create/update/delete operations
 * 
 * Usage:
 * ```tsx
 * const { invalidateCategories } = useInvalidateCategories();
 * await createCategory(...);
 * invalidateCategories(); // Refetch categories
 * ```
 */
export function useInvalidateCategories() {
  const queryClient = useQueryClient();

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  };

  return { invalidateCategories };
}
