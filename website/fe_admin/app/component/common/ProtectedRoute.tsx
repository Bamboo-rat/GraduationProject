import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Debug: Log user roles
  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - User roles:', user?.roles);
  console.log('ProtectedRoute - Required roles:', requiredRoles);

  // Check if user has required roles
  if (requiredRoles && requiredRoles.length > 0) {
    // SUPER_ADMIN has access to everything (check multiple formats)
    const userRoles = user?.roles || [];
    const isSuperAdmin = userRoles.some(role =>
      role === 'ROLE_SUPER_ADMIN' ||
      role === 'SUPER_ADMIN' ||
      role === 'super-admin' ||
      role === 'super_admin'
    );

    console.log('ProtectedRoute - Is Super Admin:', isSuperAdmin);

    if (isSuperAdmin) {
      // SUPER_ADMIN bypasses all role checks
      return <>{children}</>;
    }

    // Check if user has any of the required roles (support multiple formats)
    const hasRequiredRole = requiredRoles.some(requiredRole => {
      return userRoles.some(userRole => {
        // Normalize both roles for comparison (remove ROLE_ prefix and convert to uppercase)
        const normalizedUserRole = userRole.replace(/^ROLE_/i, '').toUpperCase();
        const normalizedRequiredRole = requiredRole.replace(/^ROLE_/i, '').toUpperCase();
        return normalizedUserRole === normalizedRequiredRole;
      });
    });

    console.log('ProtectedRoute - Has required role:', hasRequiredRole);

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <svg
              className="w-24 h-24 mx-auto text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Không có quyền truy cập
            </h1>
            <p className="text-gray-600 mb-6">
              Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
