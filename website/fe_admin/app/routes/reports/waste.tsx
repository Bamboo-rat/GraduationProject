import type { Route } from './+types/waste';
import WasteReport from '~/pages/reports/WasteReport';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Báo cáo lãng phí - SaveFood' },
    { name: 'description', content: 'Báo cáo lãng phí sản phẩm' },
  ];
}

export default function WasteRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR']}>
        <WasteReport />
    </ProtectedRoute>
  );
}
