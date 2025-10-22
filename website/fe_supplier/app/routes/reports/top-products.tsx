import type { Route } from './+types/top-products';
import TopProducts from '~/pages/reports/TopProducts';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sản phẩm bán chạy nhất - SaveFood' },
    { name: 'description', content: 'Thống kê sản phẩm bán chạy' },
  ];
}

export default function TopProductsRoute() {
  return <TopProducts />;
}
