import type { Route } from './+types/payment';
import PaymentSettings from '~/pages/settings/PaymentSettings';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cấu hình thanh toán - SaveFood' },
    { name: 'description', content: 'Cấu hình thông tin thanh toán' },
  ];
}

export default function PaymentSettingsRoute() {
  return <PaymentSettings />;
}
