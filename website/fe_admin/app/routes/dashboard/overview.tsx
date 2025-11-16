import type { Route } from './+types/overview';
import DashboardOverview from '~/pages/dashboard/DashboardOverview';
import ProtectedRoute from '~/component/common/ProtectedRoute';
import dashboardService from '~/service/dashboardService';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tổng quan - SaveFood' },
    { name: 'description', content: 'Quản lý tổng quan' },
  ];
}

// React Router 7 Loader - Fetches data BEFORE navigation
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const dateRange = url.searchParams.get('range') || '30days';
  const customStart = url.searchParams.get('start') || '';
  const customEnd = url.searchParams.get('end') || '';

  // Calculate date range
  const end = new Date();
  let start = new Date();

  if (dateRange === 'custom' && customStart && customEnd) {
    // Use custom dates
  } else {
    const days = dateRange === '7days' ? 7 : dateRange === '90days' ? 90 : 30;
    start.setDate(end.getDate() - days);
  }

  const startDate = customStart || start.toISOString().split('T')[0];
  const endDate = customEnd || end.toISOString().split('T')[0];

  try {
    // Load all dashboard data in parallel
    const [overviewData, trendsData, productsData, categoryData, storesData] = await Promise.all([
      dashboardService.getOverview(),
      dashboardService.getSalesTrends(startDate, endDate),
      dashboardService.getTopProducts(5),
      dashboardService.getCategoryRevenue(),
      dashboardService.getTopStores(5)
    ]);

    return {
      overview: overviewData,
      salesTrends: trendsData,
      topProducts: productsData,
      categoryRevenue: categoryData,
      topStores: storesData,
      dateRange,
      customStartDate: customStart,
      customEndDate: customEnd,
    };
  } catch (error: any) {
    return {
      overview: null,
      salesTrends: [],
      topProducts: [],
      categoryRevenue: [],
      topStores: [],
      dateRange,
      customStartDate: customStart,
      customEndDate: customEnd,
      error: error.message || 'Không thể tải dữ liệu dashboard',
    };
  }
}

export default function DashboardOverviewRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <DashboardOverview />
    </ProtectedRoute>
  );
}
