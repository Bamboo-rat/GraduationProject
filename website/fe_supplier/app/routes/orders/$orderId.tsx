import type { Route } from './+types/$orderId';
import OrderDetail from '~/pages/orders/OrderDetail';
import DashboardLayout from '~/component/layout/DashboardLayout';
import orderService from '~/service/orderService';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Chi tiết đơn hàng - Nhà cung cấp' },
    { name: 'description', content: 'Xem chi tiết đơn hàng' },
  ];
}

// Loader: Pre-fetch order detail before navigation
export async function loader({ params }: Route.LoaderArgs) {
  const { orderId } = params;

  if (!orderId) {
    throw new Response('Order ID not found', { status: 404 });
  }

  try {
    const order = await orderService.getOrderById(orderId);
    return { initialOrder: order };
  } catch (error: any) {
    console.error('Loader error:', error);
    throw new Response(error.message || 'Failed to load order', { status: 404 });
  }
}

export default function OrderDetailRoute({ loaderData }: Route.ComponentProps) {
  return (
    <DashboardLayout>
      <OrderDetail loaderData={loaderData} />
    </DashboardLayout>
  );
}
