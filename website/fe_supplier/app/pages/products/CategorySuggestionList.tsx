import { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Filter, 
  Plus, 
  Calendar, 
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import categorySuggestionService from '~/service/categorySuggestionService';
import type { CategorySuggestion, CategorySuggestionListParams } from '~/service/categorySuggestionService';
import Toast, {type ToastType } from '~/component/common/Toast';

export default function CategorySuggestionList() {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params: CategorySuggestionListParams = {
        page: currentPage,
        size: 10,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response: any = await categorySuggestionService.getMySuggestions(params);

      const content = response?.content ?? [];
      const page = response?.page ?? {
        totalPages: response?.totalPages ?? 0,
        totalElements: response?.totalElements ?? 0,
        size: response?.size ?? 10,
        number: response?.number ?? currentPage,
      };

      setSuggestions(content);
      setTotalPages(page.totalPages ?? 0);
      setTotalElements(page.totalElements ?? 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showToast('Lỗi khi tải danh sách đề xuất', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [currentPage, statusFilter]);

  const handleCreateSuggestion = async () => {
    if (!newName.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'warning');
      return;
    }

    if (!reason.trim()) {
      showToast('Vui lòng nhập lý do đề xuất', 'warning');
      return;
    }

    try {
      await categorySuggestionService.createSuggestion({
        name: newName.trim(),
        reason: reason.trim(),
      });
      showToast('Gửi đề xuất thành công', 'success');
      setShowCreateModal(false);
      setNewName('');
      setReason('');
      setCurrentPage(0);
      fetchSuggestions();
    } catch (error) {
      console.error('Error creating suggestion:', error);
      showToast('Lỗi khi gửi đề xuất', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { 
        label: 'Chờ duyệt', 
        class: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: <Clock size={14} />
      },
      APPROVED: { 
        label: 'Đã duyệt', 
        class: 'bg-green-50 text-green-700 border-green-200',
        icon: <CheckCircle size={14} />
      },
      REJECTED: { 
        label: 'Bị từ chối', 
        class: 'bg-red-50 text-red-700 border-red-200',
        icon: <XCircle size={14} />
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      class: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: <AlertCircle size={14} />
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.class}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[#6B6B6B] animate-pulse">Đang tải danh sách đề xuất...</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="text-[#A4C3A2]" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-[#2D2D2D]">Đề xuất danh mục</h1>
            <p className="text-[#6B6B6B] mt-1">Gửi đề xuất danh mục mới và theo dõi trạng thái</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#6B6B6B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-field min-w-[160px]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-secondary whitespace-nowrap flex items-center gap-2 sm:ml-auto"
        >
          <Plus size={16} />
          Đề xuất mới
        </button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="card text-center py-16">
            <Lightbulb size={64} className="text-[#DDC6B6] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#2D2D2D] mb-3">Chưa có đề xuất nào</h3>
            <p className="text-[#6B6B6B] mb-6 max-w-md mx-auto">
              Bạn chưa gửi đề xuất danh mục nào. Hãy tạo đề xuất đầu tiên để đề xuất danh mục mới cho hệ thống.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              <Plus size={18} />
              Tạo đề xuất đầu tiên
            </button>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div key={suggestion.id} className="card card-hover p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Main Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#2D2D2D] text-lg mb-2">
                        {suggestion.name}
                      </h3>
                      <p className="text-[#6B6B6B] leading-relaxed">
                        {suggestion.reason}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(suggestion.status)}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-[#8B8B8B]">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      Gửi ngày: {new Date(suggestion.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                {suggestion.adminNotes && (
                  <div className="lg:w-80 bg-[#F8FFF9] border border-[#E8FFED] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={16} className="text-[#2F855A]" />
                      <span className="font-medium text-[#2D2D2D]">Phản hồi từ quản trị viên</span>
                    </div>
                    <p className="text-[#6B6B6B] text-sm mb-3 leading-relaxed">{suggestion.adminNotes}</p>
                    {suggestion.processorName && (
                      <div className="flex items-center gap-2 text-xs text-[#8B8B8B]">
                        <User size={12} />
                        <span>Xử lý bởi: {suggestion.processorName}</span>
                        {suggestion.processedAt && (
                          <span>• {new Date(suggestion.processedAt).toLocaleString('vi-VN')}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simplified Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#DDC6B6]">
          <div className="text-sm text-[#6B6B6B]">
            Hiển thị {Math.min((currentPage * 10) + 1, totalElements)} -{' '}
            {Math.min((currentPage + 1) * 10, totalElements)} của {totalElements} đề xuất
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-[#DDC6B6] bg-white hover:bg-[#F8FFF9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1">
              <span className="px-3 py-1 text-sm font-medium text-[#2D2D2D]">
                Trang {currentPage + 1} / {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg border border-[#DDC6B6] bg-white hover:bg-[#F8FFF9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create Suggestion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[#DDC6B6]">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="text-[#A4C3A2]" size={24} />
              <h2 className="text-xl font-bold text-[#2D2D2D]">Đề xuất danh mục mới</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Thực phẩm hữu cơ, Đồ uống tự nhiên..."
                  className="input-field w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Lý do đề xuất *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả lý do tại sao nên thêm danh mục này, lợi ích mang lại..."
                  rows={4}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[#DDC6B6]">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setReason('');
                }}
                className="px-4 py-2 text-[#6B6B6B] hover:text-[#2D2D2D] transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSuggestion}
                className="btn-primary px-6 py-2"
              >
                Gửi đề xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}