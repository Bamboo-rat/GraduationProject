import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import storeService from '~/service/storeService';
import supplierService from '~/service/supplierService';
import type { StorePendingUpdate, StoreUpdateListParams } from '~/service/storeService';
import type { SupplierPendingUpdateResponse } from '~/service/supplierService';
import { Store, Building2, Eye, Calendar, FileText, User, ChevronDown } from 'lucide-react';

type UpdateType = 'store' | 'business';

export default function UpdateHistory() {
  const navigate = useNavigate();
  const [updateType, setUpdateType] = useState<UpdateType>('store');
  const [storeUpdates, setStoreUpdates] = useState<StorePendingUpdate[]>([]);
  const [businessUpdates, setBusinessUpdates] = useState<SupplierPendingUpdateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('');
  const [selectedStoreUpdate, setSelectedStoreUpdate] = useState<StorePendingUpdate | null>(null);
  const [selectedBusinessUpdate, setSelectedBusinessUpdate] = useState<SupplierPendingUpdateResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const fetchStoreUpdates = async () => {
    try {
      setLoading(true);
      const params: StoreUpdateListParams = {
        page: currentPage,
        size: 10,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await storeService.getMyPendingUpdates(params);
      setStoreUpdates(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error fetching store updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessUpdates = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getMyBusinessInfoUpdates(statusFilter || undefined, currentPage, 10);
      setBusinessUpdates(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error fetching business updates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [updateType, statusFilter]);

  useEffect(() => {
    if (updateType === 'store') {
      fetchStoreUpdates();
    } else {
      fetchBusinessUpdates();
    }
  }, [currentPage, statusFilter, updateType]);

  const getStatusBadge = (status: string) => {
    const configs = {
      PENDING: { label: 'Chờ duyệt', class: 'badge-warning' },
      APPROVED: { label: 'Đã duyệt', class: 'badge-success' },
      REJECTED: { label: 'Bị từ chối', class: 'badge-error' },
    };
    const config = configs[status as keyof typeof configs] || { label: status, class: 'badge-neutral' };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>{config.label}</span>;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      '': 'Tất cả trạng thái',
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Bị từ chối',
    };
    return labels[status as keyof typeof labels] || status;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted ml-4">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="heading-primary mb-2">Lịch sử yêu cầu cập nhật</h1>
        <p className="text-muted">Theo dõi trạng thái các yêu cầu cập nhật của bạn</p>
      </div>

      {/* Tab Switch & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setUpdateType('store')}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
              updateType === 'store'
                ? 'bg-[#A4C3A2] text-[#2D2D2D]'
                : 'bg-[#F8FFF9] text-[#2D2D2D] hover:bg-[#E8FFED]'
            }`}
          >
            <Store size={20} />
            Cửa hàng ({updateType === 'store' ? totalElements : '...'})
          </button>
          <button
            onClick={() => setUpdateType('business')}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
              updateType === 'business'
                ? 'bg-[#A4C3A2] text-[#2D2D2D]'
                : 'bg-[#F8FFF9] text-[#2D2D2D] hover:bg-[#E8FFED]'
            }`}
          >
            <Building2 size={20} />
            Doanh nghiệp ({updateType === 'business' ? totalElements : '...'})
          </button>
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="bg-[#FFFEFA] border border-[#B7E4C7] rounded-lg px-4 py-2 text-[#2D2D2D] flex items-center gap-2 hover:bg-[#F8FFF9] transition-colors min-w-[180px] justify-between"
          >
            {getStatusLabel(statusFilter)}
            <ChevronDown size={16} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showStatusDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-[#FFFEFA] border border-[#B7E4C7] rounded-lg shadow-lg z-10 min-w-[180px]">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setShowStatusDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F8FFF9] transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                Tất cả trạng thái
              </button>
              <button
                onClick={() => {
                  setStatusFilter('PENDING');
                  setShowStatusDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F8FFF9] transition-colors"
              >
                Chờ duyệt
              </button>
              <button
                onClick={() => {
                  setStatusFilter('APPROVED');
                  setShowStatusDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F8FFF9] transition-colors"
              >
                Đã duyệt
              </button>
              <button
                onClick={() => {
                  setStatusFilter('REJECTED');
                  setShowStatusDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F8FFF9] transition-colors"
              >
                Bị từ chối
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {updateType === 'store' ? (
        // Store Updates List
        <div className="space-y-4">
          {storeUpdates.length === 0 ? (
            <div className="card p-12 text-center">
              <Store size={48} className="text-light mx-auto mb-4" />
              <p className="text-muted text-lg mb-2">Chưa có yêu cầu cập nhật cửa hàng nào</p>
              <p className="text-light">Các yêu cầu cập nhật cửa hàng sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            storeUpdates.map((update) => (
              <div key={update.updateId} className="card p-4 card-hover">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text truncate">
                        {(update as any).currentStoreName || 'N/A'}
                      </h3>
                      {getStatusBadge((update as any).updateStatus)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate((update as any).createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={14} />
                        Thay đổi: {(update as any).storeName && 'Tên, '}
                        {(update as any).address && 'Địa chỉ, '}
                        {(update as any).phoneNumber && 'SĐT, '}
                        {(update as any).description && 'Mô tả'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStoreUpdate(update);
                      setShowDetailModal(true);
                    }}
                    className="bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491] px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    Chi tiết
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Business Updates List
        <div className="space-y-4">
          {businessUpdates.length === 0 ? (
            <div className="card p-12 text-center">
              <Building2 size={48} className="text-light mx-auto mb-4" />
              <p className="text-muted text-lg mb-2">Chưa có yêu cầu cập nhật thông tin doanh nghiệp nào</p>
              <p className="text-light mb-4">Các yêu cầu cập nhật thông tin doanh nghiệp sẽ xuất hiện ở đây</p>
              <button
                onClick={() => navigate('/my-profile')}
                className="bg-[#2F855A] text-[#FFFEFA] hover:bg-[#8FB491] px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Quay lại Profile
              </button>
            </div>
          ) : (
            businessUpdates.map((update) => (
              <div key={update.updateId} className="card p-4 card-hover">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text">
                        Yêu cầu #{update.updateId.substring(0, 8)}
                      </h3>
                      {getStatusBadge(update.updateStatus)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(update.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={14} />
                        Thay đổi: {update.taxCode && 'MST, '}
                        {update.businessLicense && 'GPKD, '}
                        {update.foodSafetyCertificate && 'CCATTP'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBusinessUpdate(update);
                      setShowDetailModal(true);
                    }}
                    className="bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491] px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    Chi tiết
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491] px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className="bg-[#A4C3A2] text-[#2D2D2D] hover:bg-[#8FB491] px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </nav>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (selectedStoreUpdate || selectedBusinessUpdate) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
          <div className="bg-[#FFFEFA] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-[#2D2D2D]">Chi tiết yêu cầu</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedStoreUpdate(null);
                    setSelectedBusinessUpdate(null);
                  }}
                  className="text-[#8B8B8B] hover:text-[#2D2D2D] text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              {selectedStoreUpdate ? (
                // Store Update Details
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[#2D2D2D]">Trạng thái:</span>
                    {getStatusBadge((selectedStoreUpdate as any).updateStatus)}
                  </div>
                  
                  <div className="space-y-3">
                    {(selectedStoreUpdate as any).storeName && (
                      <div>
                        <span className="text-sm text-[#6B6B6B]">Tên cửa hàng mới</span>
                        <p className="font-medium text-[#2D2D2D]">{(selectedStoreUpdate as any).storeName}</p>
                      </div>
                    )}
                    {(selectedStoreUpdate as any).address && (
                      <div>
                        <span className="text-sm text-[#6B6B6B]">Địa chỉ mới</span>
                        <p className="font-medium text-[#2D2D2D]">{(selectedStoreUpdate as any).address}</p>
                      </div>
                    )}
                    {(selectedStoreUpdate as any).phoneNumber && (
                      <div>
                        <span className="text-sm text-[#6B6B6B]">Số điện thoại mới</span>
                        <p className="font-medium text-[#2D2D2D]">{(selectedStoreUpdate as any).phoneNumber}</p>
                      </div>
                    )}
                    {(selectedStoreUpdate as any).description && (
                      <div>
                        <span className="text-sm text-[#6B6B6B]">Mô tả mới</span>
                        <p className="font-medium text-[#2D2D2D]">{(selectedStoreUpdate as any).description}</p>
                      </div>
                    )}
                  </div>

                  {(selectedStoreUpdate as any).adminNotes && (
                    <div className="bg-[#F8FFF9] border border-[#B7E4C7] rounded-lg p-4">
                      <p className="text-sm font-medium text-[#2D2D2D] mb-1">Phản hồi từ Admin:</p>
                      <p className="text-[#6B6B6B]">{(selectedStoreUpdate as any).adminNotes}</p>
                    </div>
                  )}
                </div>
              ) : selectedBusinessUpdate ? (
                // Business Update Details
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[#2D2D2D]">Trạng thái:</span>
                    {getStatusBadge(selectedBusinessUpdate.updateStatus)}
                  </div>
                  
                  <div className="space-y-3">
                    {selectedBusinessUpdate.taxCode && (
                      <div>
                        <span className="text-sm text-[#6B6B6B]">Mã số thuế</span>
                        <p className="font-medium text-[#2D2D2D]">{selectedBusinessUpdate.taxCode}</p>
                      </div>
                    )}
                    {selectedBusinessUpdate.businessLicense && (
                      <div>
                        <span className="text-sm text-[#6B6B6B]">Giấy phép kinh doanh</span>
                        <p className="font-medium text-[#2D2D2D]">{selectedBusinessUpdate.businessLicense}</p>
                      </div>
                    )}
                    {selectedBusinessUpdate.foodSafetyCertificate && (
                      <div>
                        <span className="text-sm text-[#6B6B6B]">Chứng nhận ATTP</span>
                        <p className="font-medium text-[#2D2D2D]">{selectedBusinessUpdate.foodSafetyCertificate}</p>
                      </div>
                    )}
                  </div>

                  {selectedBusinessUpdate.adminNotes && (
                    <div className="bg-[#F8FFF9] border border-[#B7E4C7] rounded-lg p-4">
                      <p className="text-sm font-medium text-[#2D2D2D] mb-1">Phản hồi từ Admin:</p>
                      <p className="text-[#6B6B6B] mb-2">{selectedBusinessUpdate.adminNotes}</p>
                      {selectedBusinessUpdate.admin && (
                        <p className="text-xs text-[#8B8B8B]">Xử lý bởi: {selectedBusinessUpdate.admin.fullName}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}