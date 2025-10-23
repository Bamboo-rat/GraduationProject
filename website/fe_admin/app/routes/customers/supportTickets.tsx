import type { Route } from './+types/supportTickets';
import SupportTickets from '~/pages/customers/SupportTickets';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Vé hỗ trợ - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách vé hỗ trợ' },
  ];
}

export default function SupportTicketsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <SupportTickets />
    </ProtectedRoute>
  );
}
