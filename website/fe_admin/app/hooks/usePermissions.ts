import { useMemo } from 'react';
import { useAuth } from '../AuthContext';
import type { AdminRole, Permission } from '../utils/rolePermissions';
import { hasPermission, hasAnyPermission, hasAllPermissions, getRolePermissions, canAccessRoute } from '../utils/rolePermissions';

/**
 * Custom hook for checking user permissions
 * Usage:
 * 
 * const { can, canAny, canAll, canAccess, role, permissions } = usePermissions();
 * 
 * if (can('products.delete')) {
 *   // Show delete button
 * }
 * 
 * if (canAny(['products.edit', 'products.delete'])) {
 *   // Show edit/delete actions
 * }
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const role = useMemo((): AdminRole | null => {
    if (!user?.roles || user.roles.length === 0) return null;

    // Normalize role name
    const userRole = user.roles[0]
      .replace(/^ROLE_/i, '')
      .toUpperCase() as AdminRole;

    // Validate role
    if (['SUPER_ADMIN', 'MONITOR', 'STAFF'].includes(userRole)) {
      return userRole;
    }

    return null;
  }, [user]);

  const permissions = useMemo(() => {
    if (!role) return [];
    return getRolePermissions(role);
  }, [role]);

  /**
   * Check if user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (permissionList: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissionList);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (permissionList: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissionList);
  };

  /**
   * Check if user can access a route
   */
  const canAccess = (route: string): boolean => {
    if (!role) return false;
    return canAccessRoute(role, route);
  };

  /**
   * Check if user is Super Admin
   */
  const isSuperAdmin = role === 'SUPER_ADMIN';

  /**
   * Check if user is Moderator
   */
  const isModerator = role === 'MODERATOR';

  /**
   * Check if user is Staff
   */
  const isStaff = role === 'STAFF';

  return {
    role,
    permissions,
    can,
    canAny,
    canAll,
    canAccess,
    isSuperAdmin,
    isModerator,
    isStaff,
  };
};

export default usePermissions;

