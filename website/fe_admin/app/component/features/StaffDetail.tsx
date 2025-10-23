import React from 'react';
import * as Icons from 'lucide-react';
import type { AdminResponse } from '~/service/adminService';

interface StaffDetailProps {
  show: boolean;
  admin: AdminResponse | null;
  onClose: () => void;
  onStatusChange: (admin: AdminResponse, action: 'activate' | 'suspend' | 'approve') => void;
  getRoleBadge: (role: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function StaffDetail({
  show,
  admin,
  onClose,
  onStatusChange,
  getRoleBadge,
  getStatusBadge,
}: StaffDetailProps) {
  if (!show || !admin) return null;

  return (
    <div className="fixed inset-0 backdrop-brightness-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icons.UserCircle className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Chi tiết Admin</h2>
                <p className="text-white text-opacity-90 text-sm mt-1">
                  Thông tin chi tiết về tài khoản
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <Icons.X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start space-x-6 mb-6 pb-6 border-b border-gray-200">
            {admin.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt={admin.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#A4C3A2] shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {admin.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{admin.fullName}</h3>
              <p className="text-gray-600 mb-3">@{admin.username}</p>
              <div className="flex items-center space-x-3">
                {getRoleBadge(admin.role)}
                {getStatusBadge(admin.status)}
              </div>
            </div>
          </div>

          {/* Detailed Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Email */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-[#A4C3A2] bg-opacity-20 p-2 rounded-lg">
                  <Icons.Mail className="w-5 h-5 text-[#2F855A]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900">{admin.email}</p>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Icons.Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    Số điện thoại
                  </p>
                  <p className="text-sm font-medium text-gray-900">{admin.phoneNumber}</p>
                </div>
              </div>
            </div>

            {/* Created At */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Icons.Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    Ngày tạo
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(admin.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Updated At */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Icons.Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    Cập nhật lần cuối
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(admin.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <Icons.Database className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Thông tin hệ thống</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                  User ID
                </p>
                <p className="text-sm font-mono text-gray-700 bg-white px-2 py-1 rounded">
                  {admin.userId}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                  Keycloak ID
                </p>
                <p className="text-sm font-mono text-gray-700 bg-white px-2 py-1 rounded break-all">
                  {admin.keycloakId}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            {admin.status === 'INACTIVE' && (
              <button
                onClick={() => {
                  onStatusChange(admin, 'activate');
                  onClose();
                }}
                className="px-6 py-3 bg-[#A4C3A2] text-gray-900 rounded-lg hover:bg-[#8FB491] transition-all flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Icons.CheckCircle className="w-5 h-5" />
                <span>Kích hoạt</span>
              </button>
            )}
            {admin.status === 'ACTIVE' && (
              <button
                onClick={() => {
                  onStatusChange(admin, 'suspend');
                  onClose();
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Icons.Ban className="w-5 h-5" />
                <span>Tạm khóa</span>
              </button>
            )}
            {admin.status === 'PENDING_APPROVAL' && (
              <button
                onClick={() => {
                  onStatusChange(admin, 'approve');
                  onClose();
                }}
                className="px-6 py-3 bg-[#A4C3A2] text-gray-900 rounded-lg hover:bg-[#8FB491] transition-all flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Icons.CheckCircle className="w-5 h-5" />
                <span>Phê duyệt</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
