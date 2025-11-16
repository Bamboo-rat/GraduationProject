import type { Route } from './+types/list-partners';
import PartnersList from '~/pages/partners/PartnersList';
import ProtectedRoute from '~/component/common/ProtectedRoute';
import supplierService from '~/service/supplierService';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Đối tác - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách đối tác' },
  ];
}

// React Router 7 Loader - Fetches data BEFORE navigation
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '0');
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || '';

  try {
    const response = await supplierService.getAllSuppliers(
      page,
      20,
      status as any,
      search,
      'createdAt',
      'DESC'
    );
    return {
      suppliers: response.content,
      totalPages: response.totalPages,
      totalElements: response.totalElements,
      initialPage: page,
      initialStatus: status,
      initialSearch: search,
    };
  } catch (error: any) {
    // Return error state instead of throwing
    return {
      suppliers: [],
      totalPages: 0,
      totalElements: 0,
      initialPage: 0,
      initialStatus: undefined,
      initialSearch: '',
      error: error.message || 'Không thể tải danh sách đối tác',
    };
  }
}

export default function PartnersListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <PartnersList />
    </ProtectedRoute>
  );
}
