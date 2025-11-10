import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import profileService from '../../service/profileService';
import * as Icons from 'lucide-react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import AvatarUpload from '~/component/common/AvatarUpload';

interface ProfileFormData {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  gender?: string;
  role: string;
  status: string;
  avatarUrl?: string;
}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    gender: undefined,
    role: '',
    status: '',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || undefined,
        role: user.roles?.[0] || '',
        status: user.status || '',
        avatarUrl: user.avatarUrl || undefined,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      avatarUrl: url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Call API to update profile
      await profileService.updateProfile({
        fullName: formData.fullName || undefined,
        email: formData.email || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        gender: formData.gender || undefined,
        avatarUrl: formData.avatarUrl || undefined,
      });

      // Refresh user data
      await refreshUser();

      setIsEditing(false);
      // Show success notification
      alert('Cập nhật thông tin thành công!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.message || 'Cập nhật thông tin thất bại!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || undefined,
        role: user.roles?.[0] || '',
        status: user.status || '',
        avatarUrl: user.avatarUrl || undefined,
      });
    }
    setIsEditing(false);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'super-admin': 'Super Admin',
      'staff': 'Nhân viên',
      'admin': 'Quản trị viên',
    };
    return roleMap[role] || role;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      'ACTIVE': { label: 'Hoạt động', color: 'badge-success' },
      'INACTIVE': { label: 'Không hoạt động', color: 'badge-neutral' },
      'PENDING_APPROVAL': { label: 'Chờ duyệt', color: 'badge-warning' },
      'SUSPENDED': { label: 'Tạm khóa', color: 'badge-error' },
      'BANNED': { label: 'Bị cấm', color: 'badge-error' },
    };
    const config = statusConfig[status] || { label: status, color: 'badge-neutral' };
    return (
      <span className={config.color}>
        {config.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="py-2">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] rounded-2xl flex items-center justify-center shadow-lg">
              <Icons.User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="heading-primary">Thông tin cá nhân</h1>
              <p className="text-sm text-muted mt-1">
                Quản lý thông tin và cài đặt tài khoản của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card overflow-hidden shadow-md">
          {/* Cover & Avatar Section */}
          <div className="relative">
            {/* Cover Photo - Gradient mới đẹp hơn */}
            <div className="h-40 bg-gradient-to-r from-[#D9FFDF] via-[#A4C3A2] to-[#2F855A] relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5"></div>
            </div>
            
            {/* Avatar */}
            <div className="absolute -bottom-12 left-8">
              <AvatarUpload
                currentAvatarUrl={formData.avatarUrl}
                onAvatarChange={handleAvatarChange}
                userName={user?.username}
                size="large"
                editable={true}
              />
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <div className="absolute top-6 right-6">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-[#FFFEFA] text-[#2F855A] rounded-xl hover:bg-white hover:shadow-lg transition-all shadow-md border border-[#B7E4C7] font-medium"
                >
                  <Icons.Edit2 className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-8 pt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <Icons.User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    disabled={true} // Username không thể thay đổi
                    className="w-full pl-10 pr-4 py-3 border border-[#B7E4C7] rounded-xl bg-[#F5EDE6] text-[#6B6B6B] cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-xs text-light mt-1.5 flex items-center">
                  <Icons.Lock className="w-3 h-3 mr-1" />
                  Tên đăng nhập không thể thay đổi
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Icons.Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                      isEditing
                        ? 'input-field'
                        : 'border-[#B7E4C7] bg-[#F5EDE6] cursor-not-allowed text-[#6B6B6B]'
                    }`}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <Icons.IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                      isEditing
                        ? 'input-field'
                        : 'border-[#B7E4C7] bg-[#F5EDE6] cursor-not-allowed text-[#6B6B6B]'
                    }`}
                    placeholder="Nhập họ và tên"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Icons.Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                      isEditing
                        ? 'input-field'
                        : 'border-[#B7E4C7] bg-[#F5EDE6] cursor-not-allowed text-[#6B6B6B]'
                    }`}
                    placeholder="0123456789"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                  Giới tính
                </label>
                <div className="relative">
                  <Icons.Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                      isEditing
                        ? 'input-field'
                        : 'border-[#B7E4C7] bg-[#F5EDE6] cursor-not-allowed text-[#6B6B6B]'
                    }`}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                  Vai trò
                </label>
                <div className="relative">
                  <Icons.Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                  <input
                    type="text"
                    value={getRoleDisplay(formData.role)}
                    disabled={true}
                    className="w-full pl-10 pr-4 py-3 border border-[#B7E4C7] rounded-xl bg-[#F5EDE6] text-[#6B6B6B] cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                  Trạng thái tài khoản
                </label>
                <div className="flex items-center h-[48px]">
                  {getStatusBadge(formData.status)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-8 pt-8 border-t border-[#B7E4C7] flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-8 py-3 border-2 border-[#B7E4C7] text-[#2F855A] rounded-xl hover:bg-[#F8FFF9] hover:border-[#A4C3A2] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary px-8 py-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Icons.Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Save className="w-5 h-5" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <button className="group flex items-center space-x-4 p-5 bg-[#FFFEFA] rounded-xl border-2 border-[#B7E4C7] hover:border-[#A4C3A2] hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#E8FFED] group-hover:bg-[#A4C3A2] rounded-xl flex items-center justify-center transition-colors">
              <Icons.Lock className="w-6 h-6 text-[#2F855A] group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#2D2D2D] group-hover:text-[#2F855A] transition-colors">
                Đổi mật khẩu
              </p>
              <p className="text-xs text-light">Cập nhật mật khẩu</p>
            </div>
          </button>
          <button className="group flex items-center space-x-4 p-5 bg-[#FFFEFA] rounded-xl border-2 border-[#B7E4C7] hover:border-[#A4C3A2] hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#E8FFED] group-hover:bg-[#A4C3A2] rounded-xl flex items-center justify-center transition-colors">
              <Icons.Bell className="w-6 h-6 text-[#2F855A] group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#2D2D2D] group-hover:text-[#2F855A] transition-colors">
                Thông báo
              </p>
              <p className="text-xs text-light">Cấu hình thông báo</p>
            </div>
          </button>
          <button className="group flex items-center space-x-4 p-5 bg-[#FFFEFA] rounded-xl border-2 border-[#B7E4C7] hover:border-[#A4C3A2] hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-[#E8FFED] group-hover:bg-[#A4C3A2] rounded-xl flex items-center justify-center transition-colors">
              <Icons.Shield className="w-6 h-6 text-[#2F855A] group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#2D2D2D] group-hover:text-[#2F855A] transition-colors">
                Bảo mật
              </p>
              <p className="text-xs text-light">Cài đặt bảo mật</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
