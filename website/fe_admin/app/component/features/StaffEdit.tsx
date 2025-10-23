import React from 'react';
import * as Icons from 'lucide-react';
import type { AdminResponse } from '~/service/adminService';

interface StaffEditProps {
  show: boolean;
  admin: AdminResponse | null;
  editForm: {
    role: string;
    status: string;
  };
  updating: boolean;
  onClose: () => void;
  onFormChange: (field: 'role' | 'status', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  getRoleLabel: (role: string) => string;
  getStatusLabel: (status: string) => string;
}

export default function StaffEdit({
  show,
  admin,
  editForm,
  updating,
  onClose,
  onFormChange,
  onSubmit,
  getRoleLabel,
  getStatusLabel,
}: StaffEditProps) {
  if (!show || !admin) return null;

  const hasChanges = editForm.role !== admin.role || editForm.status !== admin.status;

  return (
    <div
      className="fixed inset-0 backdrop-brightness-90 flex items-center justify-center z-50 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icons.Edit className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Chỉnh sửa Admin</h2>
                <p className="text-white text-opacity-90 text-sm mt-1">
                  Cập nhật thông tin chức vụ và trạng thái
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

        {/* Admin Info Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {admin.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt={admin.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#A4C3A2]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] flex items-center justify-center text-white text-2xl font-bold">
                {admin.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{admin.fullName}</h3>
              <p className="text-sm text-gray-600">{admin.email}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chức vụ
            </label>
            <select
              value={editForm.role}
              onChange={(e) => onFormChange('role', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
            >
              <option value="ROLE_STAFF">Nhân viên</option>
              <option value="ROLE_MODERATOR">Quản lý</option>
              <option value="ROLE_SUPER_ADMIN">Super Admin</option>
            </select>
            {editForm.role !== admin.role && (
              <p className="mt-2 text-sm text-orange-600 flex items-center space-x-1">
                <Icons.AlertCircle className="w-4 h-4" />
                <span>Thay đổi từ: {getRoleLabel(admin.role)}</span>
              </p>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={editForm.status}
              onChange={(e) => onFormChange('status', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#A4C3A2] focus:ring-2 focus:ring-[#A4C3A2] focus:ring-opacity-20 transition-all"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
            </select>
            {editForm.status !== admin.status && (
              <p className="mt-2 text-sm text-orange-600 flex items-center space-x-1">
                <Icons.AlertCircle className="w-4 h-4" />
                <span>Thay đổi từ: {getStatusLabel(admin.status)}</span>
              </p>
            )}
          </div>

          {/* Warning Note */}
          {hasChanges && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <Icons.AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Lưu ý</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Thay đổi chức vụ hoặc trạng thái sẽ ảnh hưởng đến quyền hạn và khả năng truy
                    cập của admin này.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={updating || !hasChanges}
              className="px-6 py-3 bg-[#A4C3A2] text-gray-900 rounded-lg hover:bg-[#8FB491] transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {updating ? (
                <>
                  <Icons.Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Icons.Save className="w-5 h-5" />
                  <span>Cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
