import { useEffect, useState } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import systemConfigService, { type SystemConfigResponse } from '~/service/systemConfigService';
import * as Icons from 'lucide-react';

interface ConfigGroup {
  title: string;
  icon: string;
  configs: SystemConfigResponse[];
}

export default function SystemSettings() {
  const [configs, setConfigs] = useState<SystemConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadConfigs();
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  // Group configs by category
  const groupedConfigs: ConfigGroup[] = [
    {
      title: 'Điểm thưởng & Tích lũy',
      icon: 'gift',
      configs: configs.filter((c) => c.configKey.startsWith('points.')),
    },
    {
      title: 'Hạng thành viên',
      icon: 'award',
      configs: configs.filter((c) => c.configKey.startsWith('tier.')),
    },
    {
      title: 'Hoa hồng',
      icon: 'percent',
      configs: configs.filter((c) => c.configKey.startsWith('commission.')),
    },
    {
      title: 'Đơn hàng',
      icon: 'shopping-cart',
      configs: configs.filter((c) => c.configKey.startsWith('order.')),
    },
    {
      title: 'Ví điện tử',
      icon: 'wallet',
      configs: configs.filter((c) => c.configKey.startsWith('wallet.')),
    },
    {
      title: 'Khuyến mãi',
      icon: 'tag',
      configs: configs.filter((c) => c.configKey.startsWith('promotion.')),
    },
    {
      title: 'Tính năng hệ thống',
      icon: 'toggle-left',
      configs: configs.filter((c) => c.configKey.startsWith('feature.')),
    },
    {
      title: 'Bảo trì & Hỗ trợ',
      icon: 'settings',
      configs: configs.filter(
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
      // For percentage values (0.05 = 5%)
      if (config.configKey.includes('percentage') || config.configKey.includes('rate')) {
        const percentage = parseFloat(config.configValue) * 100;
        return `${percentage}%`;
      }
      // For currency values
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
            <div className="text-gray-500">Đang tải...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] rounded-xl flex items-center justify-center">
              <Icons.Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cấu hình Hệ thống</h1>
              <p className="text-sm text-gray-600">Quản lý các thông số cấu hình của hệ thống</p>
            </div>
          </div>
        </div>

        {/* Config Groups */}
        <div className="space-y-6">
          {groupedConfigs
            .filter((group) => group.configs.length > 0)
            .map((group) => (
              <div key={group.title} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Icons.Settings className="w-5 h-5 text-[#A4C3A2]" />
                  <h2 className="text-lg font-semibold text-gray-800">{group.title}</h2>
                </div>

                <div className="space-y-3">
                  {group.configs.map((config) => (
                    <div
                      key={config.configKey}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {config.configKey}
                            </code>
                            {config.isPublic && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Public
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{config.description}</p>

                          {editingKey === config.configKey ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
                              />
                              <button
                                onClick={() => handleSave(config.configKey)}
                                disabled={saving}
                                className="px-4 py-2 bg-[#A4C3A2] text-white rounded-lg hover:bg-[#8FB491] disabled:opacity-50"
                              >
                                {saving ? 'Đang lưu...' : 'Lưu'}
                              </button>
                              <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-900">
                                {formatValue(config)}
                              </span>
                              <button
                                onClick={() => handleEdit(config)}
                                className="text-[#A4C3A2] hover:text-[#2F855A] text-sm font-medium"
                              >
                                Chỉnh sửa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Cập nhật lần cuối: {new Date(config.updatedAt).toLocaleString('vi-VN')}
                        {config.updatedBy && ` bởi ${config.updatedBy}`}
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
