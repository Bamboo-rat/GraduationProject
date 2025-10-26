import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

/**
 * ProtectedRoute component - Ensures user is authenticated before accessing routes
 *
 * Features:
 * - Redirects to /login if not authenticated
 * - Shows loading state while checking auth
 * - Role-based access control with multiple format support
 * - Shows access denied UI when unauthorized
 *
 * Usage:
 * <ProtectedRoute>
 *   <DashboardComponent />
 * </ProtectedRoute>
 *
 * Or with role requirements:
 * <ProtectedRoute requiredRoles={['SUPPLIER']}>
 *   <SupplierPanel />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8FFED] via-[#FFFEFA] to-[#F5EDE6] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#2F855A] mb-4"></div>
          <p className="text-[#6B6B6B] font-medium">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Debug: Log user roles (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('ProtectedRoute - User:', user);
    console.log('ProtectedRoute - User roles:', user?.roles);
    console.log('ProtectedRoute - Required roles:', requiredRoles);
  }

  // Check if user has required roles
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = user?.roles || [];

    // Check if user has any of the required roles (support multiple formats)
    const hasRequiredRole = requiredRoles.some(requiredRole => {
      return userRoles.some(userRole => {
        // Normalize both roles for comparison (remove ROLE_ prefix and convert to uppercase)
        const normalizedUserRole = userRole.replace(/^ROLE_/i, '').toUpperCase();
        const normalizedRequiredRole = requiredRole.replace(/^ROLE_/i, '').toUpperCase();
        return normalizedUserRole === normalizedRequiredRole;
      });
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('ProtectedRoute - Has required role:', hasRequiredRole);
    }

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#E8FFED] via-[#FFFEFA] to-[#F5EDE6] flex items-center justify-center">
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
              className="bg-[#2F855A] text-white px-6 py-2 rounded-lg hover:bg-[#276749] transition-colors"
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
