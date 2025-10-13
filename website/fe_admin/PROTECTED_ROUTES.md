# 🔒 Protected Routes Implementation

## 📁 Files Created/Updated

```
app/
├── component/
│   └── ProtectedRoute.tsx    # ✅ Protected route wrapper
├── routes/
│   ├── auth.tsx              # ✅ Auto-redirect if logged in
│   └── dashboard.tsx         # ✅ Protected with role check
└── AuthContext.tsx           # Already exists
```

---

## 🛡️ ProtectedRoute Component

### Features
- ✅ Check authentication status
- ✅ Role-based access control
- ✅ Loading state during auth check
- ✅ Auto-redirect to `/auth` if not logged in
- ✅ Forbidden page if missing required roles
- ✅ Clean error UI

### Props
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];  // Optional role check
}
```

### Usage Examples

#### 1. Basic Protection (Any authenticated user)
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

#### 2. Role-based Protection
```tsx
<ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
  <AdminSettings />
</ProtectedRoute>
```

#### 3. Single Role
```tsx
<ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
  <SystemSettings />
</ProtectedRoute>
```

---

## 🔐 Authentication Flow

### 1. User Not Logged In → Dashboard
```
User visits /dashboard
    ↓
ProtectedRoute checks isAuthenticated
    ↓
isAuthenticated = false
    ↓
<Navigate to="/auth" replace />
    ↓
Redirected to login page
```

### 2. User Logged In → Dashboard
```
User visits /dashboard
    ↓
ProtectedRoute checks isAuthenticated
    ↓
isAuthenticated = true
    ↓
Check requiredRoles (optional)
    ↓
Roles match: Render Dashboard
Roles don't match: Show Forbidden page
```

### 3. Logged In User → Auth Page
```
Logged in user visits /auth
    ↓
Auth route checks isAuthenticated
    ↓
isAuthenticated = true
    ↓
navigate('/dashboard', { replace: true })
    ↓
Redirected to dashboard
```

---

## 🎨 UI States

### 1. Loading State
```tsx
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    <p className="mt-4 text-gray-600">Đang tải...</p>
  </div>
</div>
```

### 2. Forbidden State (No Permission)
```tsx
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center max-w-md">
    <svg className="w-24 h-24 mx-auto text-red-500 mb-4">
      {/* Warning icon */}
    </svg>
    <h1 className="text-2xl font-bold">Không có quyền truy cập</h1>
    <p className="text-gray-600">Bạn không có quyền truy cập vào trang này...</p>
    <button onClick={() => window.history.back()}>Quay lại</button>
  </div>
