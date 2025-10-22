import type { Route } from './+types/delivery';
import DeliveryReport from '~/pages/reports/DeliveryReport';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Báo cáo giao hàng - SaveFood' },
    { name: 'description', content: 'Báo cáo tình hình giao hàng' },
  ];
}

export default function DeliveryReportRoute() {
  return <DeliveryReport />;
}
