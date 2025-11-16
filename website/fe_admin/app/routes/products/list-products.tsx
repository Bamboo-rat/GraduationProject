import type { Route } from './+types/list-products';
import ProductsList from '~/pages/products/ProductsList';
import ProtectedRoute from '~/component/common/ProtectedRoute';
import { productService } from '~/service/productService';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tất cả Sản phẩm - SaveFood' },
    { name: 'description', content: 'Quản lý sản phẩm' },
  ];
}

// React Router 7 Loader - Fetches data BEFORE navigation
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '0');
  const status = url.searchParams.get('status') || '';
  const categoryId = url.searchParams.get('category') || '';
  const search = url.searchParams.get('search') || '';

  try {
    const params: any = {
      page,
      size: 20,
      sort: 'createdAt,desc'
    };

    if (status) params.status = status;
    if (categoryId) params.categoryId = categoryId;
    if (search) params.search = search;

    const response = await productService.getProductsSummary(params);
    const pageData = response?.data;

    return {
      products: pageData?.content || [],
      totalPages: pageData?.totalPages || 0,
      totalElements: pageData?.totalElements || 0,
      initialPage: page,
      initialStatus: status,
      initialCategory: categoryId,
      initialSearch: search,
    };
  } catch (error: any) {
    return {
      products: [],
      totalPages: 0,
      totalElements: 0,
      initialPage: 0,
      initialStatus: '',
      initialCategory: '',
      initialSearch: '',
      error: error.message || 'Không thể tải danh sách sản phẩm',
    };
  }
}

export default function ProductsListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <ProductsList />
    </ProtectedRoute>
  );
}
