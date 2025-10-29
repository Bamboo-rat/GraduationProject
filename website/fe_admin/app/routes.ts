import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/auth.tsx"),

    // Dashboard
    route("dashboard/overview", "routes/dashboard/overview.tsx"),
    route("dashboard/monitor", "routes/dashboard/monitor.tsx"),
    route("dashboard/notification-monitor", "routes/dashboard/notification-monitor.tsx"),

    // Profile
    route("profile", "routes/profile.tsx"),
    route("profile/reset-password", "routes/profile/reset-password.tsx"),
    route("profile/forgot-password", "routes/profile/forgot-password.tsx"),
    
    // Partners Management
    route("partners/list-partners", "routes/partners/list-partners.tsx"),
    route("partners/pending", "routes/partners/pending.tsx"),
    route("partners/store-approval", "routes/partners/store-approval.tsx"),
    route("partners/performance", "routes/partners/performance.tsx"),

    // Products Management
    route("products/list-products", "routes/products/list-products.tsx"),
    route("products/review", "routes/products/review.tsx"),
    route("products/category-suggestions", "routes/products/category-suggestions.tsx"),
    route("products/categories", "routes/products/categories.tsx"),

    // Banner & Promotions
    route("marketing/banners", "routes/marketing/banners.tsx"),
    route("marketing/promotions", "routes/marketing/promotions.tsx"),

    // Customers Management
    route("customers/list-customers", "routes/customers/list-customers.tsx"),
    route("customers/:userId", "routes/customers/$userId.tsx"),
    route("support/tickets", "routes/customers/supportTickets.tsx"),

    // Operations
    route("orders/list-orders", "routes/orders/list-orders.tsx"),
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
