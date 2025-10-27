import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import authService from '~/service/authService';
import type { LoginRequest, UserInfo } from '~/service/authService';

// Định nghĩa kiểu cho Context
interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  isLoading: boolean; // Trạng thái tải (kiểm tra auth ban đầu)
  login: (credentials: LoginRequest) => Promise<UserInfo>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<UserInfo | null>; // Tải lại thông tin user
  // Backwards-compatible alias used in some components
  refreshUser: () => Promise<UserInfo | null>;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Bắt đầu ở trạng thái tải

  /**
   * Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động.
   * Chỉ chạy một lần.
   */
  useEffect(() => {
    const checkAuthState = async () => {
      console.log('🚀 AuthContext: Checking auth state...');
      try {
        // Kiểm tra xem token có tồn tại trong localStorage không
        if (authService.isAuthenticated()) {
          console.log('✅ AuthContext: Token found');
          // Lấy thông tin người dùng từ localStorage
          const userInfo = authService.getUserInfo();
          console.log('👤 AuthContext: UserInfo from localStorage:', userInfo);

          if (userInfo) {
            setUser(userInfo);
            setIsAuthenticated(true);
            console.log('✅ AuthContext: User authenticated from cache');

            // Tùy chọn: Gọi API /auth/me để xác thực token và lấy thông tin mới nhất
            // Nếu API call này thất bại (ví dụ token hết hạn), nó sẽ bị bắt bởi interceptor của axios
            // hoặc bởi block catch() dưới đây.
            try {
              const freshUserInfo = await authService.getCurrentUser();
              // Cập nhật lại thông tin mới nhất (lưu trực tiếp vào localStorage vì setUserInfo là private trong service)
              try {
                localStorage.setItem('user_info', JSON.stringify(freshUserInfo));
              } catch {
                // ignore storage errors
              }
              setUser(freshUserInfo);
              console.log('✅ AuthContext: User validated from API');
            } catch (err) {
              console.error('❌ AuthContext: Token validation failed, logging out:', err);
              // Nếu token không hợp lệ, đăng xuất
              authService.clearAuth();
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // Có token nhưng không có user info -> trạng thái không hợp lệ -> đăng xuất
            console.warn('⚠️ AuthContext: Token exists but no user info, clearing auth');
            authService.clearAuth();
            setIsAuthenticated(false);
          }
        } else {
          console.log('ℹ️ AuthContext: No token found, user not authenticated');
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Xử lý lỗi (nếu có)
        console.error('❌ AuthContext: Error checking auth state:', error);
        authService.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // Hoàn tất kiểm tra, tắt trạng thái tải
        setIsLoading(false);
        console.log('✅ AuthContext: Auth check complete');
      }
    };

    checkAuthState();
  }, []);

  /**
   * Xử lý đăng nhập
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    console.log('🔐 AuthContext: Login attempt for user:', credentials.username);
    try {
      const loginResponse = await authService.login(credentials);
      console.log('✅ AuthContext: Login successful, userInfo:', loginResponse.userInfo);
      setUser(loginResponse.userInfo);
      setIsAuthenticated(true);
      console.log('✅ AuthContext: Auth state updated');
      return loginResponse.userInfo;
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      // Xóa mọi trạng thái auth cũ nếu đăng nhập thất bại
      authService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      throw error; // Ném lỗi để form có thể bắt và hiển thị
    }
  }, []);

  /**
   * Xử lý đăng xuất
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during API logout, clearing local auth anyway.', error);
    } finally {
      // Luôn luôn dọn dẹp localStorage và state
      authService.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * Tải lại thông tin người dùng từ API
   * (Hữu ích khi cập nhật profile)
   */
  const reloadUser = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      const freshUserInfo = await authService.getCurrentUser();
      try {
        localStorage.setItem('user_info', JSON.stringify(freshUserInfo));
      } catch {
        // ignore storage errors
      }
      setUser(freshUserInfo); // Cập nhật state
      return freshUserInfo;
    } catch (error) {
      console.error('Failed to reload user, logging out.', error);
      // Nếu API /auth/me thất bại (ví dụ token bị thu hồi), đăng xuất
      await logout();
      return null;
    }
  }, [isAuthenticated, logout]);

  // Giá trị cung cấp cho Context
  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    reloadUser,
    refreshUser: reloadUser,
  };

  // Chỉ render children khi đã kiểm tra xong auth (isLoading = false)
  // Hoặc bạn có thể render một spinner toàn trang ở đây
  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : null /* Hoặc <GlobalSpinner /> */}
    </AuthContext.Provider>
  );
}

// Hook tùy chỉnh để sử dụng AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}