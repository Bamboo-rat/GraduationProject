import React, { useState, useEffect } from 'react';

interface SupplierSuspendModalProps {
  show: boolean;
  action: 'suspend' | 'activate' | null;
  supplierName: string;
  supplierBusinessName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export default function SupplierSuspendModal({
  show,
  action,
  supplierName,
  supplierBusinessName,
  supplierEmail,
  supplierPhone,
  onConfirm,
  onCancel,
}: SupplierSuspendModalProps) {
  const [reason, setReason] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (show && action === 'suspend') {
      setReason('');
    }
  }, [show, action]);

  if (!show || !action) return null;

  const getActionConfig = () => {
    switch (action) {
      case 'suspend':
        return {
          title: 'Xác nhận đình chỉ nhà cung cấp',
          description: 'Bạn có chắc chắn muốn đình chỉ nhà cung cấp này?',
          buttonText: 'Xác nhận đình chỉ',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          icon: '🚫',
        };
      case 'activate':
        return {
          title: 'Xác nhận kích hoạt lại nhà cung cấp',
          description: 'Bạn có chắc chắn muốn gỡ bỏ đình chỉ và kích hoạt lại nhà cung cấp này?',
          buttonText: 'Xác nhận kích hoạt',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          icon: '✅',
        };
      default:
        return null;
    }
  };

  const config = getActionConfig();
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
              <p className="text-sm text-gray-600 mt-1">Nhà cung cấp: <span className="font-semibold">{supplierName}</span></p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Warning Message */}
          <div className={`p-4 rounded-lg ${action === 'suspend' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <p className={`text-sm ${action === 'suspend' ? 'text-red-800' : 'text-green-800'}`}>
              {config.description}
            </p>
          </div>

          {/* Supplier Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-xl">📋</span>
              Thông tin nhà cung cấp
            </h3>
            <div className="space-y-2">
              {supplierBusinessName && (
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 min-w-[120px]">Tên doanh nghiệp:</span>
                  <span className="text-sm font-medium text-gray-900">{supplierBusinessName}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-sm text-gray-600 min-w-[120px]">Tên liên hệ:</span>
                <span className="text-sm font-medium text-gray-900">{supplierName}</span>
              </div>
              {supplierEmail && (
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 min-w-[120px]">Email:</span>
                  <span className="text-sm text-gray-900">{supplierEmail}</span>
                </div>
              )}
              {supplierPhone && (
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 min-w-[120px]">Số điện thoại:</span>
                  <span className="text-sm text-gray-900">{supplierPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Suspension Reason (only for suspend action) */}
          {action === 'suspend' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📝</span>
                Lý do đình chỉ
              </h3>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập lý do đình chỉ nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Vi phạm chính sách về chất lượng sản phẩm, gian lận, không tuân thủ quy định..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                {!reason && (
                  <p className="text-xs text-gray-500 mt-1">Vui lòng nhập lý do để tiếp tục</p>
                )}
              </div>

              {/* Common Reasons */}
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Lý do phổ biến:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReason('Vi phạm chính sách về chất lượng sản phẩm')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Vi phạm chất lượng
                  </button>
                  <button
                    type="button"
                    onClick={() => setReason('Không tuân thủ quy định về vệ sinh an toàn thực phẩm')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Vi phạm vệ sinh ATTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setReason('Gian lận thông tin sản phẩm hoặc giá cả')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Gian lận
                  </button>
                  <button
                    type="button"
                    onClick={() => setReason('Nhận quá nhiều khiếu nại từ khách hàng')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Nhiều khiếu nại
                  </button>
                  <button
                    type="button"
                    onClick={() => setReason('Vi phạm chính sách hoạt động của nền tảng')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Vi phạm chính sách
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Warning Note for Suspension */}
          {action === 'suspend' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 text-sm mb-2 flex items-center gap-2">
                <span>⚠️</span>
                Lưu ý khi đình chỉ
              </h4>
              <ul className="space-y-1 text-xs text-orange-800">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600">•</span>
                  <span>Nhà cung cấp sẽ không thể truy cập hệ thống</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600">•</span>
                  <span>Tất cả cửa hàng và sản phẩm sẽ bị ẩn khỏi hệ thống</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600">•</span>
                  <span>Không thể nhận đơn hàng mới</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600">•</span>
                  <span>Cần liên hệ trực tiếp với nhà cung cấp để thông báo</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              if (action === 'suspend') {
                if (!reason.trim()) {
                  alert('Vui lòng nhập lý do đình chỉ nhà cung cấp');
                  return;
                }
                onConfirm(reason);
              } else {
                onConfirm();
              }
            }}
            disabled={action === 'suspend' && !reason.trim()}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonClass}`}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
