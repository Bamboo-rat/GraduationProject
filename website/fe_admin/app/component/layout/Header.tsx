import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router';
import NotificationDropdown from '../common/NotificationDropdown';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/', { replace: true });
    }
  };

  return (
    // {/* Nền header đã đúng màu #D9FFDF */}
    <header className="bg-[#D9FFDF] border-b border-[#B7E4C7] h-16 fixed top-0 right-0 left-64 z-10 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              // {/* Change: Cập nhật màu viền và màu focus cho input */}
              className="w-full pl-10 pr-4 py-2 border border-[#B7E4C7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F855A] focus:border-[#2F855A] bg-[#F8FFF9] text-gray-800 placeholder-gray-400 transition-colors"
            />
            <svg
              // {/* Change: Cập nhật màu icon search */}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#2F855A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3 ml-4">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Divider */}
          <div className="w-px h-6 bg-[#B7E4C7]"></div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              // {/* Change: Cập nhật màu hover */}
              className="flex items-center space-x-3 hover:bg-[#cbf0d3] rounded-xl px-3 py-2 transition-all"
            >
              <div 
                // {/* Change: Cập nhật màu nền avatar */}
                className="w-8 h-8 rounded-full bg-[#2F855A] flex items-center justify-center text-white font-semibold shadow-sm">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800">{user?.username || 'Admin'}</p>
                <p 
                  // {/* Change: Cập nhật màu text vai trò */}
                  className="text-xs text-[#2F855A] font-medium">
                  {user?.roles?.includes('super-admin')
                    ? 'Super Admin'
                    : user?.roles?.includes('staff')
                    ? 'Staff'
                    : 'Admin'}
                </p>
              </div>
            </button>

            {showUserMenu && (
              // {/* Change: Cập nhật nền và viền cho dropdown */}
              <div className="absolute right-0 mt-2 w-56 bg-[#F8FFF9] rounded-xl shadow-lg border border-[#B7E4C7] overflow-hidden">
                <div className="p-4 bg-[#D9FFDF] text-[#2F855A] border-b border-[#B7E4C7]">
                  <p className="font-semibold">{user?.username || 'Admin'}</p>
                  <p className="text-sm opacity-90">{user?.email || 'admin@SaveFood.com'}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => navigate('/profile')}
                    // {/* Change: Cập nhật màu hover */}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D9FFDF] transition-all"
                  >
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => navigate('/settings/profile')}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D9FFDF] transition-all"
                  >
                    Cài đặt
                  </button>
                  <button
                    onClick={() => navigate('/change-password')}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#D9FFDF] transition-all"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
                <div className="border-t border-[#B7E4C7]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-all font-medium"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;