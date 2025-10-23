import type { Route } from './+types/categories';
import CategoriesManagement from '~/pages/products/CategoriesManagement';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý Danh mục - SaveFood' },
    { name: 'description', content: 'Quản lý danh mục sản phẩm' },
  ];
}

export default function CategoriesRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <CategoriesManagement />
    </ProtectedRoute>
  );
}
