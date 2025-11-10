import api from '~/config/axios';

export interface CreateReviewRequest {
  orderDetailId: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
}

export interface ReplyReviewRequest {
  reply: string;
}

export interface ReviewResponse {
  reviewId: string;
  customerId: string;
  customerName: string;
  productVariantId: string;
  productVariantName: string;
  productId: string;
  productName: string;
  productImage?: string;
  storeId: string;
  storeName: string;
  orderDetailId?: string;
  orderCode?: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
  supplierReply?: string;
  repliedAt?: string;
  markedAsSpam: boolean;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
  canEditReply: boolean;
}

export interface ProductRatingResponse {
  productId: string;
  productName: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  ratingPercentage: { [key: number]: number };
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const reviewService = {
  // Get reviews for supplier's store
  getStoreReviews: async (storeId: string, page: number = 0, size: number = 10): Promise<PageResponse<ReviewResponse>> => {
    const response = await api.get(`/reviews/store/${storeId}`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get review by ID
  getReviewById: async (reviewId: string): Promise<ReviewResponse> => {
    const response = await api.get(`/reviews/${reviewId}`);
    return response.data;
  },

  // Get product variant reviews
  getProductReviews: async (productVariantId: string, rating?: number, page: number = 0, size: number = 10): Promise<PageResponse<ReviewResponse>> => {
    const response = await api.get(`/reviews/product/${productVariantId}`, {
      params: { rating, page, size }
    });
    return response.data;
  },

  // Get product variant rating statistics
  getProductRating: async (productVariantId: string): Promise<ProductRatingResponse> => {
    const response = await api.get(`/reviews/product/${productVariantId}/rating`);
    return response.data;
  },

  // Search reviews by keyword for product variant
  searchReviews: async (productVariantId: string, keyword: string, page: number = 0, size: number = 10): Promise<PageResponse<ReviewResponse>> => {
    const response = await api.get(`/reviews/product/${productVariantId}/search`, {
      params: { keyword, page, size }
    });
    return response.data;
  },

  // Supplier replies to a review
  replyToReview: async (reviewId: string, reply: string): Promise<ReviewResponse> => {
    const response = await api.post(`/reviews/${reviewId}/reply`, { reply });
    return response.data;
  },

  // Supplier updates their reply
  updateReply: async (reviewId: string, reply: string): Promise<ReviewResponse> => {
    const response = await api.put(`/reviews/${reviewId}/reply`, { reply });
    return response.data;
  },

  // Supplier deletes their reply
  deleteReply: async (reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${reviewId}/reply`);
  },

  // Supplier reports an inappropriate review
  reportReview: async (reviewId: string, reason: string): Promise<void> => {
    await api.post(`/reviews/${reviewId}/report`, null, {
      params: { reason }
    });
  },
};
