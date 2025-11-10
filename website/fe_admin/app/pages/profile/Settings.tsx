import React, { useState } from 'react';
import { 
  Save, 
  Globe, 
  Clock, 
  Settings as SettingsIcon,
  Palette,
  Shield,
  Bell
} from 'lucide-react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import Toast, {type ToastType } from '~/component/common/Toast';

const Settings = () => {
  const [language, setLanguage] = useState('vi');
  const [timezone, setTimezone] = useState('GMT+7');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý lưu cài đặt
    showToast('Cài đặt đã được lưu thành công', 'success');
  };

  const features = [
    {
      icon: <Palette size={20} className="text-[#A4C3A2]" />,
      title: 'Tùy chỉnh giao diện',
      description: 'Thay đổi màu sắc và bố cục'
    },
    {
      icon: <Bell size={20} className="text-[#A4C3A2]" />,
      title: 'Thông báo',
      description: 'Quản lý cài đặt thông báo'
    },
    {
      icon: <Shield size={20} className="text-[#A4C3A2]" />,
      title: 'Bảo mật',
      description: 'Cài đặt bảo mật tài khoản'
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 animate-fade-in">
        {/* Toast Notification */}
        {toast.show && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast}
          />
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="text-[#A4C3A2]" size={32} />
            <h1 className="text-3xl font-bold text-[#2D2D2D]">Cài đặt</h1>
          </div>
          <p className="text-[#6B6B6B] text-lg">Quản lý cài đặt hệ thống và tùy chỉnh tài khoản</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Settings Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
                <SettingsIcon size={20} />
                Cài đặt chung
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Language Setting */}
                  <div>
                    <label htmlFor="language" className="flex items-center gap-2 text-sm font-medium text-[#2D2D2D] mb-3">
                      <Globe size={16} />
                      Ngôn ngữ
                    </label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="vi">🇻🇳 Tiếng Việt</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="ja">🇯🇵 日本語</option>
                      <option value="ko">🇰🇷 한국어</option>
                    </select>
                  </div>

                  {/* Timezone Setting */}
                  <div>
                    <label htmlFor="timezone" className="flex items-center gap-2 text-sm font-medium text-[#2D2D2D] mb-3">
                      <Clock size={16} />
                      Múi giờ
                    </label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="GMT+7">🇻🇳 GMT+7 (Việt Nam)</option>
                      <option value="GMT+8">🇸🇬 GMT+8 (Singapore)</option>
                      <option value="GMT+9">🇯🇵 GMT+9 (Japan)</option>
                      <option value="GMT+0">🇬🇧 GMT+0 (London)</option>
                      <option value="GMT-5">🇺🇸 GMT-5 (New York)</option>
                    </select>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t border-[#DDC6B6]">
                    <button
                      type="submit"
                      className="btn-primary flex items-center gap-2 px-6 py-3"
                    >
                      <Save size={18} />
                      Lưu cài đặt
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Features Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Tính năng khác</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-[#DDC6B6] hover:border-[#A4C3A2] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#E8FFED] rounded-lg group-hover:bg-[#B7E4C7] transition-colors">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-[#2D2D2D] group-hover:text-[#2F855A] transition-colors">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-[#6B6B6B] mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coming Soon */}
              <div className="mt-6 p-4 bg-[#F8FFF9] border border-[#E8FFED] rounded-lg">
                <p className="text-sm text-[#6B6B6B] text-center">
                  Các tính năng mới đang được phát triển
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings Sections */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Notification Settings */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
              <Bell size={20} />
              Thông báo
            </h3>
            <div className="space-y-3 text-sm text-[#6B6B6B]">
              <p>• Thông báo đơn hàng mới</p>
              <p>• Cập nhật sản phẩm</p>
              <p>• Tin tức hệ thống</p>
              <p>• Khuyến mãi đặc biệt</p>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
              <Shield size={20} />
              Bảo mật
            </h3>
            <div className="space-y-3 text-sm text-[#6B6B6B]">
              <p>• Đổi mật khẩu</p>
              <p>• Xác thực 2 bước</p>
              <p>• Quản lý thiết bị</p>
              <p>• Lịch sử đăng nhập</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;