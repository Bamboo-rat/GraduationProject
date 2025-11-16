import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '~/service/orderService';
import type { Order, OrderStatus } from '~/service/orderService';

export interface GetStoreOrdersParams {
  storeId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

/**
 * Query keys for order-related queries
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: GetStoreOrdersParams) => [...orderKeys.lists(), params] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch paginated orders with caching
 */
export const useOrders = (params: GetStoreOrdersParams) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderService.getStoreOrders(params),
    staleTime: 30 * 1000, // 30 seconds - orders change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

/**
 * Hook to fetch single order details
 */
export const useOrder = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderService.getOrderById(orderId),
    enabled: enabled && !!orderId,
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to confirm order with optimistic update
 */
export const useConfirmOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: any }) =>
      orderService.confirmOrder(orderId, payload),
    
    // Optimistic update - update UI immediately
    onMutate: async ({ orderId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderKeys.lists() });

      // Snapshot previous value
      const previousQueries = queryClient.getQueriesData({ queryKey: orderKeys.lists() });

      // Optimistically update all order list queries
      queryClient.setQueriesData<{ content: Order[]; totalPages: number }>(
        { queryKey: orderKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((order) =>
              order.id === orderId
                ? { ...order, status: 'CONFIRMED' as OrderStatus }
                : order
            ),
          };
        }
      );

      return { previousQueries };
    },

    // Revert on error
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};

/**
 * Hook to prepare order with optimistic update
 */
export const usePrepareOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.prepareOrder(orderId),
    
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.lists() });
      const previousQueries = queryClient.getQueriesData({ queryKey: orderKeys.lists() });

      queryClient.setQueriesData<{ content: Order[]; totalPages: number }>(
        { queryKey: orderKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((order) =>
              order.id === orderId
                ? { ...order, status: 'PREPARING' as OrderStatus }
                : order
            ),
          };
        }
      );

      return { previousQueries };
    },

    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};

/**
 * Hook to ship order with optimistic update
 */
export const useShipOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.shipOrder(orderId),
    
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.lists() });
      const previousQueries = queryClient.getQueriesData({ queryKey: orderKeys.lists() });

      queryClient.setQueriesData<{ content: Order[]; totalPages: number }>(
        { queryKey: orderKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((order) =>
              order.id === orderId
                ? { ...order, status: 'SHIPPING' as OrderStatus }
                : order
            ),
          };
        }
      );

      return { previousQueries };
    },

    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};

/**
 * Hook to cancel order with optimistic update
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      orderService.cancelOrder(orderId, { cancelReason: reason }),
    
    onMutate: async ({ orderId }) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.lists() });
      const previousQueries = queryClient.getQueriesData({ queryKey: orderKeys.lists() });

      queryClient.setQueriesData<{ content: Order[]; totalPages: number }>(
        { queryKey: orderKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((order) =>
              order.id === orderId
                ? { ...order, status: 'CANCELLED' as OrderStatus }
                : order
            ),
          };
        }
      );

      return { previousQueries };
    },

    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};

/**
 * Hook to invalidate order queries (force refresh)
 */
export const useInvalidateOrders = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
    invalidateDetail: (id: string) =>
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) }),
  };
};
