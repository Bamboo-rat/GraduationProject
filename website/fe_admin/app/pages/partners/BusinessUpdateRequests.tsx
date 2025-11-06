import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import supplierService from '~/service/supplierService';
import type { SupplierPendingUpdate, UpdateStatus } from '~/service/supplierService';
import { FileText, Calendar, User, Building2, Eye, CheckCircle, XCircle, ChevronDown, Download } from 'lucide-react';

export default function BusinessUpdateRequests() {
  const [updates, setUpdates] = useState<SupplierPendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<UpdateStatus | ''>('');
  const [selectedUpdate, setSelectedUpdate] = useState<SupplierPendingUpdate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAllBusinessInfoUpdates(
        currentPage,
        10,
        statusFilter || undefined
      );
      setUpdates(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('Error fetching updates:', error);
      alert(error.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter]);

  useEffect(() => {
    fetchUpdates();
  }, [currentPage, statusFilter]);

  const handleApprove = async () => {
    if (!selectedUpdate) return;
    
    setProcessing(true);
    try {
      await supplierService.approveBusinessInfoUpdate(
        selectedUpdate.updateId,
        adminNotes || undefined
      );
      alert('Đã phê duyệt yêu cầu thành công!');
      setShowApproveModal(false);
      setShowDetailModal(false);
      setAdminNotes('');
      fetchUpdates();
    } catch (error: any) {
      alert(error.message || 'Không thể phê duyệt yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUpdate) return;
    
    if (!adminNotes.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    setProcessing(true);
    try {
      await supplierService.rejectBusinessInfoUpdate(
        selectedUpdate.updateId,
        adminNotes
      );
      alert('Đã từ chối yêu cầu');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setAdminNotes('');
      fetchUpdates();
    } catch (error: any) {
      alert(error.message || 'Không thể từ chối yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: UpdateStatus) => {
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${supplierService.getUpdateStatusColorClass(status)}`}>
        {supplierService.getUpdateStatusLabel(status)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadFile = (url: string) => {
    // Open in new tab - browser will handle download
    window.open(url, '_blank');
  };

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A]"></div>
          <p className="text-[#6B6B6B] ml-4">Đang tải...</p>
        </div>
      ) : (
        <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2">Yêu cầu cập nhật thông tin doanh nghiệp</h1>
        <p className="text-[#6B6B6B]">Xem xét và phê duyệt các yêu cầu thay đổi thông tin từ nhà cung cấp</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-[#2F855A]" />
          <span className="text-[#2D2D2D] font-medium">
            Tổng số: <span className="text-[#2F855A] font-bold">{totalElements}</span> yêu cầu
          </span>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="bg-[#FFFEFA] border-2 border-[#B7E4C7] rounded-xl px-5 py-2.5 text-[#2D2D2D] flex items-center gap-2 hover:bg-[#F8FFF9] transition-colors min-w-[180px] justify-between font-medium"
          >
            {statusFilter ? supplierService.getUpdateStatusLabel(statusFilter) : 'Tất cả trạng thái'}
            <ChevronDown size={18} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showStatusDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-[#FFFEFA] border-2 border-[#B7E4C7] rounded-xl shadow-lg z-10 min-w-[180px] overflow-hidden">
              <button
                onClick={() => { setStatusFilter(''); setShowStatusDropdown(false); }}
                className="w-full text-left px-5 py-3 hover:bg-[#E8FFED] transition-colors text-[#2D2D2D] font-medium"
              >
                Tất cả trạng thái
              </button>
              <button
                onClick={() => { setStatusFilter('PENDING'); setShowStatusDropdown(false); }}
                className="w-full text-left px-5 py-3 hover:bg-[#E8FFED] transition-colors text-[#2D2D2D]"
              >
                Chờ duyệt
              </button>
              <button
                onClick={() => { setStatusFilter('APPROVED'); setShowStatusDropdown(false); }}
                className="w-full text-left px-5 py-3 hover:bg-[#E8FFED] transition-colors text-[#2D2D2D]"
              >
                Đã duyệt
              </button>
              <button
                onClick={() => { setStatusFilter('REJECTED'); setShowStatusDropdown(false); }}
                className="w-full text-left px-5 py-3 hover:bg-[#E8FFED] transition-colors text-[#2D2D2D]"
              >
                Đã từ chối
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {updates.length === 0 ? (
          <div className="bg-[#FFFEFA] border-2 border-[#B7E4C7] rounded-2xl p-12 text-center">
            <FileText size={48} className="text-[#B7E4C7] mx-auto mb-4" />
            <p className="text-[#6B6B6B] text-lg mb-2">Không có yêu cầu nào</p>
            <p className="text-[#8B8B8B]">Các yêu cầu cập nhật thông tin doanh nghiệp sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          updates.map((update) => (
            <div key={update.updateId} className="bg-[#FFFEFA] border-2 border-[#B7E4C7] rounded-2xl p-5 hover:shadow-lg transition-all">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-[#2D2D2D]">
                      {update.currentBusinessName}
                    </h3>
                    {getStatusBadge(update.updateStatus)}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-[#6B6B6B]">
                      <User size={16} className="text-[#2F855A]" />
                      <span>{update.supplierName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6B6B6B]">
                      <Calendar size={16} className="text-[#2F855A]" />
                      <span>{formatDate(update.createdAt)}</span>
                    </div>
                  </div>

                  {/* Changes Summary */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-[#8B8B8B]">Thay đổi:</span>
                    {update.taxCode && (
                      <span className="bg-[#E8FFED] text-[#2F855A] px-2 py-1 rounded-lg font-medium">
                        Mã số thuế
                      </span>
                    )}
                    {update.businessLicense && (
                      <span className="bg-[#E8FFED] text-[#2F855A] px-2 py-1 rounded-lg font-medium">
                        GPKD
                      </span>
                    )}
                    {update.foodSafetyCertificate && (
                      <span className="bg-[#E8FFED] text-[#2F855A] px-2 py-1 rounded-lg font-medium">
                        CCATTP
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUpdate(update);
                      setShowDetailModal(true);
                    }}
                    className="bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491] px-4 py-2 rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    <Eye size={18} />
                    Chi tiết
                  </button>

                  {update.updateStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedUpdate(update);
                          setShowApproveModal(true);
                        }}
                        className="bg-gradient-to-r from-[#2F855A] to-[#A4C3A2] text-[#FFFEFA] hover:from-[#8FB491] hover:to-[#2F855A] px-4 py-2 rounded-xl transition-all font-medium flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Duyệt
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUpdate(update);
                          setShowRejectModal(true);
                        }}
                        className="bg-[#E63946] text-[#FFFEFA] hover:bg-[#C5303D] px-4 py-2 rounded-xl transition-colors font-medium flex items-center gap-2"
                      >
                        <XCircle size={18} />
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491] px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNumber = i;
              if (totalPages > 5) {
                if (currentPage < 3) pageNumber = i;
                else if (currentPage > totalPages - 4) pageNumber = totalPages - 5 + i;
                else pageNumber = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    pageNumber === currentPage
                      ? 'bg-[#2F855A] text-[#FFFEFA]'
                      : 'bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491]'
                  }`}
                >
                  {pageNumber + 1}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491] px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </nav>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUpdate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEFA] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D2D2D] mb-1">Chi tiết yêu cầu</h2>
                  <p className="text-[#6B6B6B]">ID: {selectedUpdate.updateId}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedUpdate(null);
                  }}
                  className="text-[#8B8B8B] hover:text-[#2D2D2D] text-3xl transition-colors leading-none"
                >
                  ×
                </button>
              </div>

              {/* Status */}
              <div className="mb-6">
                {getStatusBadge(selectedUpdate.updateStatus)}
              </div>

              {/* Supplier Info */}
              <div className="bg-[#E8FFED] border-2 border-[#B7E4C7] rounded-xl p-4 mb-6">
                <h3 className="font-bold text-[#2D2D2D] mb-3 flex items-center gap-2">
                  <Building2 size={20} className="text-[#2F855A]" />
                  Thông tin nhà cung cấp
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#6B6B6B]">Tên doanh nghiệp:</span>
                    <p className="font-medium text-[#2D2D2D]">{selectedUpdate.currentBusinessName}</p>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B]">Người đại diện:</span>
                    <p className="font-medium text-[#2D2D2D]">{selectedUpdate.supplierName}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6B6B6B]">Mã số thuế hiện tại:</span>
                    <p className="font-medium text-[#2D2D2D]">{selectedUpdate.currentTaxCode || 'Chưa có'}</p>
                  </div>
                </div>
              </div>

              {/* Update Details */}
              <div className="bg-[#F8FFF9] border-2 border-[#B7E4C7] rounded-xl p-4 mb-6">
                <h3 className="font-bold text-[#2D2D2D] mb-3 flex items-center gap-2">
                  <FileText size={20} className="text-[#2F855A]" />
                  Thông tin cập nhật
                </h3>
                <div className="space-y-4">
                  {selectedUpdate.taxCode && (
                    <div>
                      <span className="text-sm text-[#6B6B6B]">Mã số thuế mới</span>
                      <p className="font-bold text-[#2D2D2D] text-lg">{selectedUpdate.taxCode}</p>
                    </div>
                  )}
                  {selectedUpdate.businessLicense && (
                    <div>
                      <span className="text-sm text-[#6B6B6B]">Giấy phép kinh doanh mới</span>
                      <p className="font-bold text-[#2D2D2D] text-lg">{selectedUpdate.businessLicense}</p>
                      {selectedUpdate.businessLicenseUrl && (
                        <button
                          onClick={() => handleDownloadFile(selectedUpdate.businessLicenseUrl!)}
                          className="flex items-center gap-2 text-[#2F855A] hover:text-[#276749] font-medium text-sm mt-2 transition-colors"
                        >
                          <Download size={16} />
                          Tải xuống file đính kèm
                        </button>
                      )}
                    </div>
                  )}
                  {selectedUpdate.foodSafetyCertificate && (
                    <div>
                      <span className="text-sm text-[#6B6B6B]">Chứng nhận ATTP mới</span>
                      <p className="font-bold text-[#2D2D2D] text-lg">{selectedUpdate.foodSafetyCertificate}</p>
                      {selectedUpdate.foodSafetyCertificateUrl && (
                        <button
                          onClick={() => handleDownloadFile(selectedUpdate.foodSafetyCertificateUrl!)}
                          className="flex items-center gap-2 text-[#2F855A] hover:text-[#276749] font-medium text-sm mt-2 transition-colors"
                        >
                          <Download size={16} />
                          Tải xuống file đính kèm
                        </button>
                      )}
                    </div>
                  )}
                  {selectedUpdate.supplierNotes && (
                    <div>
                      <span className="text-sm text-[#6B6B6B]">Ghi chú từ nhà cung cấp</span>
                      <p className="text-[#2D2D2D] bg-[#FFFEFA] p-3 rounded-lg border border-[#B7E4C7]">
                        {selectedUpdate.supplierNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Response (if processed) */}
              {selectedUpdate.adminNotes && (
                <div className="bg-[#FFF5E6] border-2 border-[#FFD700] rounded-xl p-4 mb-6">
                  <h3 className="font-bold text-[#2D2D2D] mb-3">Phản hồi từ Admin</h3>
                  <p className="text-[#2D2D2D] mb-2">{selectedUpdate.adminNotes}</p>
                  {selectedUpdate.adminName && (
                    <p className="text-sm text-[#6B6B6B]">
                      Xử lý bởi: <span className="font-medium">{selectedUpdate.adminName}</span>
                    </p>
                  )}
                  {selectedUpdate.processedAt && (
                    <p className="text-xs text-[#8B8B8B] mt-1">
                      Xử lý lúc: {formatDate(selectedUpdate.processedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedUpdate.updateStatus === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowApproveModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-[#2F855A] to-[#A4C3A2] text-[#FFFEFA] hover:from-[#8FB491] hover:to-[#2F855A] px-6 py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 bg-[#E63946] text-[#FFFEFA] hover:bg-[#C5303D] px-6 py-3 rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedUpdate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEFA] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Xác nhận phê duyệt</h2>
            <p className="text-[#6B6B6B] mb-4">
              Bạn có chắc chắn muốn phê duyệt yêu cầu cập nhật thông tin của <strong>{selectedUpdate.currentBusinessName}</strong>?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border-2 border-[#B7E4C7] rounded-xl px-4 py-2 focus:border-[#2F855A] focus:outline-none resize-none"
                rows={3}
                placeholder="Nhập ghi chú nếu cần..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setAdminNotes('');
                }}
                disabled={processing}
                className="flex-1 bg-[#F8FFF9] text-[#2D2D2D] hover:bg-[#E8FFED] border-2 border-[#B7E4C7] px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-[#2F855A] to-[#A4C3A2] text-[#FFFEFA] hover:from-[#8FB491] hover:to-[#2F855A] px-4 py-2 rounded-xl transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Phê duyệt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedUpdate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEFA] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Xác nhận từ chối</h2>
            <p className="text-[#6B6B6B] mb-4">
              Bạn có chắc chắn muốn từ chối yêu cầu cập nhật thông tin của <strong>{selectedUpdate.currentBusinessName}</strong>?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Lý do từ chối <span className="text-[#E63946]">*</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border-2 border-[#E63946] rounded-xl px-4 py-2 focus:border-[#C5303D] focus:outline-none resize-none"
                rows={3}
                placeholder="Nhập lý do từ chối..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setAdminNotes('');
                }}
                disabled={processing}
                className="flex-1 bg-[#F8FFF9] text-[#2D2D2D] hover:bg-[#E8FFED] border-2 border-[#B7E4C7] px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 bg-[#E63946] text-[#FFFEFA] hover:bg-[#C5303D] px-4 py-2 rounded-xl transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    Từ chối
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </DashboardLayout>
  );
}
