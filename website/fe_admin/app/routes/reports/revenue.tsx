import type { Route } from './+types/revenue';
import RevenueReport from '~/pages/reports/RevenueReport';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý Doanh thu - SaveFood' },
    { name: 'description', content: 'Quản lý doanh thu sản phẩm' },
  ];
}

export default function RevenueRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
        <RevenueReport />
    </ProtectedRoute>
  );
}
