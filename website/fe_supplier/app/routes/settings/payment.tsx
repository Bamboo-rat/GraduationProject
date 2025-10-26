import type { Route } from './+types/payment';
import PaymentSettings from '~/pages/settings/PaymentSettings';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cấu hình thanh toán - SaveFood' },
    { name: 'description', content: 'Cấu hình thông tin thanh toán' },
  ];
}

export default function PaymentSettingsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <PaymentSettings />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
