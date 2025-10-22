import type { Route } from './+types/registration';
import Registration from '~/pages/Registration';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Đăng ký đối tác - SaveFood' },
    { name: 'description', content: 'Đăng ký trở thành đối tác nhà cung cấp' },
  ];
}

export default function RegistrationRoute() {
  return <Registration />;
}
