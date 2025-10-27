import type { Route } from './+types/$productId';
import EditProduct from '~/pages/products/EditProduct';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chỉnh sửa sản phẩm - SaveFood' },
    { name: 'description', content: 'Chỉnh sửa thông tin sản phẩm' },
  ];
}

export default function ProductEditRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <EditProduct />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
