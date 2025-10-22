import type { Route } from './+types/assign';
import DeliveryAssign from '~/pages/delivery/DeliveryAssign';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Gán đơn hàng - SaveFood' },
    { name: 'description', content: 'Gán đơn hàng cho người giao hàng' },
  ];
}

export default function DeliveryAssignRoute() {
  return <DeliveryAssign />;
}
