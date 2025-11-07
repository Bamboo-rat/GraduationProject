import React from 'react';
import type { ViolationsDiscipline, BehavioralStatistics, EvaluationRecommendation } from '~/service/customerService';

interface SuspendBanConfirmModalProps {
  show: boolean;
  action: 'suspend' | 'ban' | 'activate' | null;
  customerName: string;
  violations: ViolationsDiscipline | null;
  statistics: BehavioralStatistics | null;
  recommendation: EvaluationRecommendation | null;
  onConfirm: () => void;
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
  if (!show || !action) return null;

  const getActionConfig = () => {
    switch (action) {
      case 'suspend':
        return {
          title: 'Xác nhận tạm khóa tài khoản',
          description: 'Bạn có chắc chắn muốn tạm khóa tài khoản khách hàng này?',
          buttonText: 'Xác nhận tạm khóa',
          buttonClass: 'bg-orange-600 hover:bg-orange-700',
          icon: '⚠️',
        };
      case 'ban':
        return {
          title: 'Xác nhận cấm tài khoản',
          description: 'Bạn có chắc chắn muốn cấm vĩnh viễn tài khoản khách hàng này?',
          buttonText: 'Xác nhận cấm',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          icon: '🚫',
        };
      case 'activate':
        return {
          title: 'Xác nhận kích hoạt lại tài khoản',
          description: 'Bạn có chắc chắn muốn kích hoạt lại tài khoản khách hàng này?',
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

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Nhẹ', className: 'bg-yellow-100 text-yellow-800' },
      MEDIUM: { label: 'Trung bình', className: 'bg-orange-100 text-orange-800' },
      HIGH: { label: 'Nghiêm trọng', className: 'bg-red-100 text-red-800' },
      CRITICAL: { label: 'Cực kỳ nghiêm trọng', className: 'bg-red-600 text-white' },
    };
    const cfg = severityConfig[severity] || { label: severity, className: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
  };

  const getRiskScoreBadge = (score: number) => {
    if (score >= 70) return <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">Rủi ro cao ({score}/100)</span>;
    if (score >= 50) return <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800">Rủi ro trung bình ({score}/100)</span>;
    return <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">Rủi ro thấp ({score}/100)</span>;
  };

  const getRecommendationBadge = (rec: string) => {
    const recConfig: Record<string, { label: string; className: string }> = {
      ALLOW: { label: 'Cho phép', className: 'bg-green-100 text-green-800' },
      WARN: { label: 'Cảnh báo', className: 'bg-yellow-100 text-yellow-800' },
      SUSPEND: { label: 'Tạm khóa', className: 'bg-orange-100 text-orange-800' },
      BAN: { label: 'Cấm', className: 'bg-red-100 text-red-800' },
    };
    const cfg = recConfig[rec] || { label: rec, className: 'bg-gray-100 text-gray-800' };
    return <span className={`px-3 py-1 rounded-full text-sm font-bold ${cfg.className}`}>{cfg.label}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
              <p className="text-sm text-gray-600 mt-1">Khách hàng: <span className="font-semibold">{customerName}</span></p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Warning Message */}
          <div className={`p-4 rounded-lg ${action === 'ban' ? 'bg-red-50 border border-red-200' : action === 'suspend' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <p className={`text-sm ${action === 'ban' ? 'text-red-800' : action === 'suspend' ? 'text-orange-800' : 'text-green-800'}`}>
              {config.description}
            </p>
          </div>

          {/* AI Recommendation */}
          {recommendation && action !== 'activate' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🤖</span>
                Khuyến nghị của hệ thống
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Khuyến nghị:</span>
                  {getRecommendationBadge(recommendation.recommendation)}
                  <span className="text-xs text-gray-500">Độ tin cậy: {recommendation.confidenceScore}%</span>
                </div>
                <p className="text-sm text-gray-700">{recommendation.reason}</p>
              </div>
            </div>
          )}

          {/* Behavioral Statistics */}
          {statistics && action !== 'activate' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Thống kê hành vi
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</div>
                  <div className="text-xs text-gray-600">Tổng đơn hàng</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{statistics.canceledOrders}</div>
                  <div className="text-xs text-gray-600">Đơn hủy ({statistics.cancellationRate.toFixed(1)}%)</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">{statistics.returnedOrders}</div>
                  <div className="text-xs text-gray-600">Đơn trả ({statistics.returnRate.toFixed(1)}%)</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalReviews}</div>
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
          {violations && action !== 'activate' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Tổng quan vi phạm
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{violations.totalViolations}</div>
                  <div className="text-xs text-gray-600">Tổng vi phạm</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">{violations.activeWarningsCount}</div>
                  <div className="text-xs text-gray-600">Cảnh báo hiện tại</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{violations.totalSuspensions}</div>
                  <div className="text-xs text-gray-600">Lịch sử khóa</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{violations.violationPoints}</div>
                  <div className="text-xs text-gray-600">Điểm vi phạm</div>
                </div>
              </div>

              {/* Recent Violations */}
              {violations.violationHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Vi phạm gần đây (5 mới nhất)</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {violations.violationHistory.slice(0, 5).map((violation) => (
                      <div key={violation.recordId} className="bg-gray-50 p-3 rounded border border-gray-200">
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
                            <span className="text-xs text-green-600">✓ Đã giải quyết</span>
                          ) : (
                            <span className="text-xs text-red-600">● Chưa giải quyết</span>
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
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-semibold text-red-900 text-sm mb-2 flex items-center gap-2">
                    <span>⛔</span>
                    Yếu tố rủi ro ({recommendation.riskFactors.length})
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.riskFactors.map((factor, index) => (
                      <li key={index} className="text-xs text-red-800 flex items-start gap-2">
                        <span className="text-red-600">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Positive Factors */}
              {recommendation.positiveFactors.length > 0 && (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="font-semibold text-green-900 text-sm mb-2 flex items-center gap-2">
                    <span>✅</span>
                    Yếu tố tích cực ({recommendation.positiveFactors.length})
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.positiveFactors.map((factor, index) => (
                      <li key={index} className="text-xs text-green-800 flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
            onClick={onConfirm}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${config.buttonClass}`}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
