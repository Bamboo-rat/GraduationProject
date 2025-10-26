import type { Route } from './+types/list-products';
import ProductsList from '~/pages/products/ProductsList';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tất cả Sản phẩm - SaveFood' },
    { name: 'description', content: 'Quản lý sản phẩm' },
  ];
}

export default function ProductsListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <ProductsList />
    </ProtectedRoute>
  );
}
