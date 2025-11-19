/**
 * Role-based Access Control (RBAC) Configuration
 * Định nghĩa quyền hạn cho từng vai trò admin
 */

export type AdminRole = 'SUPER_ADMIN' | 'MODERATOR' | 'STAFF';

export type Permission = 
  // Dashboard
  | 'dashboard.view.full'
  | 'dashboard.view.basic'
  
  // Employee Management
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'employees.view_staff_activity'
  
  // Partner Management
  | 'partners.view'
  | 'partners.approve'
  | 'partners.edit'
  | 'partners.delete'
  | 'partners.lock_temporary'
  | 'partners.lock_permanent'
  | 'partners.flag_violation'
  | 'partners.chat'
  
  // Store Management
  | 'stores.view'
  | 'stores.approve'
  | 'stores.edit'
  | 'stores.delete'
  
  // Customer Management
  | 'customers.view'
  | 'customers.view_detail'
  | 'customers.view_financial'
  | 'customers.edit'
  | 'customers.edit_tier'
  | 'customers.lock_temporary'
  | 'customers.lock_permanent'
  | 'customers.delete'
  | 'customers.flag_violation'
  
  // Product Management
  | 'products.view'
  | 'products.edit'
  | 'products.delete'
  | 'products.approve'
  | 'products.flag_violation'
  
  // Category Management
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  | 'categories.approve_suggestions'
  | 'categories.reject_suggestions'
  
  // Finance Management
  | 'finance.view_basic'
  | 'finance.view_all'
  | 'finance.reconciliation'
  | 'finance.refund'
  | 'finance.flag_suspicious'
  | 'finance.request_review'
  
  // Marketing
  | 'marketing.view'
  | 'marketing.banners.create'
  | 'marketing.banners.edit'
  | 'marketing.banners.delete'
  | 'marketing.promotions.view'
  | 'marketing.promotions.create_small'
  | 'marketing.promotions.create_large'
  | 'marketing.promotions.approve'
  | 'marketing.promotions.edit'
  | 'marketing.promotions.delete'
  
  // Reports
  | 'reports.view_basic'
  | 'reports.view_all'
  | 'reports.view_financial'
  | 'reports.export'
  
  // Support
  | 'support.view'
  | 'support.handle_simple'
  | 'support.handle_complex'
  | 'support.chat'
  | 'support.evaluate_staff'
  
  // Settings
  | 'settings.view'
  | 'settings.edit'
  | 'settings.audit_log.view'
  | 'settings.roles.manage';

