import type { Route } from './+types/list';
import OrdersList from '~/pages/orders/OrdersList';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';
import orderService from '~/service/orderService';
import storeService from '~/service/storeService';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tất cả đơn hàng - SaveFood' },
    { name: 'description', content: 'Quản lý đơn hàng' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '0');
  const status = url.searchParams.get('status') || undefined;
  const storeId = url.searchParams.get('storeId') || undefined;
  const searchTerm = url.searchParams.get('search') || undefined;

  try {
    // Concurrent data fetching
    const [ordersData, storesData] = await Promise.all([
      orderService.getStoreOrders({
        storeId,
        page,
        size: 10,
        status: status as any,
        searchTerm,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      }),
      storeService.getMyStores({
        page: 0,
        size: 100,
        sortBy: 'storeName',
        sortDirection: 'ASC',
      })
    ]);

    return {
      initialOrders: ordersData.content,
      initialTotalPages: ordersData.totalPages,
      initialStores: storesData.content,
      initialPage: page,
      initialStatus: status,
      initialStoreId: storeId,
      initialSearchTerm: searchTerm,
    };
  } catch (error) {
    console.error('Loader error:', error);
    return {
      initialOrders: [],
      initialTotalPages: 0,
      initialStores: [],
      initialPage: 0,
      initialStatus: undefined,
      initialStoreId: undefined,
      initialSearchTerm: undefined,
    };
  }
}

export default function OrdersListRoute({ loaderData }: Route.ComponentProps) {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <OrdersList loaderData={loaderData} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
