import type { Route } from './+types/store-approval';
import StoreApproval from '~/pages/partners/StoreApproval';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Duyệt Cửa hàng mới - SaveFood' },
    { name: 'description', content: 'Duyệt cửa hàng mới từ nhà cung cấp' },
  ];
}

export default function StoreApprovalRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <StoreApproval />
    </ProtectedRoute>
  );
}
