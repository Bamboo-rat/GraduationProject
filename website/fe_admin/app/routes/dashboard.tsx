import type { Route } from "./+types/dashboard";
import Dashboard from "~/pages/Dashboard";
import ProtectedRoute from "~/component/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "FoodSave - Dashboard" },
    { name: "description", content: "Welcome to the FoodSave admin dashboard!" },
  ];
}

export default function Home() {
  return (
    <Dashboard />
    // <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}>
    //   <Dashboard />
    // </ProtectedRoute>
  );
}
