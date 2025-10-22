import type { Route } from './+types/returns';
import OrdersReturns from '~/pages/orders/OrdersReturns';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Đơn hàng trả lại - SaveFood' },
    { name: 'description', content: 'Quản lý đơn hàng trả lại' },
  ];
}

export default function OrdersReturnsRoute() {
  return <OrdersReturns />;
}
