import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import Toast from '~/component/common/Toast';
import type { ToastType } from '~/component/common/Toast';
import ConfirmModal from '~/component/common/ConfirmModal';
import SupplierPendingDetail from '~/component/features/SupplierPendingDetail';
import supplierService from '~/service/supplierService';
import type { Supplier } from '~/service/supplierService';

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  show: boolean;
  type: 'approve' | 'reject' | null;
  supplier: Supplier | null;
}

export default function PartnersPending() {
  const [pendingSuppliers, setPendingSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
  
  // Confirm modal state
  const [confirm, setConfirm] = useState<ConfirmState>({ show: false, type: null, supplier: null });
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supplierService.getPendingSuppliers(page, 20);
      setPendingSuppliers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhà cung cấp');
      console.error('Error fetching pending suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSuppliers();
  }, [page]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  const handleApproveClick = (supplier: Supplier) => {
    setConfirm({ show: true, type: 'approve', supplier });
  };

  const handleRejectClick = (supplier: Supplier) => {
    setRejectReason('');
    setConfirm({ show: true, type: 'reject', supplier });
  };

  const handleConfirmAction = async () => {
    if (!confirm.supplier) return;

    if (confirm.type === 'approve') {
      setActionLoading(confirm.supplier.userId);
      setConfirm({ show: false, type: null, supplier: null });
      
      try {
        await supplierService.approveSupplier(confirm.supplier.userId);
        showToast(`Đã duyệt thành công đối tác "${confirm.supplier.businessName}". Email thông báo đã được gửi.`, 'success');
        fetchPendingSuppliers();
      } catch (err: any) {
        showToast(`Lỗi: ${err.message}`, 'error');
      } finally {
        setActionLoading(null);
      }
    } else if (confirm.type === 'reject') {
      if (!rejectReason.trim()) {
        showToast('Vui lòng nhập lý do từ chối', 'warning');
        return;
      }

      setActionLoading(confirm.supplier.userId);
      setConfirm({ show: false, type: null, supplier: null });
      
      try {
        await supplierService.rejectSupplier(confirm.supplier.userId, rejectReason);
        showToast(`Đã từ chối đối tác "${confirm.supplier.businessName}". Email thông báo đã được gửi.`, 'success');
        fetchPendingSuppliers();
        setRejectReason('');
      } catch (err: any) {
        showToast(`Lỗi: ${err.message}`, 'error');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleCancelAction = () => {
    setConfirm({ show: false, type: null, supplier: null });
    setRejectReason('');
  };

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchPendingSuppliers}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Thử lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-br from-[#F8FFF9] to-white rounded-2xl p-6 border-2 border-[#B7E4C7] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <span className="bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md">
                  {totalElements}
                </span>
                Yêu cầu đối tác cần duyệt
              </h1>
              <p className="text-gray-600">
                Xem xét và phê duyệt các yêu cầu đăng ký làm đối tác kinh doanh
              </p>
            </div>
            <button
              onClick={fetchPendingSuppliers}
              disabled={loading}
              className="px-5 py-3 bg-white border-2 border-[#B7E4C7] text-[#2F855A] rounded-xl hover:border-[#A4C3A2] hover:bg-[#F8FFF9] transition-all flex items-center gap-2 font-semibold shadow-sm hover:shadow disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {pendingSuppliers.length === 0 ? (
          <div className="bg-gradient-to-br from-[#F8FFF9] to-white rounded-2xl shadow-lg p-16 text-center border-2 border-[#B7E4C7]">
            <div className="bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">Hiện tại không có yêu cầu nào cần duyệt</p>
            <p className="text-gray-500 mt-2">Tất cả nhà cung cấp đã được xử lý</p>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-6">
              {pendingSuppliers.map((supplier) => (
                <div
                  key={supplier.userId}
                  className="bg-gradient-to-br from-[#F8FFF9] to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-[#B7E4C7] overflow-hidden group hover:border-[#A4C3A2]"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            className="w-20 h-20 rounded-xl object-cover border-4 border-[#A4C3A2] group-hover:border-[#2F855A] transition-colors shadow-md"
                            src={supplier.avatarUrl || 'https://via.placeholder.com/80'}
                            alt={supplier.businessName}
                          />
                          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                            MỚI
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#2F855A] transition-colors">
                              {supplier.businessName}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <span className="bg-[#E8FFED] text-[#2F855A] px-2 py-0.5 rounded-md font-medium border border-[#B7E4C7]">
                                {supplier.businessType || 'Doanh nghiệp'}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="font-mono text-gray-700">MST: {supplier.taxCode}</span>
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p className="font-medium text-gray-700">
                              {new Date(supplier.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-xs">
                              {new Date(supplier.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Representative */}
                          <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#B7E4C7]">
                            <div className="bg-[#E8FFED] p-2 rounded-lg">
                              <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-medium">Người đại diện</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{supplier.fullName}</p>
                              <p className="text-xs text-gray-500">@{supplier.username}</p>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#B7E4C7]">
                            <div className="bg-[#E8FFED] p-2 rounded-lg">
                              <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-medium">Email</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{supplier.email}</p>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#B7E4C7]">
                            <div className="bg-[#E8FFED] p-2 rounded-lg">
                              <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-medium">Điện thoại</p>
                              <p className="text-sm font-semibold text-gray-900">{supplier.phoneNumber}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-3 border-t-2 border-[#B7E4C7]">
                          <button
                            onClick={() => handleViewDetails(supplier)}
                            className="flex-1 px-4 py-2.5 bg-white text-[#2F855A] rounded-xl hover:bg-[#E8FFED] font-medium transition-colors flex items-center justify-center gap-2 border-2 border-[#B7E4C7] hover:border-[#A4C3A2]"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleApproveClick(supplier)}
                            disabled={actionLoading === supplier.userId}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#246B47] font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === supplier.userId ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Duyệt
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectClick(supplier)}
                            disabled={actionLoading === supplier.userId}
                            className="flex-1 px-4 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2 border-2 border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{page * 20 + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min((page + 1) * 20, totalElements)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{totalElements}</span> kết quả
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Trước</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === i
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page === totalPages - 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Sau</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        <SupplierPendingDetail
          show={showDetailModal}
          supplier={selectedSupplier}
          onClose={() => setShowDetailModal(false)}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
        />

        {/* Toast Notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirm.show}
          title={confirm.type === 'approve' ? 'Xác nhận duyệt đối tác' : 'Xác nhận từ chối đối tác'}
          message={
            confirm.type === 'approve'
              ? `Bạn có chắc muốn duyệt đối tác "${confirm.supplier?.businessName}"? Email thông báo sẽ được gửi tới nhà cung cấp.`
              : `Bạn có chắc muốn từ chối đối tác "${confirm.supplier?.businessName}"? Vui lòng nhập lý do từ chối bên dưới.`
          }
          confirmText={confirm.type === 'approve' ? 'Duyệt ngay' : 'Từ chối'}
          cancelText="Hủy"
          confirmColor={confirm.type === 'approve' ? 'green' : 'red'}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
          showInput={confirm.type === 'reject'}
          inputPlaceholder="Nhập lý do từ chối (bắt buộc)..."
          inputValue={rejectReason}
          onInputChange={setRejectReason}
        />
      </div>
    </DashboardLayout>
  );
}
