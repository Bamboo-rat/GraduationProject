import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/welcome.tsx"),

  route("login", "routes/profile/login.tsx"),
  route("registration", "routes/profile/registration.tsx"),
  route("forgot-password", "routes/profile/forgot-password.tsx"),
  route("reset-password", "routes/profile/reset-password.tsx"),
  route("my-profile", "routes/profile/my-profile.tsx"),

  // Dashboard routes
  route("dashboard/overview", "routes/dashboard/overview.tsx"),
  route("dashboard/orders", "routes/dashboard/orders.tsx"),
  route("dashboard/inventory", "routes/dashboard/inventory.tsx"),

  // Products routes
  route("products/list", "routes/products/list.tsx"),
  route("products/create", "routes/products/create.tsx"),
  route("products/edit/:productId", "routes/products/edit/$productId.tsx"),
  route("products/categories", "routes/products/categories.tsx"),
  route("products/review-status", "routes/products/review-status.tsx"),

  // Orders routes
  route("orders/list", "routes/orders/list.tsx"),
  route("orders/returns", "routes/orders/returns.tsx"),

  // Delivery routes
  route("delivery/assign", "routes/delivery/assign.tsx"),
  route("delivery/tracking", "routes/delivery/tracking.tsx"),

  // Finance routes
  route("finance/revenue", "routes/finance/revenue.tsx"),
  route("finance/transactions", "routes/finance/transactions.tsx"),
  route("finance/withdraw", "routes/finance/withdraw.tsx"),

  // Reports routes
  route("reports/revenue-over-time", "routes/reports/revenue-over-time.tsx"),
  route("reports/top-products", "routes/reports/top-products.tsx"),
  route("reports/delivery", "routes/reports/delivery.tsx"),
  route("reports/reviews-analysis", "routes/reports/reviews-analysis.tsx"),

  // Store routes
  route("store/list", "routes/store/listStore.tsx"),
  route("store/profile", "routes/store/profile.tsx"),
  route("store/create", "routes/store/create.tsx"),
  route("store/edit/:storeId", "routes/store/edit/$storeId.tsx"),
  route("store/update-request", "routes/store/update-request.tsx"),
  route("store/update-history", "routes/store/update-history.tsx"),

  // Feedback routes
  route("feedback/reviews", "routes/feedback/reviews.tsx"),
  route("feedback/support", "routes/feedback/support.tsx"),

  // Settings routes
  route("settings/notifications", "routes/settings/notifications.tsx"),
  route("settings/policies", "routes/settings/policies.tsx"),

] satisfies RouteConfig;
