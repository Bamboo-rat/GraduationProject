import type { Route } from './+types/tracking';
import DeliveryTracking from '~/pages/delivery/DeliveryTracking';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Theo dõi giao hàng - SaveFood' },
    { name: 'description', content: 'Theo dõi trạng thái giao hàng' },
  ];
}

export default function DeliveryTrackingRoute() {
  return <DeliveryTracking />;
}
