import type { Route } from './+types/support';
import CustomerSupport from '~/pages/feedback/CustomerSupport';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Khiếu nại & Hỗ trợ - SaveFood' },
    { name: 'description', content: 'Quản lý khiếu nại và hỗ trợ khách hàng' },
  ];
}

export default function CustomerSupportRoute() {
  return <CustomerSupport />;
}
