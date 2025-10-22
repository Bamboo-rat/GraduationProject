import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRoles?: string[];
}

/**
 * ProtectedRoute component - Ensures user is authenticated before accessing routes
 *
 * Features:
 * - Redirects to /login if not authenticated
 * - Shows loading state while checking auth
 * - Optional role-based access control
 *
 * Usage:
 * <ProtectedRoute>
 *   <DashboardComponent />
 * </ProtectedRoute>
 *
 * Or with role requirements:
 * <ProtectedRoute requireRoles={['SUPPLIER', 'ADMIN']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRoles }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      // Check role requirements if specified
      if (requireRoles && requireRoles.length > 0 && user) {
        const hasRequiredRole = user.roles.some(role => requireRoles.includes(role));
        if (!hasRequiredRole) {
          // User doesn't have required role - redirect to welcome
          console.warn('User does not have required roles:', requireRoles);
          navigate('/', { replace: true });
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requireRoles, navigate]);

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

  // Not authenticated - show nothing (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role access
  if (requireRoles && requireRoles.length > 0 && user) {
    const hasRequiredRole = user.roles.some(role => requireRoles.includes(role));
    if (!hasRequiredRole) {
      return null; // Will redirect
    }
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
};

export default ProtectedRoute;
