import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/auth.tsx"),

    // Dashboard
    route("dashboard", "routes/dashboard.tsx"),
    route("dashboard/overview", "routes/dashboard/overview.tsx"),
    route("dashboard/monitor", "routes/dashboard/monitor.tsx"),

    // Profile
    route("profile", "routes/profile.tsx"),
    route("reset-password", "routes/resetPassword.tsx"),
    route("forgot-password", "routes/forgotPassword.tsx"),
    
    // Partners Management
    route("partners/list", "routes/partners/list.tsx"),
    route("partners/pending", "routes/partners/pending.tsx"),
    route("partners/store-pending-updates", "routes/partners/store-pending-updates.tsx"),
    route("partners/performance", "routes/partners/performance.tsx"),

    // Products Management
    route("products/list", "routes/products/list.tsx"),
    route("products/review", "routes/products/review.tsx"),
    route("products/category-suggestions", "routes/products/category-suggestions.tsx"),
    route("products/categories", "routes/products/categories.tsx"),

    // Customers Management
    route("customers/list", "routes/customers/list.tsx"),
    route("support/tickets", "routes/customers/supportTickets.tsx"),

    // Operations
    route("orders/list", "routes/orders/list.tsx"),
    route("delivery/management", "routes/orders/deliveryManagement.tsx"),

    // Finance
    route("finance/reconciliation", "routes/finance/reconciliation.tsx"),
    route("finance/transactions", "routes/finance/transactions.tsx"),

    // Reports & Analytics
    route("reports/revenue", "routes/reports/revenue.tsx"),
    route("reports/behavior", "routes/reports/behavior.tsx"),
    route("reports/waste", "routes/reports/waste.tsx"),

    // Settings
    route("settings/roles", "routes/settings/roles.tsx"),
    route("settings/marketing", "routes/settings/marketing.tsx"),
    route("settings/notifications", "routes/settings/notifications.tsx"),
    route("settings/audit", "routes/settings/audit.tsx")

    // Employees - Admins
    ,route("employees/admins", "routes/employees/admins.tsx")
] satisfies RouteConfig;
