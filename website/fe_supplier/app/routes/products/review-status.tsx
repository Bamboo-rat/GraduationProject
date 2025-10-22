import type { Route } from './+types/review-status';
import ProductReviewStatus from '~/pages/products/ProductReviewStatus';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Trạng thái duyệt - SaveFood' },
    { name: 'description', content: 'Theo dõi trạng thái duyệt sản phẩm' },
  ];
}

export default function ProductReviewStatusRoute() {
  return <ProductReviewStatus />;
}
