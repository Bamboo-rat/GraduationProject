import type { Route } from './+types/reviews';
import CustomerReviews from '~/pages/feedback/CustomerReviews';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Đánh giá & Nhận xét - SaveFood' },
    { name: 'description', content: 'Quản lý đánh giá từ khách hàng' },
  ];
}

export default function CustomerReviewsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <CustomerReviews />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
