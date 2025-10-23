import React, { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import adminService from '~/service/adminService';
import type { AdminResponse, AdminRegisterRequest } from '~/service/adminService';
import type { PageResponse } from '~/service/types';
import fileStorageService from '~/service/fileStorageService';
import * as Icons from 'lucide-react';
import Toast from '~/component/common/Toast';
import StaffRegister from '~/component/features/StaffRegister';
import StaffDetail from '~/component/features/StaffDetail';
import StaffEdit from '~/component/features/StaffEdit';
import '~/assets/css/adminmanagement.css';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });

  // Registration form state
  const [registerForm, setRegisterForm] = useState<AdminRegisterRequest>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'ROLE_STAFF',
    avatarUrl: undefined,
  });
  const [registering, setRegistering] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    role: string;
    status: string;
  }>({
    role: 'ROLE_STAFF',
    status: 'ACTIVE',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, [currentPage, roleFilter, statusFilter]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response: PageResponse<AdminResponse> = await adminService.getAllAdmins(
        currentPage,
        pageSize,
        roleFilter,
        statusFilter
      );
      setAdmins(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('Failed to load admins:', error);
      showToast(error.message || 'Không thể tải danh sách admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: ToastState['type']) => {
    setToast({ show: true, message, type });
  };

  const handleRegisterInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegisterForm((prev: AdminRegisterRequest) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh không được vượt quá 5MB', 'error');
      return;
    }

    try {
      setUploadingAvatar(true);
      const avatarUrl = await fileStorageService.uploadAdminAvatar(file);
      setRegisterForm((prev) => ({ ...prev, avatarUrl }));
      showToast('Tải ảnh đại diện thành công', 'success');
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      showToast(error.message || 'Tải ảnh thất bại', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);

    try {
      await adminService.registerAdmin(registerForm);
      showToast('Đăng ký admin/staff thành công', 'success');
      setShowRegisterModal(false);
      // Reset form
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: 'ROLE_STAFF',
        avatarUrl: undefined,
      });
      // Reload admins list
      loadAdmins();
    } catch (error: any) {
      console.error('Registration failed:', error);
      showToast(error.message || 'Đăng ký thất bại', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const handleStatusChange = async (
    admin: AdminResponse,
    action: 'activate' | 'suspend' | 'approve'
  ) => {
    try {
      let result;
      switch (action) {
        case 'activate':
          result = await adminService.activateAdmin(admin.userId);
          showToast(`Đã kích hoạt tài khoản ${admin.username}`, 'success');
          break;
        case 'suspend':
          const reason = prompt('Nhập lý do tạm khóa (tùy chọn):');
          result = await adminService.suspendAdmin(admin.userId, reason || undefined);
          showToast(`Đã tạm khóa tài khoản ${admin.username}`, 'success');
          break;
        case 'approve':
          result = await adminService.approveAdmin(admin.userId);
          showToast(`Đã phê duyệt tài khoản ${admin.username}`, 'success');
          break;
      }
      // Update local state
      setAdmins((prev: AdminResponse[]) =>
        prev.map((a) => (a.userId === admin.userId ? result : a))
      );
      if (selectedAdmin?.userId === admin.userId) {
        setSelectedAdmin(result);
      }
    } catch (error: any) {
      console.error(`Failed to ${action} admin:`, error);
      showToast(error.message || `Không thể ${action} admin`, 'error');
    }
  };

  const handleEditAdmin = (admin: AdminResponse) => {
    setSelectedAdmin(admin);
    setEditForm({
      role: admin.role,
      status: admin.status,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setUpdating(true);
    try {
      let updated = selectedAdmin;

      // Update role if changed
      if (editForm.role !== selectedAdmin.role) {
        updated = await adminService.updateAdminRole(selectedAdmin.userId, editForm.role);
        showToast(`Đã cập nhật chức vụ thành ${getRoleLabel(editForm.role)}`, 'success');
      }

      // Update status if changed
      if (editForm.status !== selectedAdmin.status) {
        updated = await adminService.updateAdminStatus(selectedAdmin.userId, editForm.status);
        showToast(`Đã cập nhật trạng thái thành ${getStatusLabel(editForm.status)}`, 'success');
      }

      // Update local state
      setAdmins((prev) =>
        prev.map((a) => (a.userId === selectedAdmin.userId ? updated : a))
      );
      setSelectedAdmin(updated);
      setShowEditModal(false);
      
      if (editForm.role !== selectedAdmin.role || editForm.status !== selectedAdmin.status) {
        showToast('Cập nhật thành công!', 'success');
      } else {
        showToast('Không có thay đổi nào', 'info');
      }
    } catch (error: any) {
      console.error('Failed to update admin:', error);
      showToast(error.message || 'Cập nhật thất bại', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'ROLE_SUPER_ADMIN': 'Super Admin',
      'ROLE_MODERATOR': 'Moderator',
      'ROLE_STAFF': 'Staff',
    };
    return labels[role] || role;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Không hoạt động',
      'PENDING_APPROVAL': 'Chờ duyệt',
      'SUSPENDED': 'Tạm khóa',
    };
    return labels[status] || status;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; color: string }> = {
      'ROLE_SUPER_ADMIN': { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-300' },
      'ROLE_MODERATOR': { label: 'Moderator', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      'ROLE_STAFF': { label: 'Staff', color: 'bg-[#E8FFED] text-[#2F855A] border-[#A4C3A2]' },
    };
    const config = roleConfig[role] || { label: role, color: 'bg-gray-100 text-gray-700 border-gray-300' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      'ACTIVE': { label: 'Hoạt động', color: 'bg-[#E8FFED] text-[#2F855A] border-[#A4C3A2]', icon: Icons.CheckCircle },
      'INACTIVE': { label: 'Không hoạt động', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Icons.XCircle },
      'PENDING_APPROVAL': { label: 'Chờ duyệt', color: 'bg-orange-50 text-[#FF6B35] border-orange-200', icon: Icons.Clock },
      'SUSPENDED': { label: 'Tạm khóa', color: 'bg-red-50 text-[#E63946] border-red-200', icon: Icons.Ban },
    };
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Icons.HelpCircle };
    const StatusIcon = config.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <StatusIcon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <DashboardLayout>
      <div className="py-2">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] rounded-2xl flex items-center justify-center shadow-lg">
                <Icons.Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="heading-primary">Quản lý Admin & Nhân viên</h1>
                <p className="text-sm text-muted mt-1">
                  Quản lý tài khoản admin và phân quyền hệ thống
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="btn-primary flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Icons.UserPlus className="w-5 h-5" />
              <span>Thêm Admin/Staff</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2] bg-surface-light"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2] bg-surface-light"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ROLE_SUPER_ADMIN">Super Admin</option>
              <option value="ROLE_MODERATOR">Moderator</option>
              <option value="ROLE_STAFF">Staff</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2] bg-surface-light"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="PENDING_APPROVAL">Chờ duyệt</option>
              <option value="SUSPENDED">Tạm khóa</option>
            </select>
          </div>
        </div>

        {/* Admin List */}
        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <Icons.Loader2 className="w-8 h-8 animate-spin text-[#A4C3A2]" />
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="card text-center py-20">
            <Icons.Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {admins.length === 0
                ? 'Chưa có admin/staff nào trong hệ thống'
                : 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FFF9] border-b border-[#B7E4C7]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.userId} className="hover:bg-[#F8FFF9] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] flex items-center justify-center text-white font-bold">
                            {admin.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{admin.fullName}</p>
                            <p className="text-sm text-gray-500">@{admin.username}</p>
                            <p className="text-xs text-gray-400">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(admin.role)}</td>
                      <td className="px-6 py-4">{getStatusBadge(admin.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(admin.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-[#2F855A] hover:bg-[#E8FFED] rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Icons.Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Icons.Edit className="w-5 h-5" />
                          </button>
                          {admin.status === 'INACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(admin, 'activate')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Kích hoạt"
                            >
                              <Icons.CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {admin.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(admin, 'suspend')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Tạm khóa"
                            >
                              <Icons.Ban className="w-5 h-5" />
                            </button>
                          )}
                          {admin.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => handleStatusChange(admin, 'approve')}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Phê duyệt"
                            >
                              <Icons.CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold">{filteredAdmins.length}</span> trong tổng số{' '}
                  <span className="font-semibold">{totalElements}</span> admin/staff
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Trang trước"
                  >
                    <Icons.ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 0 ||
                        pageNum === totalPages - 1 ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              pageNum === currentPage
                                ? 'bg-[#2F855A] text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Trang sau"
                  >
                    <Icons.ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Register Modal */}
        <StaffRegister
          show={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          registerForm={registerForm}
          registering={registering}
          uploadingAvatar={uploadingAvatar}
          onInputChange={handleRegisterInputChange}
          onAvatarUpload={handleAvatarUpload}
          onSubmit={handleRegisterSubmit}
        />

        {/* Detail Modal */}
        <StaffDetail
          show={showDetailModal}
          admin={selectedAdmin}
          onClose={() => setShowDetailModal(false)}
          onStatusChange={handleStatusChange}
          getRoleBadge={getRoleBadge}
          getStatusBadge={getStatusBadge}
        />

        {/* Edit Modal */}
        <StaffEdit
          show={showEditModal}
          admin={selectedAdmin}
          editForm={editForm}
          updating={updating}
          onClose={() => setShowEditModal(false)}
          onFormChange={(field, value) => 
            setEditForm((prev) => ({ ...prev, [field]: value }))
          }
          onSubmit={handleEditSubmit}
          getRoleLabel={getRoleLabel}
          getStatusLabel={getStatusLabel}
        />

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />
        )}
      </div>
    </DashboardLayout>
  );
}