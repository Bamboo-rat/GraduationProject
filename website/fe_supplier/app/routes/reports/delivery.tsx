import type { Route } from './+types/delivery';
import DeliveryReport from '~/pages/reports/DeliveryReport';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Báo cáo giao hàng - SaveFood' },
    { name: 'description', content: 'Báo cáo tình hình giao hàng' },
  ];
}

export default function DeliveryReportRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <DeliveryReport />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
