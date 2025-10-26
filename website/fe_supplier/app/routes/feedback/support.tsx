import type { Route } from './+types/support';
import CustomerSupport from '~/pages/feedback/CustomerSupport';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Khiếu nại & Hỗ trợ - SaveFood' },
    { name: 'description', content: 'Quản lý khiếu nại và hỗ trợ khách hàng' },
  ];
}

export default function CustomerSupportRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <CustomerSupport />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
