import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import storeService from '~/service/storeService';
import supplierService from '~/service/supplierService';
import type { StorePendingUpdate, StoreUpdateListParams } from '~/service/storeService';
import type { SupplierPendingUpdateResponse } from '~/service/supplierService';
import { Store, Building2, Search, Filter, Eye, Calendar, FileText, User, MapPin, Phone, Info } from 'lucide-react';

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
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="heading-primary mb-2">Lịch sử yêu cầu cập nhật</h1>
        <p className="text-muted">Theo dõi trạng thái các yêu cầu cập nhật của bạn</p>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setUpdateType('store')}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
            updateType === 'store'
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        >
          <Store size={20} />
          Cửa hàng ({updateType === 'store' ? totalElements : '...'})
        </button>
        <button
          onClick={() => setUpdateType('business')}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-3 transition-colors ${
            updateType === 'business'
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        >
          <Building2 size={20} />
          Thông tin doanh nghiệp ({updateType === 'business' ? totalElements : '...'})
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !statusFilter ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          Chờ duyệt
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          Đã duyệt
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          Bị từ chối
        </button>
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
              <div key={update.updateId} className="card p-6 card-hover">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text">
                        Cửa hàng: {(update as any).currentStoreName || 'N/A'}
                      </h3>
                      {getStatusBadge((update as any).updateStatus)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Gửi: {formatDate((update as any).createdAt)}
                      </span>
                      {(update as any).processedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Xử lý: {formatDate((update as any).processedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(update as any).adminNotes && (
                  <div className="bg-surface-light border border-default rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-text mb-1 flex items-center gap-2">
                      <User size={14} />
                      Phản hồi từ Admin:
                    </p>
                    <p className="text-sm text-muted">{(update as any).adminNotes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted flex items-center gap-2">
                    <FileText size={14} />
                    Thay đổi: {(update as any).storeName && 'Tên, '}
                    {(update as any).address && 'Địa chỉ, '}
                    {(update as any).phoneNumber && 'SĐT, '}
                    {(update as any).description && 'Mô tả'}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStoreUpdate(update);
                      setShowDetailModal(true);
                    }}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    Xem chi tiết
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
                className="btn-primary"
              >
                Quay lại Profile để tạo yêu cầu
              </button>
            </div>
          ) : (
            businessUpdates.map((update) => (
              <div key={update.updateId} className="card p-6 card-hover">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text">
                        Yêu cầu #{update.updateId.substring(0, 8)}
                      </h3>
                      {getStatusBadge(update.updateStatus)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Gửi: {formatDate(update.createdAt)}
                      </span>
                      {update.processedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Xử lý: {formatDate(update.processedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {update.adminNotes && (
                  <div className="bg-surface-light border border-default rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-text mb-1 flex items-center gap-2">
                      <User size={14} />
                      Phản hồi từ Admin:
                    </p>
                    <p className="text-sm text-muted">{update.adminNotes}</p>
                    {update.admin && (
                      <p className="text-xs text-light mt-1">Xử lý bởi: {update.admin.fullName}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted flex items-center gap-2">
                    <FileText size={14} />
                    Thay đổi: {update.taxCode && 'MST, '}
                    {update.businessLicense && 'GPKD, '}
                    {update.foodSafetyCertificate && 'CCATTP'}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBusinessUpdate(update);
                      setShowDetailModal(true);
                    }}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    Xem chi tiết
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
          <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn-secondary rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`px-4 py-2 border text-sm font-medium transition-colors ${
                    pageNumber === currentPage
                      ? 'bg-primary text-surface border-primary-dark z-10'
                      : 'bg-surface border-default text-text hover:bg-surface-light'
                  } ${i === 0 ? 'rounded-l-lg' : ''} ${i === Math.min(totalPages, 5) - 1 ? 'rounded-r-lg' : ''}`}
                >
                  {pageNumber + 1}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="btn-secondary rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </nav>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (selectedStoreUpdate || selectedBusinessUpdate) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
          <div className="bg-surface rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto card-hover">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="heading-secondary">Chi tiết yêu cầu cập nhật</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedStoreUpdate(null);
                    setSelectedBusinessUpdate(null);
                  }}
                  className="text-light hover:text-text text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              {selectedStoreUpdate ? (
                // Store Update Details
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text">Trạng thái:</span>
                    {getStatusBadge((selectedStoreUpdate as any).updateStatus)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-muted" />
                      <div>
                        <span className="text-sm text-muted">Cửa hàng</span>
                        <p className="font-medium text-text">{(selectedStoreUpdate as any).currentStoreName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted" />
                      <div>
                        <span className="text-sm text-muted">Ngày gửi</span>
                        <p className="font-medium text-text">{formatDate((selectedStoreUpdate as any).createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-default pt-4">
                    <h3 className="heading-secondary mb-4 flex items-center gap-2">
                      <Info size={18} />
                      Thông tin thay đổi
                    </h3>
                    <div className="space-y-3">
                      {(selectedStoreUpdate as any).storeName && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <Store size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Tên cửa hàng</span>
                            <p className="font-medium text-text">{(selectedStoreUpdate as any).storeName}</p>
                          </div>
                        </div>
                      )}
                      {(selectedStoreUpdate as any).address && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <MapPin size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Địa chỉ</span>
                            <p className="font-medium text-text">{(selectedStoreUpdate as any).address}</p>
                          </div>
                        </div>
                      )}
                      {(selectedStoreUpdate as any).phoneNumber && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <Phone size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Số điện thoại</span>
                            <p className="font-medium text-text">{(selectedStoreUpdate as any).phoneNumber}</p>
                          </div>
                        </div>
                      )}
                      {(selectedStoreUpdate as any).description && (
                        <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
                          <FileText size={16} className="text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Mô tả</span>
                            <p className="font-medium text-text">{(selectedStoreUpdate as any).description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedStoreUpdate as any).adminNotes && (
                    <div className="bg-surface-light border border-default rounded-lg p-4">
                      <p className="text-sm font-medium text-text mb-2 flex items-center gap-2">
                        <User size={14} />
                        Phản hồi từ Admin
                      </p>
                      <p className="text-muted">{(selectedStoreUpdate as any).adminNotes}</p>
                    </div>
                  )}
                </div>
              ) : selectedBusinessUpdate ? (
                // Business Update Details
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text">Trạng thái:</span>
                    {getStatusBadge(selectedBusinessUpdate.updateStatus)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted" />
                      <div>
                        <span className="text-sm text-muted">Ngày gửi</span>
                        <p className="font-medium text-text">{formatDate(selectedBusinessUpdate.createdAt)}</p>
                      </div>
                    </div>
                    {selectedBusinessUpdate.processedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-muted" />
                        <div>
                          <span className="text-sm text-muted">Ngày xử lý</span>
                          <p className="font-medium text-text">{formatDate(selectedBusinessUpdate.processedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-default pt-4">
                    <h3 className="heading-secondary mb-4 flex items-center gap-2">
                      <Building2 size={18} />
                      Thông tin thay đổi
                    </h3>
                    <div className="space-y-3">
                      {selectedBusinessUpdate.taxCode && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <FileText size={16} className="text-secondary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Mã số thuế</span>
                            <p className="font-medium text-text">{selectedBusinessUpdate.taxCode}</p>
                          </div>
                        </div>
                      )}
                      {selectedBusinessUpdate.businessLicense && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <FileText size={16} className="text-secondary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Giấy phép kinh doanh</span>
                            <p className="font-medium text-text">{selectedBusinessUpdate.businessLicense}</p>
                          </div>
                        </div>
                      )}
                      {selectedBusinessUpdate.businessLicenseUrl && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <FileText size={16} className="text-secondary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Tài liệu GPKD</span>
                            <a 
                              href={selectedBusinessUpdate.businessLicenseUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="font-medium text-secondary hover:underline flex items-center gap-1"
                            >
                              Xem tài liệu
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedBusinessUpdate.foodSafetyCertificate && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <FileText size={16} className="text-secondary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Chứng nhận ATTP</span>
                            <p className="font-medium text-text">{selectedBusinessUpdate.foodSafetyCertificate}</p>
                          </div>
                        </div>
                      )}
                      {selectedBusinessUpdate.foodSafetyCertificateUrl && (
                        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                          <FileText size={16} className="text-secondary flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Tài liệu ATTP</span>
                            <a 
                              href={selectedBusinessUpdate.foodSafetyCertificateUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="font-medium text-secondary hover:underline flex items-center gap-1"
                            >
                              Xem tài liệu
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedBusinessUpdate.supplierNotes && (
                        <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
                          <FileText size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-muted">Ghi chú của bạn</span>
                            <p className="font-medium text-text">{selectedBusinessUpdate.supplierNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedBusinessUpdate.adminNotes && (
                    <div className="bg-surface-light border border-default rounded-lg p-4">
                      <p className="text-sm font-medium text-text mb-2 flex items-center gap-2">
                        <User size={14} />
                        Phản hồi từ Admin
                      </p>
                      <p className="text-muted mb-2">{selectedBusinessUpdate.adminNotes}</p>
                      {selectedBusinessUpdate.admin && (
                        <p className="text-xs text-light">Xử lý bởi: {selectedBusinessUpdate.admin.fullName}</p>
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