/**
 * Permission matrix for each role
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    // Dashboard
    'dashboard.view.full',
    
    // Employees - Full control
    'employees.view',
    'employees.create',
    'employees.edit',
    'employees.delete',
    'employees.view_staff_activity',
    
    // Partners - Full control
    'partners.view',
    'partners.approve',
    'partners.edit',
    'partners.delete',
    'partners.lock_temporary',
    'partners.lock_permanent',
    'partners.flag_violation',
    'partners.chat',
    
    // Stores - Full control
    'stores.view',
    'stores.approve',
    'stores.edit',
    'stores.delete',
    
    // Customers - Full control
    'customers.view',
    'customers.view_detail',
    'customers.view_financial',
    'customers.edit',
    'customers.edit_tier',
    'customers.lock_temporary',
    'customers.lock_permanent',
    'customers.delete',
    'customers.flag_violation',
    
    // Products - Full control
    'products.view',
    'products.edit',
    'products.delete',
    'products.approve',
    'products.flag_violation',
    
    // Categories - Full control
    'categories.view',
    'categories.create',
    'categories.edit',
    'categories.delete',
    'categories.approve_suggestions',
    'categories.reject_suggestions',
    
    // Finance - Full control
    'finance.view_basic',
    'finance.view_all',
    'finance.reconciliation',
    'finance.refund',
    'finance.flag_suspicious',
    'finance.request_review',
    
    // Marketing - Full control
    'marketing.view',
    'marketing.banners.create',
    'marketing.banners.edit',
    'marketing.banners.delete',
    'marketing.promotions.view',
    'marketing.promotions.create_small',
    'marketing.promotions.create_large',
    'marketing.promotions.approve',
    'marketing.promotions.edit',
    'marketing.promotions.delete',
    
    // Reports - Full access
    'reports.view_basic',
    'reports.view_all',
    'reports.view_financial',
    'reports.export',
    
    // Support - Full control
    'support.view',
    'support.handle_simple',
    'support.handle_complex',
    'support.chat',
    'support.evaluate_staff',
    
    // Settings - Full control
    'settings.view',
    'settings.edit',
    'settings.audit_log.view',
    'settings.roles.manage',
  ],

  MODERATOR: [
    // Dashboard - Full view
    'dashboard.view.full',
    
    // Employees - Limited to viewing staff activity
    'employees.view_staff_activity',
    
    // Partners - View, flag, temporary lock
    'partners.view',
    'partners.lock_temporary',
    'partners.flag_violation',
    'partners.chat',
    
    // Stores - View only
    'stores.view',
    
    // Customers - View, flag, temporary lock
    'customers.view',
    'customers.view_detail',
    'customers.view_financial',
    'customers.lock_temporary',
    'customers.flag_violation',
    
    // Products - View, delete violations, approve
    'products.view',
    'products.delete',
    'products.approve',
    'products.flag_violation',
    
    // Categories - View, approve/reject suggestions
    'categories.view',
    'categories.approve_suggestions',
    'categories.reject_suggestions',
    
    // Finance - View all, flag, request review
    'finance.view_basic',
    'finance.view_all',
    'finance.flag_suspicious',
    'finance.request_review',
    
    // Marketing - View, manage banners, approve promotions
    'marketing.view',
    'marketing.banners.create',
    'marketing.banners.edit',
    'marketing.banners.delete',
    'marketing.promotions.view',
    'marketing.promotions.approve',
    
    // Reports - Full access with export
    'reports.view_basic',
    'reports.view_all',
    'reports.view_financial',
    'reports.export',
    
    // Support - Handle complex, chat, evaluate staff
    'support.view',
    'support.handle_simple',
    'support.handle_complex',
    'support.chat',
    'support.evaluate_staff',
    
    // Settings - View audit log only
    'settings.view',
    'settings.audit_log.view',
  ],

  STAFF: [
    // Dashboard - Basic view only
    'dashboard.view.basic',
    
    // Partners - View, approve new partners, chat
    'partners.view',
    'partners.approve',
    'partners.chat',
    
    // Stores - View only
    'stores.view',
    
    // Customers - View basic info, handle support
    'customers.view',
    'customers.view_detail',
    
    // Products - View only
    'products.view',
    
    // Categories - View, approve simple suggestions
    'categories.view',
    'categories.approve_suggestions',
    
    // Finance - No access
    
    // Marketing - Create/edit small banners, view promotions
    'marketing.view',
    'marketing.banners.create',
    'marketing.banners.edit',
    'marketing.promotions.view',
    
    // Reports - Basic view only, no export
    'reports.view_basic',
    
    // Support - Handle simple tickets, chat
    'support.view',
    'support.handle_simple',
    'support.chat',
    
    // Settings - No access
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: AdminRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: AdminRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: AdminRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: AdminRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Route access configuration
 */
export const ROUTE_ACCESS: Record<string, AdminRole[]> = {
  '/dashboard': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  
  // Employee routes
  '/employees': ['SUPER_ADMIN'],
  '/employees/admins': ['SUPER_ADMIN'],
  
  // Partner routes
  '/partners': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/partners/list-partners': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/partners/pending': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/partners/store-approval': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/partners/performance': ['SUPER_ADMIN', 'MODERATOR'],
  '/partners/business-updates': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/partners/chat': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  
  // Customer routes
  '/customers': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/customers/list-customers': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/customers/supportTickets': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  
  // Product routes
  '/products': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/products/list-products': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/products/categories': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/products/category-suggestions': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  
  // Finance routes
  '/finance': ['SUPER_ADMIN', 'MODERATOR'],
  '/finance/transactions': ['SUPER_ADMIN', 'MODERATOR'],
  '/finance/reconciliation': ['SUPER_ADMIN', 'MODERATOR'],
  
  // Marketing routes
  '/marketing': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/marketing/banners': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/marketing/promotions': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  
  // Report routes
  '/reports': ['SUPER_ADMIN', 'MODERATOR', 'STAFF'],
  '/reports/revenue': ['SUPER_ADMIN', 'MODERATOR'],
  '/reports/waste': ['SUPER_ADMIN', 'MODERATOR'],
  '/reports/behavior': ['SUPER_ADMIN', 'MODERATOR'],
  
  // Settings routes
  '/settings': ['SUPER_ADMIN', 'MODERATOR'],
  '/settings/system-settings': ['SUPER_ADMIN'],
  '/settings/roles': ['SUPER_ADMIN'],
  '/settings/audit': ['SUPER_ADMIN', 'MODERATOR'],
};

/**
 * Check if a role can access a route
 */
export const canAccessRoute = (role: AdminRole, route: string): boolean => {
  const allowedRoles = ROUTE_ACCESS[route];
  return allowedRoles ? allowedRoles.includes(role) : false;
};
