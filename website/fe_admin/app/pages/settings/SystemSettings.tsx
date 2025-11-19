import { useEffect, useState } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import systemConfigService, { type SystemConfigResponse } from '~/service/systemConfigService';
import * as Icons from 'lucide-react';
import { usePermissions } from '~/hooks/usePermissions';

interface ConfigGroup {
  title: string;
  icon: string;
  configs: SystemConfigResponse[];
}

export default function SystemSettings() {
  const { can } = usePermissions();
  const [configs, setConfigs] = useState<SystemConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // State for key settings
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [pointsPercentage, setPointsPercentage] = useState<number>(5);
  const [editingCommission, setEditingCommission] = useState(false);
  const [editingPoints, setEditingPoints] = useState(false);
  const [tempCommission, setTempCommission] = useState<string>('10');
  const [tempPoints, setTempPoints] = useState<string>('5');
  const [showCommissionWarning, setShowCommissionWarning] = useState(false);

  useEffect(() => {
    loadConfigs();
    loadKeySettings();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await systemConfigService.getAllConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
      showToast('Không thể tải cấu hình hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadKeySettings = async () => {
    try {
      const [commission, points] = await Promise.all([
        systemConfigService.getCommissionRate(),
        systemConfigService.getPointsPercentage(),
      ]);
      setCommissionRate(commission);
      setPointsPercentage(points);
      setTempCommission(commission.toString());
      setTempPoints(points.toString());
    } catch (error) {
      console.error('Error loading key settings:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateCommission = async () => {
    const value = parseFloat(tempCommission);
    if (isNaN(value) || value < 0 || value > 100) {
      showToast('Tỷ lệ hoa hồng phải từ 0-100%', 'error');
      return;
    }
    setShowCommissionWarning(true);
  };

  const confirmUpdateCommission = async () => {
    try {
      setSaving(true);
      setShowCommissionWarning(false);
      const value = parseFloat(tempCommission);
      await systemConfigService.updateCommissionRate(value);
      setCommissionRate(value);
      setEditingCommission(false);
      showToast('Cập nhật tỷ lệ hoa hồng thành công', 'success');
      loadConfigs();
    } catch (error: any) {
      console.error('Error updating commission:', error);
      showToast(error.response?.data?.message || 'Không thể cập nhật tỷ lệ hoa hồng', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePoints = async () => {
    const value = parseFloat(tempPoints);
    if (isNaN(value) || value < 0 || value > 100) {
      showToast('Tỷ lệ tích điểm phải từ 0-100%', 'error');
      return;
    }

    try {
      setSaving(true);
      await systemConfigService.updatePointsPercentage(value);
      setPointsPercentage(value);
      setEditingPoints(false);
      showToast('Cập nhật tỷ lệ tích điểm thành công', 'success');
      loadConfigs();
    } catch (error: any) {
      console.error('Error updating points:', error);
      showToast(error.response?.data?.message || 'Không thể cập nhật tỷ lệ tích điểm', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (config: SystemConfigResponse) => {
    setEditingKey(config.configKey);
    setEditValue(config.configValue);
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      await systemConfigService.updateConfig(key, {
        configKey: key,
        configValue: editValue,
      });
      showToast('Cập nhật cấu hình thành công', 'success');
      setEditingKey(null);
      loadConfigs();
    } catch (error) {
      console.error('Error updating config:', error);
      showToast('Không thể cập nhật cấu hình', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // Filter out commission and points configs from the list (they're shown in cards)
  const filteredConfigs = configs.filter(
    (c) => c.configKey !== 'partner.commission.rate' && c.configKey !== 'points.percentage.per.order'
  );

  // Group configs by category
  const groupedConfigs: ConfigGroup[] = [
    {
      title: 'Điểm thưởng & Tích lũy',
      icon: 'gift',
      configs: filteredConfigs.filter((c) => c.configKey.startsWith('points.')),
    },
    {
      title: 'Hạng thành viên',
      icon: 'award',
      configs: filteredConfigs.filter((c) => c.configKey.startsWith('tier.')),
    },
    {
      title: 'Hoa hồng',
      icon: 'percent',
      configs: filteredConfigs.filter((c) => c.configKey.startsWith('commission.')),
    },
    {
      title: 'Đơn hàng',
      icon: 'shopping-cart',
      configs: filteredConfigs.filter((c) => c.configKey.startsWith('order.')),
    },
    {
      title: 'Ví điện tử',
      icon: 'wallet',
      configs: filteredConfigs.filter((c) => c.configKey.startsWith('wallet.')),
    },
    {
      title: 'Khuyến mãi',
      icon: 'tag',
      configs: filteredConfigs.filter((c) => c.configKey.startsWith('promotion.')),
    },
    {
      title: 'Tính năng hệ thống',
      icon: 'toggle-left',
      configs: filteredConfigs.filter((c) => c.configKey.startsWith('feature.')),
    },
    {
      title: 'Bảo trì & Hỗ trợ',
      icon: 'settings',
      configs: filteredConfigs.filter(
        (c) =>
          c.configKey.startsWith('maintenance.') ||
          c.configKey.startsWith('support.') ||
          c.configKey.startsWith('business.')
      ),
    },
  ];

  const formatValue = (config: SystemConfigResponse) => {
    if (config.valueType === 'BOOLEAN') {
      return config.configValue === 'true' ? 'Bật' : 'Tắt';
    }
    if (config.valueType === 'NUMBER') {
      if (config.configKey.includes('percentage') || config.configKey.includes('rate')) {
        const percentage = parseFloat(config.configValue) * 100;
        return `${percentage}%`;
      }
      if (config.configKey.includes('amount') || config.configKey.includes('withdrawal')) {
        return new Intl.NumberFormat('vi-VN').format(parseFloat(config.configValue)) + ' VNĐ';
      }
    }
    return config.configValue;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4C3A2]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
              toast.type === 'success' ? 'bg-[#A4C3A2]' : 'bg-red-500'
            } text-white animate-slide-in`}
          >
            {toast.type === 'success' ? (
              <Icons.CheckCircle className="w-5 h-5" />
            ) : (
              <Icons.AlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Confirmation Modal for Commission Rate */}
        {showCommissionWarning && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Icons.AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Xác nhận thay đổi</h3>
                  <p className="text-sm text-gray-600">Hành động này ảnh hưởng đến tất cả nhà cung cấp</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Bạn đang thay đổi tỷ lệ hoa hồng từ{' '}
                  <span className="font-bold text-yellow-700">{commissionRate}%</span> sang{' '}
                  <span className="font-bold text-yellow-700">{tempCommission}%</span>
                </p>
                <p className="text-sm text-gray-600">
                  Thay đổi này sẽ được đồng bộ tự động đến tất cả nhà cung cấp trong hệ thống.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCommissionWarning(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmUpdateCommission}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#A4C3A2] text-white rounded-lg hover:bg-[#8FB491] disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cấu hình Hệ thống</h1>
          <p className="text-gray-600">Quản lý các thông số cấu hình quan trọng của hệ thống</p>
        </div>

        {/* Key Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Commission Rate Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-[#A4C3A2] rounded-lg flex items-center justify-center">
                <Icons.Percent className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Hoa hồng Đối tác</h3>
                <p className="text-sm text-gray-600">Tỷ lệ hoa hồng cho nhà cung cấp</p>
              </div>
            </div>

            {editingCommission ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    value={tempCommission}
                    onChange={(e) => setTempCommission(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A4C3A2] focus:border-transparent"
                    placeholder="0.0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    %
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateCommission}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#A4C3A2] text-white rounded-lg hover:bg-[#8FB491] disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCommission(false);
                      setTempCommission(commissionRate.toString());
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800 mb-4">{commissionRate}%</div>
                {can('settings.update') && (
                  <button
                    onClick={() => setEditingCommission(true)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center"
                  >
                    <Icons.Edit2 className="w-4 h-4 mr-2" />
                    Thay đổi tỷ lệ
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Points Percentage Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-[#A4C3A2] rounded-lg flex items-center justify-center">
                <Icons.Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Tích điểm Khách hàng</h3>
                <p className="text-sm text-gray-600">Tỷ lệ tích điểm cho mỗi đơn hàng</p>
              </div>
            </div>

            {editingPoints ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    value={tempPoints}
                    onChange={(e) => setTempPoints(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A4C3A2] focus:border-transparent"
                    placeholder="0.0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    %
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdatePoints}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#A4C3A2] text-white rounded-lg hover:bg-[#8FB491] disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPoints(false);
                      setTempPoints(pointsPercentage.toString());
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800 mb-4">{pointsPercentage}%</div>
                {can('settings.update') && (
                  <button
                    onClick={() => setEditingPoints(true)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center"
                  >
                    <Icons.Edit2 className="w-4 h-4 mr-2" />
                    Thay đổi tỷ lệ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Other Config Groups */}
        <div className="space-y-6">
          {groupedConfigs
            .filter((group) => group.configs.length > 0)
            .map((group) => (
              <div key={group.title} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-[#A4C3A2] rounded-lg flex items-center justify-center">
                    <Icons.Settings className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{group.title}</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {group.configs.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.configs.map((config) => (
                    <div
                      key={config.configKey}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#A4C3A2] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">{config.description}</span>
                        {config.isPublic && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Public
                          </span>
                        )}
                      </div>

                      <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded block mb-3">
                        {config.configKey}
                      </code>

                      {editingKey === config.configKey ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#A4C3A2] text-sm"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(config.configKey)}
                              disabled={saving}
                              className="flex-1 px-3 py-1 bg-[#A4C3A2] text-white rounded text-sm hover:bg-[#8FB491] disabled:opacity-50"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">
                            {formatValue(config)}
                          </span>
                          {can('settings.update') && (
                            <button
                              onClick={() => handleEdit(config)}
                              className="text-[#A4C3A2] hover:text-[#8FB491] p-1 rounded"
                            >
                              <Icons.Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(config.updatedAt).toLocaleString('vi-VN')}
                        {config.updatedBy && ` • ${config.updatedBy}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
}