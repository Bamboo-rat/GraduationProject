# Profile & Settings Pages

Folder này chứa các trang liên quan đến thông tin cá nhân và cài đặt tài khoản.

## Cấu trúc

```
profile/
├── Profile.tsx          # Trang thông tin cá nhân
├── ChangePassword.tsx   # Trang đổi mật khẩu (coming soon)
├── Settings.tsx         # Trang cài đặt (coming soon)
├── Notifications.tsx    # Trang cài đặt thông báo (coming soon)
└── index.ts            # Export module
```

## Các tính năng

### Profile.tsx
- ✅ Hiển thị thông tin cá nhân (username, email, fullName, phoneNumber)
- ✅ Hiển thị role và status của tài khoản
- ✅ Chỉnh sửa thông tin cá nhân (email, fullName, phoneNumber)
- ✅ Hiển thị avatar với ký tự đầu tiên của username
- ✅ Hiển thị thông tin tài khoản (ngày tạo, cập nhật, ID)
- ✅ Quick actions buttons (Đổi mật khẩu, Thông báo, Bảo mật)

### ChangePassword.tsx (Coming Soon)
- 🔄 Form đổi mật khẩu
- 🔄 Validation mật khẩu mới
- 🔄 Xác nhận mật khẩu hiện tại

### Settings.tsx (Coming Soon)
- 🔄 Cài đặt chung
- 🔄 Tùy chỉnh giao diện
- 🔄 Cài đặt bảo mật

### Notifications.tsx (Coming Soon)
- 🔄 Cài đặt thông báo email
- 🔄 Cài đặt thông báo push
- 🔄 Quản lý tùy chọn thông báo

## API Endpoints

```typescript
GET    /api/auth/me              // Lấy thông tin user hiện tại
PUT    /api/auth/profile         // Cập nhật thông tin cá nhân
POST   /api/auth/change-password // Đổi mật khẩu
POST   /api/auth/avatar          // Upload avatar
```

## Usage

```tsx
import { Profile } from './pages/profile';

// Trong route
<Route path="/profile" element={<Profile />} />
```

## Dependencies

- React 19+
- React Router v7
- Lucide React (icons)
- AuthContext (authentication)
- profileService (API calls)
