import React from 'react';
import * as Icons from 'lucide-react';
import type { AdminRegisterRequest } from '~/service/adminService';

interface StaffRegisterProps {
  show: boolean;
  onClose: () => void;
  registerForm: AdminRegisterRequest;
  registering: boolean;
  uploadingAvatar: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function StaffRegister({
  show,
  onClose,
  registerForm,
  registering,
  uploadingAvatar,
  onInputChange,
  onAvatarUpload,
  onSubmit,
}: StaffRegisterProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 backdrop-brightness-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icons.UserPlus className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Đăng ký Admin/Staff</h2>
                <p className="text-white text-opacity-90 text-sm mt-1">
                  Tạo tài khoản mới cho nhân viên
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              disabled={registering}
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {registerForm.avatarUrl ? (
                <img
                  src={registerForm.avatarUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#A4C3A2]"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] flex items-center justify-center">
                  <Icons.User className="w-16 h-16 text-white" />
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-[#2F855A] text-white p-2 rounded-full cursor-pointer hover:bg-[#246B47] transition-colors shadow-lg"
              >
                {uploadingAvatar ? (
                  <Icons.Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icons.Camera className="w-5 h-5" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={onAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar || registering}
              />
            </div>
            <p className="text-sm text-gray-500">
              Click vào biểu tượng camera để tải ảnh đại diện
            </p>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={registerForm.username}
                onChange={onInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={onInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
                placeholder="example@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={onInputChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={registerForm.fullName}
                onChange={onInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
                placeholder="Nhập họ và tên đầy đủ"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={registerForm.phoneNumber}
                onChange={onInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
                placeholder="0123456789"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chức vụ <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={registerForm.role}
                onChange={onInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
              >
                <option value="ROLE_STAFF">Staff</option>
                <option value="ROLE_MODERATOR">Moderator</option>
                <option value="ROLE_SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={registering}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={registering || uploadingAvatar}
              className="px-6 py-3 bg-[#A4C3A2] text-gray-900 rounded-lg hover:bg-[#8FB491] transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {registering ? (
                <>
                  <Icons.Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Icons.UserPlus className="w-5 h-5" />
                  <span>Đăng ký</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
