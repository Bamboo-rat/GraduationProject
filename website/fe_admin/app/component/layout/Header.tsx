import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, title: 'Đối tác mới đăng ký', message: 'Cửa hàng "Bakery ABC" yêu cầu phê duyệt', time: '5 phút trước', unread: true },
    { id: 2, title: 'Đơn hàng mới', message: '3 đơn hàng mới cần xử lý', time: '15 phút trước', unread: true },
    { id: 3, title: 'Khiếu nại từ khách hàng', message: 'Khách hàng #1234 gửi khiếu nại', time: '1 giờ trước', unread: false },
  ];

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

  const unreadCount = notifications.filter(n => n.unread).length;

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
           {/* Notifications - Hover to show */}
          <div className="relative group">
            <div className="p-2 rounded-lg hover:bg-[#cbf0d3] transition-colors relative cursor-pointer">
              <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF6B35] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Dropdown hiển thị khi hover - Nền trắng, viền xanh chủ đạo */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#B7E4C7] overflow-hidden">
                {/* Tinh chỉnh: Header của dropdown cũng có nền trắng, viền dưới xám nhạt */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Thông báo</h3>
                  {unreadCount > 0 && 
                    <p className="text-sm text-gray-500">{unreadCount} thông báo chưa đọc</p>
                  }
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n, index) => (
                    <div
                      key={n.id}
                      // {/* Tinh chỉnh: Hover nhẹ nhàng sang màu #F8FFF9. Bỏ viền cho item cuối cùng. */}
                      className={`block p-4 hover:bg-[#F8FFF9] transition-colors ${index < notifications.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      {/* Tinh chỉnh: Dùng flexbox để căn chỉnh chấm tròn và nội dung */}
                      <div className="flex items-start space-x-3">
                        {/* Tinh chỉnh: Chấm tròn màu xanh đậm để báo unread */}
                        {n.unread && <span className="mt-1.5 w-2 h-2 bg-[#2F855A] rounded-full flex-shrink-0"></span>}
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-800">{n.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                          <p className="text-xs text-[#2F855A] mt-2 font-medium">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Tinh chỉnh: Footer nền xám cực nhạt để tách biệt */}
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button className="text-sm text-[#2F855A] hover:underline font-medium transition-colors">
                    Xem tất cả thông báo
                  </button>
                </div>
            </div>
          </div>

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