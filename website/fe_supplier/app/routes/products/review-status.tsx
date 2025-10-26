import type { Route } from './+types/review-status';
import ProductReviewStatus from '~/pages/products/ProductReviewStatus';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Trạng thái duyệt - SaveFood' },
    { name: 'description', content: 'Theo dõi trạng thái duyệt sản phẩm' },
  ];
}

export default function ProductReviewStatusRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <ProductReviewStatus />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
