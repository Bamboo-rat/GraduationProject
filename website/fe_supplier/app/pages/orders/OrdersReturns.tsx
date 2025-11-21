import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Package, AlertTriangle, Search } from 'lucide-react';
import returnRequestService from '~/service/returnRequestService';
import type { ReturnRequestResponse } from '~/service/returnRequestService';

export default function OrdersReturns() {
  const [requests, setRequests] = useState<ReturnRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestResponse | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReturns();
  }, [page, filter]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      
      const pending = filter === 'pending';

      console.log('Loading returns with filter:', filter, 'pending:', pending);

      const data = await returnRequestService.getMyStoresRequests({
        pending,
        page,
        size: 10,
      });

      console.log('Received data:', data);

      // Lọc thêm trên client side nếu cần
      let filteredContent = data.content;
      if (filter === 'approved') {
        filteredContent = data.content.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED');
      } else if (filter === 'rejected') {
        filteredContent = data.content.filter(r => r.status === 'REJECTED');
      }

      console.log('Filtered content:', filteredContent);

      setRequests(filteredContent);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(true);
      await returnRequestService.approveReturnRequest(requestId, {
        reviewComment: reviewComment || undefined,
      });
      setReviewComment('');
      setSelectedRequest(null);
      await loadReturns();
    } catch (err: any) {
      alert(err.message || 'Không thể chấp nhận yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!reviewComment.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setActionLoading(true);
      await returnRequestService.rejectReturnRequest(requestId, {
        reviewComment,
      });
      setReviewComment('');
      setSelectedRequest(null);
      await loadReturns();
    } catch (err: any) {
      alert(err.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) =>
    req.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Yêu cầu trả hàng</h1>
          <p className="text-[#6B6B6B] mt-1">Quản lý các yêu cầu trả hàng và hoàn tiền từ khách hàng</p>
        </div>
        <button
          onClick={loadReturns}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Tổng yêu cầu</h3>
          <p className="text-2xl font-bold text-[#2D2D2D]">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Chờ xử lý</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Đã chấp nhận</h3>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Đã từ chối</h3>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Lưu ý về xử lý trả hàng</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Kiểm tra sản phẩm trả lại kỹ càng trước khi chấp nhận</li>
              <li>• Hoàn tiền sẽ được xử lý tự động sau khi chấp nhận</li>
              <li>• Nhập lý do rõ ràng khi từ chối yêu cầu</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8FFED] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn, tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#B7E4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#2F855A] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ xử lý
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã chấp nhận
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã từ chối
            </button>
          </div>
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8FFED] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#A4C3A2]"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold mb-2">
              {requests.length === 0 
                ? 'Chưa có yêu cầu trả hàng nào' 
                : 'Không tìm thấy yêu cầu phù hợp'}
            </p>
            <p className="text-sm">
              {requests.length === 0
                ? filter === 'all' 
                  ? 'Chưa có khách hàng nào yêu cầu trả hàng. Các yêu cầu trả hàng sẽ xuất hiện ở đây.'
                  : filter === 'pending'
                  ? 'Hiện không có yêu cầu trả hàng nào đang chờ xử lý.'
                  : filter === 'approved'
                  ? 'Chưa có yêu cầu trả hàng nào được chấp nhận.'
                  : 'Chưa có yêu cầu trả hàng nào bị từ chối.'
                : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'}
            </p>
            {requests.length === 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-2xl mx-auto text-left">
                <p className="text-sm text-blue-900 mb-3 font-semibold">
                  💡 Tại sao chưa có yêu cầu trả hàng?
                </p>
                <div className="text-sm text-blue-800 space-y-2 mb-4">
                  <p>1. <strong>Chưa có khách hàng nào yêu cầu trả hàng</strong> cho các cửa hàng của bạn</p>
                  <p>2. Khách hàng chỉ có thể yêu cầu trả hàng khi:</p>
                  <ul className="ml-6 space-y-1 list-disc">
                    <li>Đơn hàng đã giao thành công (trạng thái: <strong>Đã giao</strong>)</li>
                    <li>Trong vòng <strong>7 ngày</strong> kể từ ngày giao hàng</li>
                    <li>Sản phẩm chưa hết hạn sử dụng</li>
                  </ul>
                  <p>3. Yêu cầu trả hàng được tạo từ <strong>ứng dụng khách hàng</strong>, không phải từ portal nhà cung cấp</p>
                </div>
                <div className="border-t border-blue-200 pt-3 mt-3">
                  <p className="text-xs text-blue-700 font-medium mb-1">Debug Information:</p>
                  <div className="text-xs text-blue-600 space-y-1 font-mono bg-blue-100 p-2 rounded">
                    <p>Filter: <strong>{filter}</strong></p>
                    <p>Total pages: <strong>{totalPages}</strong></p>
                    <p>Current page: <strong>{page}</strong></p>
                    <p>Mở Console (F12) để xem API response</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F8FFF9]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Lý do</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày yêu cầu</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.returnRequestId} className="hover:bg-[#F8FFF9] transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                      #{request.orderCode}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{request.customerName}</p>
                        <p className="text-sm text-gray-500">{request.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate">{request.reason}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-red-600">
                      {returnRequestService.formatVND(request.refundAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${returnRequestService.getStatusColor(
                          request.status
                        )}`}
                      >
                        {returnRequestService.getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {returnRequestService.formatDateTime(request.requestedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-[#2F855A] hover:text-[#8FB491] font-medium"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-[#B7E4C7] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FFF9]"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-[#B7E4C7] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FFF9]"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-[#2D2D2D]">Chi tiết yêu cầu trả hàng</h3>
                  <p className="text-gray-600 mt-1">#{selectedRequest.orderCode}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewComment('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-3">Thông tin khách hàng</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Tên:</span>{' '}
                    <span className="font-medium">{selectedRequest.customerName}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">SĐT:</span>{' '}
                    <span className="font-medium">{selectedRequest.customerPhone}</span>
                  </p>
                </div>
              </div>

              {/* Return Reason */}
              <div>
                <h4 className="font-semibold mb-2">Lý do trả hàng</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{selectedRequest.reason}</p>
                {selectedRequest.reasonDetail && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
                    Chi tiết: {selectedRequest.reasonDetail}
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">Sản phẩm trả lại</h4>
                <div className="space-y-3">
                  {selectedRequest.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          {item.variantName && <p className="text-sm text-gray-500">{item.variantName}</p>}
                          <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{returnRequestService.formatVND(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Amount */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Số tiền hoàn lại:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {returnRequestService.formatVND(selectedRequest.refundAmount)}
                  </span>
                </div>
              </div>

              {/* Review Section */}
              {selectedRequest.status === 'PENDING' && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">Xử lý yêu cầu</h4>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Nhập ghi chú (bắt buộc khi từ chối)..."
                    className="w-full px-4 py-3 border border-[#B7E4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2] mb-4"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.returnRequestId)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.returnRequestId)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <XCircle className="w-5 h-5" />
                      Từ chối
                    </button>
                  </div>
                </div>
              )}

              {/* Review Info (if reviewed) */}
              {selectedRequest.reviewedBy && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold mb-2">Thông tin xử lý</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Người xử lý:</span>{' '}
                      <span className="font-medium">{selectedRequest.reviewerName}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Thời gian:</span>{' '}
                      <span className="font-medium">
                        {selectedRequest.reviewedAt && returnRequestService.formatDateTime(selectedRequest.reviewedAt)}
                      </span>
                    </p>
                    {selectedRequest.reviewComment && (
                      <p>
                        <span className="text-gray-600">Ghi chú:</span>{' '}
                        <span className="font-medium">{selectedRequest.reviewComment}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewComment('');
                }}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
