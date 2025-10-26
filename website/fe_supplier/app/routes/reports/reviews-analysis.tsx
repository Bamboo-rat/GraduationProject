import type { Route } from './+types/reviews-analysis';
import ReviewsAnalysis from '~/pages/reports/ReviewsAnalysis';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Phân tích đánh giá - SaveFood' },
    { name: 'description', content: 'Phân tích đánh giá từ khách hàng' },
  ];
}

export default function ReviewsAnalysisRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <ReviewsAnalysis />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
