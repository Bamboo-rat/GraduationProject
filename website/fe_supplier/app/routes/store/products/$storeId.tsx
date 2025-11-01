import type { Route } from './+types/$storeId';
import StoreProducts from '~/pages/store/StoreProducts';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sản phẩm tại cửa hàng - SaveFood Supplier' },
    { name: 'description', content: 'Xem danh sách sản phẩm có sẵn tại cửa hàng' },
  ];
}

export default function StoreProductsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <StoreProducts />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