</div>
```

---

## 📋 Route Configuration

### Current Routes
```typescript
// app/routes.ts
export default [
    index("routes/auth.tsx"),           // Public: /
    route("dashboard", "routes/dashboard.tsx")  // Protected: /dashboard
] satisfies RouteConfig;
```

### Dashboard Route (Protected)
```tsx
// app/routes/dashboard.tsx
export default function Home() {
  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### Auth Route (Auto-redirect)
```tsx
// app/routes/auth.tsx
export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading]);

  return <Auth />;
}
```

---

## 🔑 Role Definitions

Based on backend:
- **SUPER_ADMIN**: Full system access
- **ADMIN**: Admin management access
- **STAFF**: Staff-level access

### Role Check Logic
```typescript
const hasRequiredRole = requiredRoles.some(role => 
  user?.roles?.includes(role)
);
```

---

## 🧪 Testing Scenarios

### Test 1: Unauthenticated Access
```
1. Clear localStorage
2. Visit http://localhost:3001/dashboard
3. Should redirect to /auth
4. Login successfully
5. Should redirect back to /dashboard
```

### Test 2: Authenticated Access
```
1. Login as admin
2. Visit http://localhost:3001/auth
3. Should auto-redirect to /dashboard
4. Should see dashboard content
```

### Test 3: Role-based Access
```
1. Login with user without ADMIN role
2. Visit protected route with requiredRoles={['ADMIN']}
3. Should see "Không có quyền truy cập" page
4. Click "Quay lại" button
5. Should navigate back
```

### Test 4: Loading State
```
1. Slow down network in DevTools
2. Refresh page
3. Should see loading spinner
4. Auth check completes
5. Should render appropriate content
```

---

## 🚀 Adding More Protected Routes

### Example: Add Partners Page
```typescript
// 1. Create route file
// app/routes/partners.tsx
import ProtectedRoute from "~/component/ProtectedRoute";
import Partners from "~/pages/Partners";

export default function PartnersRoute() {
  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
      <Partners />
    </ProtectedRoute>
  );
}

// 2. Register in routes.ts
export default [
    index("routes/auth.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("partners", "routes/partners.tsx"),  // ← Add this
] satisfies RouteConfig;
```

---

## 📊 Protected Routes Structure

```
Public Routes (No Auth Required)
├── / (auth page)
└── /auth (login page)

Protected Routes (Auth Required)
├── /dashboard (ADMIN, SUPER_ADMIN, STAFF)
├── /partners (ADMIN, SUPER_ADMIN)
├── /products (ADMIN, SUPER_ADMIN, STAFF)
├── /customers (ADMIN, SUPER_ADMIN, STAFF)
├── /orders (ADMIN, SUPER_ADMIN, STAFF)
├── /finance (ADMIN, SUPER_ADMIN)
├── /reports (ADMIN, SUPER_ADMIN, STAFF)
└── /settings (role-specific)
    ├── /settings/roles (SUPER_ADMIN only)
    ├── /settings/audit (SUPER_ADMIN only)
    └── /settings/profile (all authenticated)
```

---

## 🔧 Advanced Features (TODO)

### 1. Route-level Permissions
```typescript
interface RoutePermission {
  path: string;
  roles: string[];
  permissions?: string[];
}

const routePermissions: RoutePermission[] = [
  { path: '/settings/roles', roles: ['SUPER_ADMIN'], permissions: ['MANAGE_ROLES'] },
  { path: '/finance', roles: ['ADMIN', 'SUPER_ADMIN'], permissions: ['VIEW_FINANCE'] },
];
```

### 2. Breadcrumb Navigation
```typescript
<ProtectedRoute breadcrumbs={['Dashboard', 'Partners', 'Pending']}>
  <PendingPartners />
</ProtectedRoute>
```

### 3. Redirect After Login
```typescript
// Save intended destination before redirecting to login
localStorage.setItem('redirectAfterLogin', location.pathname);

// After successful login
const redirect = localStorage.getItem('redirectAfterLogin') || '/dashboard';
navigate(redirect, { replace: true });
localStorage.removeItem('redirectAfterLogin');
```

### 4. Session Timeout
```typescript
// Auto-logout after 30 minutes of inactivity
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  
  const resetTimeout = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      logout();
      navigate('/auth', { state: { message: 'Session expired' } });
    }, SESSION_TIMEOUT);
  };
  
  // Reset timeout on user activity
  window.addEventListener('mousemove', resetTimeout);
  window.addEventListener('keypress', resetTimeout);
  
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('mousemove', resetTimeout);
    window.removeEventListener('keypress', resetTimeout);
  };
}, [logout, navigate]);
```

---

## 🐛 Debugging

### Check Auth State in Console
```javascript
// Check if user is authenticated
localStorage.getItem('access_token')

// Check user info
JSON.parse(localStorage.getItem('user_info') || '{}')

// Check roles
JSON.parse(localStorage.getItem('user_info') || '{}').roles
```

### Force Logout
```javascript
localStorage.clear();
window.location.href = '/auth';
```

---

## ✅ Implementation Checklist

- [x] Create ProtectedRoute component
- [x] Add role-based access control
- [x] Implement loading states
- [x] Add forbidden page UI
- [x] Protect dashboard route
- [x] Add auto-redirect on auth page if logged in
- [ ] Add redirect after login to intended page
- [ ] Implement session timeout
- [ ] Add breadcrumb navigation
- [ ] Create all protected routes for menu items

---

**Last Updated**: 2025-10-11  
**Status**: ✅ Core Implementation Complete
