import type { Route } from './+types/login';
import Login from '~/pages/Login';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Đăng nhập - SaveFood' },
    { name: 'description', content: 'Đăng nhập vào cổng nhà cung cấp' },
  ];
}

export default function LoginRoute() {
  return <Login />;
}
