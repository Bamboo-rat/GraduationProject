import type { Route } from './+types/top-products';
import TopProducts from '~/pages/reports/TopProducts';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sản phẩm bán chạy nhất - SaveFood' },
    { name: 'description', content: 'Thống kê sản phẩm bán chạy' },
  ];
}

export default function TopProductsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <TopProducts />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
