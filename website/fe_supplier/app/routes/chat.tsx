import type { Route } from './+types/chat';
import SupplierAdminChat from '~/pages/chat/SupplierAdminChat';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chat với Admin - SaveFood' },
    { name: 'description', content: 'Liên hệ và nhận hỗ trợ từ Admin' },
  ];
}

export default function ChatRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <SupplierAdminChat />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
