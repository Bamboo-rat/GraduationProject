import axiosInstance from '../config/axios';
import type { ApiResponse, PageResponse } from './types';

export interface CustomerResponse {
  userId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  points: number;
  status: string; // ACTIVE, PENDING_VERIFICATION, SUSPENDED, etc.
  tier: string; // BRONZE, SILVER, GOLD, PLATINUM
  tierUpdatedAt?: string;
  lifetimePoints: number;
  pointsThisYear: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== COMPREHENSIVE CUSTOMER DETAIL TYPES ====================

export interface BasicInfo {
  userId: string;
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  status: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  tier: string;
  tierUpdatedAt?: string;
  currentPoints: number;
  lifetimePoints: number;
  pointsThisYear: number;
  pointsToNextTier: number;
}

export interface OrderSummary {
  orderId: string;
  orderCode: string;
  storeName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveredAt?: string;
  wasCanceled: boolean;
  cancelReason?: string;
}

export interface PointTransaction {
  transactionId: string;
  type: string;
  points: number;
  description: string;
  relatedOrderCode?: string;
  createdAt: string;
}

export interface AddressSummary {
  addressId: string;
  fullName: string;
  phoneNumber: string;
  fullAddress: string;
  isDefault: boolean;
  orderCount: number;
}

export interface ReviewSummary {
  reviewId: string;
  productName: string;
  storeName: string;
  rating: number;
  comment: string;
  createdAt: string;
  hasBeenReported: boolean;
}

export interface PromotionUsageSummary {
  promotionCode: string;
  promotionTitle: string;
  discountAmount: number;
  orderCode?: string;
  usedAt: string;
}

export interface ActivityHistory {
  recentOrders: OrderSummary[];
  recentPointTransactions: PointTransaction[];
  addresses: AddressSummary[];
  recentReviews: ReviewSummary[];
  recentPromotionUsage: PromotionUsageSummary[];
}

export interface ViolationRecord {
  recordId: string;
  violationType: string;
  severity: string;
  description: string;
  actionTaken: string;
  suspensionDurationDays?: number;
  suspendedUntil?: string;
  reinstatedAt?: string;
  isResolved: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  reviewedByAdmin?: string;
  adminNotes?: string;
}

export interface ViolationsDiscipline {
  violationHistory: ViolationRecord[];
  activeWarnings: ViolationRecord[];
  suspensionHistory: ViolationRecord[];
  totalViolations: number;
  activeWarningsCount: number;
  totalSuspensions: number;
  violationPoints: number;
  isCurrentlySuspended: boolean;
  currentSuspensionEndsAt?: string;
}

export interface FavoriteStoreSummary {
  storeId: string;
  storeName: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export interface BehavioralStatistics {
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  returnedOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  cancellationRate: number;
  returnRate: number;
  daysSinceLastOrder: number;
  daysSinceFirstOrder: number;
  averageRatingGiven: number;
  totalReviews: number;
  reportedReviews: number;
  topFavoriteStores: FavoriteStoreSummary[];
  ordersThisMonth: number;
  spendingThisMonth: number;
  ordersLastMonth: number;
  spendingLastMonth: number;
  hasHighCancellationRate: boolean;
  hasHighReturnRate: boolean;
  hasReportedReviews: boolean;
  hasActiveViolations: boolean;
  riskScore: number;
}

export interface EvaluationRecommendation {
  recommendation: string; // ALLOW, WARN, SUSPEND, BAN
  reason: string;
  confidenceScore: number;
  riskFactors: string[];
  positiveFactors: string[];
}

export interface CustomerDetailResponse {
  basicInfo: BasicInfo;
  activityHistory: ActivityHistory;
  violationsDiscipline: ViolationsDiscipline;
  behavioralStatistics: BehavioralStatistics;
  evaluationRecommendation: EvaluationRecommendation;
}

/**
 * Customer Service for Admin Portal
 * Handles admin operations for viewing and managing customers
 */
class CustomerService {
  /**
   * Get customer by ID (admin only)
   */
  async getCustomerById(userId: string): Promise<CustomerResponse> {
    const response = await axiosInstance.get<ApiResponse<CustomerResponse>>(`/customers/${userId}`);
    return response.data.data;
  }

  /**
   * Get all customers with pagination and filters (admin only)
   */
  async getAllCustomers(params: {
    page?: number;
    size?: number;
    status?: string;
    tier?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<PageResponse<CustomerResponse>> {
    const response = await axiosInstance.get<ApiResponse<PageResponse<CustomerResponse>>>('/customers', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        status: params.status,
        tier: params.tier,
        search: params.search,
        sortBy: params.sortBy || 'createdAt',
        sortDirection: params.sortDirection || 'DESC',
      },
    });
    return response.data.data;
  }

  /**
   * Set customer active/inactive status (admin only)
   */
  async setActiveStatus(userId: string, active: boolean): Promise<CustomerResponse> {
    const response = await axiosInstance.patch<ApiResponse<CustomerResponse>>(
      `/customers/${userId}/active`,
      null,
      { params: { active } }
    );
    return response.data.data;
  }

  /**
   * Get customer statistics (admin dashboard)
   */
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byTier: { tier: string; count: number }[];
  }> {
    const response = await axiosInstance.get<ApiResponse<any>>('/customers/stats');
    return response.data.data;
  }

  /**
   * Get comprehensive customer details for admin evaluation
   * Includes violations, activity history, behavioral statistics
   */
  async getCustomerDetailForAdmin(userId: string): Promise<CustomerDetailResponse> {
    const response = await axiosInstance.get<ApiResponse<CustomerDetailResponse>>(
      `/customers/${userId}/detail`
    );
    return response.data.data;
  }

  /**
   * Suspend customer account (admin only)
   */
  async suspendCustomer(userId: string, reason: string, durationDays?: number): Promise<CustomerResponse> {
    const response = await axiosInstance.post<ApiResponse<CustomerResponse>>(
      `/customers/${userId}/suspend`,
      {
        reason,
        durationDays,
      }
    );
    return response.data.data;
  }

  /**
   * Unsuspend customer account (admin only)
   */
  async unsuspendCustomer(userId: string): Promise<CustomerResponse> {
    const response = await axiosInstance.post<ApiResponse<CustomerResponse>>(
      `/customers/${userId}/unsuspend`
    );
    return response.data.data;
  }
}

export default new CustomerService();
