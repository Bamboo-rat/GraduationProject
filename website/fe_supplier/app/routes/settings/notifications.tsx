import type { Route } from './+types/notifications';
import NotificationSettings from '~/pages/settings/NotificationSettings';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cấu hình thông báo - SaveFood' },
    { name: 'description', content: 'Cấu hình thông báo hệ thống' },
  ];
}

export default function NotificationSettingsRoute() {
  return <NotificationSettings />;
}
