import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, title: 'Đơn hàng mới', message: 'Bạn có 2 đơn hàng mới cần xử lý', time: '5 phút trước', unread: true },
    { id: 2, title: 'Sản phẩm được duyệt', message: 'Sản phẩm "Bánh mì tươi" đã được phê duyệt', time: '15 phút trước', unread: true },
    { id: 3, title: 'Đánh giá mới', message: 'Khách hàng vừa đánh giá 5 sao', time: '1 giờ trước', unread: false },
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
    <header className="bg-white border-b border-[#B7E4C7] h-16 fixed top-0 right-0 left-64 z-10 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, đơn hàng..."
              className="w-full pl-10 pr-4 py-2.5 border border-[#B7E4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2] focus:border-[#2F855A] bg-[#F8FFF9] text-[#2D2D2D] placeholder-[#8B8B8B] transition-all"
            />
            <svg
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
            <div className="p-2 rounded-xl hover:bg-[#F8FFF9] transition-colors relative cursor-pointer">
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

            {/* Dropdown hiển thị khi hover */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#B7E4C7] overflow-hidden">
              <div className="p-4 bg-[#F8FFF9] border-b border-[#B7E4C7]">
                <h3 className="font-semibold text-[#2D2D2D]">Thông báo</h3>
                {unreadCount > 0 &&
                  <p className="text-sm text-[#6B6B6B] mt-0.5">{unreadCount} thông báo chưa đọc</p>
                }
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((n, index) => (
                  <div
                    key={n.id}
                    className={`block p-4 hover:bg-[#F8FFF9] transition-colors cursor-pointer ${index < notifications.length - 1 ? 'border-b border-[#E8FFED]' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      {n.unread && <span className="mt-1.5 w-2 h-2 bg-[#2F855A] rounded-full flex-shrink-0"></span>}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-[#2D2D2D]">{n.title}</p>
                        <p className="text-sm text-[#6B6B6B] mt-1">{n.message}</p>
                        <p className="text-xs text-[#2F855A] mt-2 font-medium">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-[#F8FFF9] text-center border-t border-[#B7E4C7]">
                <button className="text-sm text-[#2F855A] hover:text-[#8FB491] font-medium transition-colors">
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
              className="flex items-center space-x-3 hover:bg-[#F8FFF9] rounded-xl px-3 py-2 transition-all"
            >
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] flex items-center justify-center text-white font-semibold shadow-sm ring-2 ring-[#E8FFED]">
                {user?.username?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-[#2D2D2D]">{user?.username || 'Supplier'}</p>
                <p className="text-xs text-[#2F855A] font-medium">Nhà cung cấp</p>
              </div>
              <svg className="w-4 h-4 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#B7E4C7] overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-[#E8FFED] to-[#D9FFDF] border-b border-[#B7E4C7]">
                  <p className="font-semibold text-[#2F855A]">{user?.username || 'Supplier'}</p>
                  <p className="text-sm text-[#6B6B6B] mt-0.5">{user?.email || 'supplier@SaveFood.com'}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => navigate('/store/profile')}
                    className="w-full flex items-center px-4 py-3 text-sm text-[#2D2D2D] hover:bg-[#F8FFF9] transition-all"
                  >
                    <svg className="w-4 h-4 mr-3 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Thông tin cửa hàng
                  </button>
                  <button
                    onClick={() => navigate('/settings/notifications')}
                    className="w-full flex items-center px-4 py-3 text-sm text-[#2D2D2D] hover:bg-[#F8FFF9] transition-all"
                  >
                    <svg className="w-4 h-4 mr-3 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Cài đặt
                  </button>
                </div>
                <div className="border-t border-[#B7E4C7]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm text-[#E63946] hover:bg-red-50 transition-all font-medium"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
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
