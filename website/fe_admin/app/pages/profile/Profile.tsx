import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import profileService from '../../service/profileService';
import * as Icons from 'lucide-react';

interface ProfileFormData {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  status: string;
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
        role: user.roles?.[0] || '',
        status: user.status || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
        role: user.roles?.[0] || '',
        status: user.status || '',
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
      'ACTIVE': { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
      'INACTIVE': { label: 'Không hoạt động', color: 'bg-gray-100 text-gray-800' },
      'PENDING_APPROVAL': { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
      'SUSPENDED': { label: 'Tạm khóa', color: 'bg-red-100 text-red-800' },
      'BANNED': { label: 'Bị cấm', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Icons.User className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
              <p className="text-sm text-gray-600 mt-1">
                Quản lý thông tin và cài đặt tài khoản của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover & Avatar Section */}
          <div className="relative">
            {/* Cover Photo */}
            <div className="h-32 bg-gradient-to-r from-green-400 to-green-600"></div>
            
            {/* Avatar */}
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-300 to-green-400 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <Icons.User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    disabled={true} // Username không thể thay đổi
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tên đăng nhập không thể thay đổi</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Icons.Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors ${
                      isEditing
                        ? 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <Icons.IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors ${
                      isEditing
                        ? 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    placeholder="Nhập họ và tên"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Icons.Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors ${
                      isEditing
                        ? 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    placeholder="0123456789"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò
                </label>
                <div className="relative">
                  <Icons.Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={getRoleDisplay(formData.role)}
                    disabled={true}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái tài khoản
                </label>
                <div className="flex items-center h-[42px]">
                  {getStatusBadge(formData.status)}
                </div>
              </div>
            </div>

            {/* Account Info Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <Icons.Info className="w-4 h-4 mr-2" />
                Thông tin tài khoản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Icons.Calendar className="w-4 h-4" />
                  <span>Ngày tạo: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Icons.Clock className="w-4 h-4" />
                  <span>Cập nhật: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Icons.Key className="w-4 h-4" />
                  <span>ID: {user?.userId || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Icons.Database className="w-4 h-4" />
                  <span>Keycloak ID: {user?.keycloakId?.substring(0, 8) || 'N/A'}...</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all">
            <Icons.Lock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Đổi mật khẩu</span>
          </button>
          <button className="flex items-center justify-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all">
            <Icons.Bell className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Cài đặt thông báo</span>
          </button>
          <button className="flex items-center justify-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all">
            <Icons.Shield className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Bảo mật tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
