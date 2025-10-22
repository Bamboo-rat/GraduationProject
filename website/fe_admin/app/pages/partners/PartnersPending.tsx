import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/DashboardLayout';
import Toast from '~/component/Toast';
import type { ToastType } from '~/component/Toast';
import ConfirmModal from '~/component/ConfirmModal';
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

  // Detect if a URL is a PDF file - checks both URL path and Cloudinary resource type
  const isPdfFile = (fileUrl: string | null | undefined): boolean => {
    if (!fileUrl) return false;

    const url = fileUrl.toLowerCase();

    // Check file extension
    if (url.endsWith('.pdf')) return true;

    // Check Cloudinary resource type in URL path
    // Cloudinary uses /raw/upload/ for non-image files like PDFs
    if (url.includes('/raw/upload/')) return true;

    // Check if the URL contains 'pdf' in the public_id
    if (url.includes('/pdf') || url.includes('_pdf')) return true;

    return false;
  };

  // Get document file URL - uses the *Url fields from backend which contain full Cloudinary URLs
  const getFileUrl = (fileUrl: string | null | undefined): string | null => {
    if (!fileUrl) return null;

    try {
      // If it's already a valid HTTP URL, return it (optionally with PDF flags)
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // For PDF files from Cloudinary, we can add flags for better handling
        if (isPdfFile(fileUrl) && fileUrl.includes('res.cloudinary.com') && !fileUrl.includes('/fl_')) {
          // Insert flags before the version or file path
          const urlParts = fileUrl.split('/upload/');
          if (urlParts.length === 2) {
            // Use fl_attachment to prompt download with a friendly filename
            return `${urlParts[0]}/upload/fl_attachment:document/${urlParts[1]}`;
          }
        }
        return fileUrl;
      }

      // Fallback: if for some reason it's not a full URL, try to construct one
      const cloudName = 'dk7coitah';
      let publicId = fileUrl.replace(/^cloudinary:\/\//, '');
      const isPdf = publicId.toLowerCase().includes('.pdf') || publicId.toLowerCase().includes('pdf');
      const resourceType = isPdf ? 'raw' : 'image';
      const cleanPublicId = publicId.replace(/\.(jpg|jpeg|png|gif|pdf|webp)$/i, '');

      return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanPublicId}`;

    } catch (error) {
      console.error('Error processing file URL:', error, 'Original URL:', fileUrl);
      return null;
    }
  };

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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  {totalElements}
                </span>
                Yêu cầu đối tác cần duyệt
              </h1>
              <p className="text-gray-600 mt-2">
                Xem xét và phê duyệt các yêu cầu đăng ký làm đối tác kinh doanh
              </p>
            </div>
            <button
              onClick={fetchPendingSuppliers}
              disabled={loading}
              className="px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {pendingSuppliers.length === 0 ? (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-lg p-16 text-center border border-green-100">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tuyệt vời! 🎉</h3>
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
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            className="w-20 h-20 rounded-xl object-cover border-4 border-green-100 group-hover:border-green-200 transition-colors"
                            src={supplier.avatarUrl || 'https://via.placeholder.com/80'}
                            alt={supplier.businessName}
                          />
                          <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                            MỚI
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                              {supplier.businessName}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
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
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-medium">Email</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{supplier.email}</p>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleViewDetails(supplier)}
                            className="flex-1 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-medium transition-colors flex items-center justify-center gap-2 border border-blue-200"
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
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-medium transition-colors flex items-center justify-center gap-2 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Detail Modal - Redesigned */}
        {showDetailModal && selectedSupplier && (
          <div className="fixed inset-0 backdrop-brightness-90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-white shadow-xl overflow-hidden border-4 border-white border-opacity-30">
                      <img
                        src={selectedSupplier.avatarUrl || 'https://via.placeholder.com/96'}
                        alt={selectedSupplier.businessName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{selectedSupplier.businessName}</h2>
                      <div className="flex items-center gap-3 text-green-100">
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                          {selectedSupplier.businessType || 'Doanh nghiệp'}
                        </span>
                        <span className="text-sm">•</span>
                        <span className="font-mono">MST: {selectedSupplier.taxCode}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2.5 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body - 2 Column Layout */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-300px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Business & Representative Info */}
                  <div className="space-y-6">
                    {/* Business Details */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="bg-blue-500 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        Thông tin doanh nghiệp
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-xs text-gray-500 font-medium mb-1">Địa chỉ kinh doanh</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedSupplier.businessAddress || 'Chưa cung cấp'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-xs text-gray-500 font-medium mb-1">Ngày đăng ký</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(selectedSupplier.createdAt).toLocaleString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Representative Info */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="bg-purple-500 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        Người đại diện
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-white rounded-xl p-4">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Họ và tên</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedSupplier.fullName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-4">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedSupplier.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-4">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Số điện thoại</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedSupplier.phoneNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Documents */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="bg-orange-500 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        Giấy tờ đính kèm
                      </h3>

                      {(selectedSupplier.businessLicenseUrl || selectedSupplier.foodSafetyCertificateUrl) ? (
                        <div className="space-y-4">
                          {/* Business License */}
                          {selectedSupplier.businessLicenseUrl && (() => {
                            const fileUrl = getFileUrl(selectedSupplier.businessLicenseUrl);
                            const isPdf = isPdfFile(fileUrl);

                            return fileUrl ? (
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 transition-all">
                                <div className="flex items-start gap-4 mb-3">
                                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-lg mb-1">Giấy phép kinh doanh</p>
                                    {selectedSupplier.businessLicense && (
                                      <p className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded mb-2 inline-block">
                                        Số: {selectedSupplier.businessLicense}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {isPdf ? '📄 File PDF' : '🖼️ File ảnh'}
                                    </p>
                                  </div>
                                </div>

                                {/* Preview for images, link for PDFs */}
                                {!isPdf ? (
                                  <div className="space-y-2">
                                    <img
                                      src={fileUrl}
                                      alt="Business License"
                                      className="w-full rounded-lg border-2 border-blue-300 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                      onClick={() => window.open(fileUrl, '_blank')}
                                      onError={(e) => {
                                        console.error('Image failed to load:', fileUrl);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm py-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Mở trong tab mới
                                    </a>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Xem file PDF
                                    </a>
                                    <p className="text-xs text-center text-gray-500">
                                      Click vào nút trên để mở PDF trong tab mới
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : null;
                          })()}

                          {/* Food Safety Certificate */}
                          {selectedSupplier.foodSafetyCertificateUrl && (() => {
                            const fileUrl = getFileUrl(selectedSupplier.foodSafetyCertificateUrl);
                            const isPdf = isPdfFile(fileUrl);

                            return fileUrl ? (
                              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200 transition-all">
                                <div className="flex items-start gap-4 mb-3">
                                  <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-lg mb-1">Chứng nhận ATTP</p>
                                    {selectedSupplier.foodSafetyCertificate && (
                                      <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded mb-2 inline-block">
                                        Số: {selectedSupplier.foodSafetyCertificate}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {isPdf ? '📄 File PDF' : '🖼️ File ảnh'}
                                    </p>
                                  </div>
                                </div>

                                {/* Preview for images, link for PDFs */}
                                {!isPdf ? (
                                  <div className="space-y-2">
                                    <img
                                      src={fileUrl}
                                      alt="Food Safety Certificate"
                                      className="w-full rounded-lg border-2 border-green-300 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                      onClick={() => window.open(fileUrl, '_blank')}
                                      onError={(e) => {
                                        console.error('Image failed to load:', fileUrl);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 text-green-600 hover:text-green-800 font-semibold text-sm py-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Mở trong tab mới
                                    </a>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Xem file PDF
                                    </a>
                                    <p className="text-xs text-center text-gray-500">
                                      Click vào nút trên để mở PDF trong tab mới
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-orange-200">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">Chưa có giấy tờ đính kèm</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-medium transition-all"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    if (selectedSupplier) handleRejectClick(selectedSupplier);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Từ chối
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    if (selectedSupplier) handleApproveClick(selectedSupplier);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Duyệt ngay
                </button>
              </div>
            </div>
          </div>
        )}

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
