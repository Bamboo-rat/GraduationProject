import type { Route } from "./+types/dashboard";
import Dashboard from "~/pages/Dashboard";
import ProtectedRoute from "~/component/common/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SaveFood - Dashboard" },
    { name: "description", content: "Welcome to the SaveFood admin dashboard!" },
  ];
}

export default function Home() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <Dashboard />
    </ProtectedRoute>
  );
}
