import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import supplierService, { type SupplierResponse } from '~/service/supplierService';

export default function PauseOperations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null);
  const [reason, setReason] = useState('');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    fetchSupplier();
  }, []);

  const fetchSupplier = async () => {
    try {
      const data = await supplierService.getCurrentSupplier();
      setSupplier(data);
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
    }
  };

  const handlePause = async () => {
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do tạm dừng');
      return;
    }

    try {
      setLoading(true);
      await supplierService.pauseOperations(reason);
      alert('Đã tạm dừng hoạt động thành công!');
      setShowPauseModal(false);
      setReason('');
      await fetchSupplier();
    } catch (error: any) {
      console.error('Failed to pause operations:', error);
      alert('Lỗi: ' + (error.message || 'Không thể tạm dừng hoạt động'));
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setLoading(true);
      await supplierService.resumeOperations();
      alert('Đã tiếp tục hoạt động thành công!');
      setShowResumeModal(false);
      await fetchSupplier();
    } catch (error: any) {
      console.error('Failed to resume operations:', error);
      alert('Lỗi: ' + (error.message || 'Không thể tiếp tục hoạt động'));
    } finally {
      setLoading(false);
    }
  };

  const isPaused = supplier?.status === 'PAUSE';
  const isSuspended = supplier?.status === 'SUSPENDED';
  const isActive = supplier?.status === 'ACTIVE';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-text mb-6">Quản lý hoạt động kinh doanh</h1>

        {/* Current Status */}
        <div className="card bg-surface shadow-card mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Trạng thái hiện tại</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-text-light">Trạng thái:</span>
              {isActive && (
                <span className="badge badge-success">Đang hoạt động</span>
              )}
              {isPaused && (
                <span className="badge badge-warning">Đã tạm dừng</span>
              )}
              {isSuspended && (
                <span className="badge badge-error">Bị đình chỉ</span>
              )}
            </div>

            {isSuspended && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold">Tài khoản bị đình chỉ</h3>
                  <div className="text-sm">
                    Tài khoản của bạn đã bị admin đình chỉ. Mọi hoạt động bán hàng đã bị khóa.
                    Vui lòng liên hệ admin để được hỗ trợ.
                  </div>
                </div>
              </div>
            )}

            {isPaused && (
              <div className="alert alert-warning mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-bold">Đang tạm dừng hoạt động</h3>
                  <div className="text-sm">
                    • Cửa hàng đã bị ẩn khỏi tìm kiếm công khai<br/>
                    • Không nhận đơn hàng mới<br/>
                    • Vẫn có quyền truy cập backend để chuẩn bị dữ liệu
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="card bg-surface shadow-card">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Hành động</h2>

            {isActive && (
              <div>
                <p className="text-text-light mb-4">
                  Bạn có thể tạm dừng hoạt động kinh doanh nếu cần nghỉ ngơi hoặc chuẩn bị hàng hóa.
                  Trong thời gian tạm dừng, cửa hàng sẽ bị ẩn khỏi tìm kiếm và không nhận đơn mới.
                </p>
                <button
                  onClick={() => setShowPauseModal(true)}
                  className="btn btn-warning"
                  disabled={loading}
                >
                  Tạm dừng hoạt động
                </button>
              </div>
            )}

            {isPaused && (
              <div>
                <p className="text-text-light mb-4">
                  Bạn có thể tiếp tục hoạt động bất cứ lúc nào.
                  Cửa hàng và sản phẩm sẽ được hiển thị trở lại ngay lập tức.
                </p>
                <button
                  onClick={() => setShowResumeModal(true)}
                  className="btn btn-success"
                  disabled={loading}
                >
                  Tiếp tục hoạt động
                </button>
              </div>
            )}

            {isSuspended && (
              <div>
                <p className="text-text-light mb-4">
                  Tài khoản của bạn đã bị đình chỉ bởi admin.
                  Bạn không thể tự gỡ bỏ trạng thái này.
                  Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.
                </p>
                <button className="btn btn-neutral" disabled>
                  Không thể thực hiện hành động
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Xác nhận tạm dừng hoạt động</h3>
            
            <div className="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm">
                Cửa hàng sẽ bị ẩn khỏi tìm kiếm và không nhận đơn mới.
                Bạn vẫn có thể truy cập backend để chuẩn bị dữ liệu.
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Lý do tạm dừng *</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Nhập lý do tạm dừng (ví dụ: chuẩn bị hàng hóa, nghỉ lễ...)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowPauseModal(false);
                  setReason('');
                }}
                className="btn btn-ghost"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handlePause}
                className="btn btn-warning"
                disabled={loading || !reason.trim()}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận tạm dừng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Xác nhận tiếp tục hoạt động</h3>
            
            <div className="alert alert-success mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                Cửa hàng và sản phẩm sẽ được hiển thị trở lại ngay lập tức.
                Bạn sẽ bắt đầu nhận đơn hàng mới.
              </div>
            </div>

            <p className="text-text-light mb-4">
              Bạn có chắc chắn muốn tiếp tục hoạt động kinh doanh?
            </p>

            <div className="modal-action">
              <button
                onClick={() => setShowResumeModal(false)}
                className="btn btn-ghost"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleResume}
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận tiếp tục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
