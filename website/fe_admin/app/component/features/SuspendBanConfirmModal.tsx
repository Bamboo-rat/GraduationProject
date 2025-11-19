import React, { useState, useEffect } from 'react';
import type { ViolationsDiscipline, BehavioralStatistics, EvaluationRecommendation } from '~/service/customerService';
import { 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Shield,
  XCircle,
  Info,
  Calendar
} from 'lucide-react';

interface SuspendBanConfirmModalProps {
  show: boolean;
  action: 'suspend' | 'ban' | 'activate' | null;
  customerName: string;
  violations: ViolationsDiscipline | null;
  statistics: BehavioralStatistics | null;
  recommendation: EvaluationRecommendation | null;
  onConfirm: (reason?: string, durationDays?: number) => void;
  onCancel: () => void;
}

export default function SuspendBanConfirmModal({
  show,
  action,
  customerName,
  violations,
  statistics,
  recommendation,
  onConfirm,
  onCancel,
}: SuspendBanConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [durationDays, setDurationDays] = useState<number | undefined>(undefined);
  const [durationOption, setDurationOption] = useState<'temporary' | 'indefinite'>('temporary');

  // Reset form when modal opens
  useEffect(() => {
    if (show && action === 'suspend') {
      setReason('');
      setDurationDays(7);
      setDurationOption('temporary');
    }
  }, [show, action]);

  if (!show || !action) return null;

  const getActionConfig = () => {
    switch (action) {
      case 'suspend':
        return {
          title: 'Xác nhận tạm khóa tài khoản',
          description: 'Bạn có chắc chắn muốn tạm khóa tài khoản khách hàng này?',
          buttonText: 'Xác nhận tạm khóa',
          buttonClass: 'bg-orange-500 hover:bg-orange-600',
          icon: <Ban className="w-6 h-6" />,
          color: 'orange'
        };
      case 'ban':
        return {
          title: 'Xác nhận cấm tài khoản',
          description: 'Bạn có chắc chắn muốn cấm vĩnh viễn tài khoản khách hàng này?',
          buttonText: 'Xác nhận cấm',
          buttonClass: 'bg-red-500 hover:bg-red-600',
          icon: <Shield className="w-6 h-6" />,
          color: 'red'
        };
      case 'activate':
        return {
          title: 'Xác nhận kích hoạt lại tài khoản',
          description: 'Bạn có chắc chắn muốn kích hoạt lại tài khoản khách hàng này?',
          buttonText: 'Xác nhận kích hoạt',
          buttonClass: 'bg-green-500 hover:bg-green-600',
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'green'
        };
      default:
        return null;
    }
  };

  const config = getActionConfig();
  if (!config) return null;

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Nhẹ', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
      MEDIUM: { label: 'Trung bình', className: 'bg-orange-100 text-orange-800 border border-orange-200' },
      HIGH: { label: 'Nghiêm trọng', className: 'bg-red-100 text-red-800 border border-red-200' },
      CRITICAL: { label: 'Cực kỳ nghiêm trọng', className: 'bg-red-500 text-white border border-red-600' },
    };
    const cfg = severityConfig[severity] || { label: severity, className: 'bg-gray-100 text-gray-800 border border-gray-200' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
  };

  const getRiskScoreBadge = (score: number) => {
    if (score >= 70) return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">Rủi ro cao ({score}/100)</span>;
    if (score >= 50) return <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">Rủi ro trung bình ({score}/100)</span>;
    return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">Rủi ro thấp ({score}/100)</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              config.color === 'orange' ? 'bg-orange-100 text-orange-600' :
              config.color === 'red' ? 'bg-red-100 text-red-600' :
              'bg-green-100 text-green-600'
            }`}>
              {config.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
              <p className="text-sm text-gray-600 mt-1">Khách hàng: <span className="font-medium">{customerName}</span></p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Warning Message */}
          <div className={`p-4 rounded-xl border ${
            config.color === 'orange' ? 'bg-orange-50 border-orange-200' :
            config.color === 'red' ? 'bg-red-50 border-red-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                config.color === 'orange' ? 'text-orange-600' :
                config.color === 'red' ? 'text-red-600' :
                'text-green-600'
              }`} />
              <p className={`text-sm ${
                config.color === 'orange' ? 'text-orange-800' :
                config.color === 'red' ? 'text-red-800' :
                'text-green-800'
              }`}>
                {config.description}
              </p>
            </div>
          </div>

          {/* Behavioral Statistics */}
          {statistics && action !== 'activate' && (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                Thống kê hành vi
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-lg font-bold text-gray-900">{statistics.totalOrders}</div>
                  <div className="text-xs text-gray-600">Tổng đơn</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-lg font-bold text-red-600">{statistics.canceledOrders}</div>
                  <div className="text-xs text-gray-600">Hủy ({statistics.cancellationRate.toFixed(1)}%)</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-600">{statistics.returnedOrders}</div>
                  <div className="text-xs text-gray-600">Trả ({statistics.returnRate.toFixed(1)}%)</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-600">{statistics.totalReviews}</div>
                  <div className="text-xs text-gray-600">Đánh giá</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Điểm rủi ro:</span>
                {getRiskScoreBadge(statistics.riskScore)}
              </div>
            </div>
          )}

          {/* Violations Summary */}
          {violations && violations.totalViolations > 0 && action !== 'activate' && (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Tổng quan vi phạm
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-lg font-bold text-red-600">{violations.totalViolations}</div>
                  <div className="text-xs text-gray-600">Tổng vi phạm</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-600">{violations.activeWarningsCount}</div>
                  <div className="text-xs text-gray-600">Cảnh báo</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-lg font-bold text-purple-600">{violations.totalSuspensions}</div>
                  <div className="text-xs text-gray-600">Lịch sử khóa</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-lg font-bold text-gray-900">{violations.violationPoints}</div>
                  <div className="text-xs text-gray-600">Điểm vi phạm</div>
                </div>
              </div>

              {/* Recent Violations */}
              {violations.violationHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 text-sm mb-2">Vi phạm gần đây</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {violations.violationHistory.slice(0, 5).map((violation) => (
                      <div key={violation.recordId} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(violation.severity)}
                            <span className="text-sm font-medium text-gray-700">{violation.violationType}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(violation.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{violation.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Hành động:</span>
                          <span className="text-xs font-medium text-gray-700">{violation.actionTaken}</span>
                          {violation.isResolved ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Đã giải quyết
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Chưa giải quyết
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risk Factors & Positive Factors */}
          {recommendation && action !== 'activate' && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Risk Factors */}
              {recommendation.riskFactors.length > 0 && (
                <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <h4 className="font-medium text-red-900 text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Yếu tố rủi ro ({recommendation.riskFactors.length})
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.riskFactors.map((factor, index) => (
                      <li key={index} className="text-xs text-red-800 flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Positive Factors */}
              {recommendation.positiveFactors.length > 0 && (
                <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                  <h4 className="font-medium text-green-900 text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Yếu tố tích cực ({recommendation.positiveFactors.length})
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.positiveFactors.map((factor, index) => (
                      <li key={index} className="text-xs text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Suspension Form (only for suspend action) */}
          {action === 'suspend' && (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-600" />
                Thông tin khóa tài khoản
              </h3>

              {/* Reason Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do khóa tài khoản <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do khóa tài khoản..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
                {!reason && (
                  <p className="text-xs text-gray-500 mt-1">Vui lòng nhập lý do để tiếp tục</p>
                )}
              </div>

              {/* Duration Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian khóa
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="temporary"
                      name="duration"
                      checked={durationOption === 'temporary'}
                      onChange={() => {
                        setDurationOption('temporary');
                        setDurationDays(7);
                      }}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                    />
                    <label htmlFor="temporary" className="ml-3 block text-sm text-gray-700">
                      Tạm thời
                    </label>
                  </div>
                  {durationOption === 'temporary' && (
                    <div className="ml-7 flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={durationDays || ''}
                        onChange={(e) => setDurationDays(parseInt(e.target.value) || undefined)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Số ngày"
                      />
                      <span className="text-sm text-gray-600">ngày</span>
                      <div className="flex gap-1">
                        {[7, 30, 90].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setDurationDays(days)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              durationDays === days 
                                ? 'bg-orange-500 text-white border-orange-500' 
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {days} ngày
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="indefinite"
                      name="duration"
                      checked={durationOption === 'indefinite'}
                      onChange={() => {
                        setDurationOption('indefinite');
                        setDurationDays(undefined);
                      }}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                    />
                    <label htmlFor="indefinite" className="ml-3 block text-sm text-gray-700">
                      Vô thời hạn
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
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
                  alert('Vui lòng nhập lý do khóa tài khoản');
                  return;
                }
                onConfirm(reason, durationOption === 'temporary' ? durationDays : undefined);
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