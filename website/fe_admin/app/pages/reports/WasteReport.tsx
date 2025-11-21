import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import reportService from '~/service/reportService';
import type { WasteSummary, WasteBySupplier } from '~/service/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Package, TrendingUp, AlertTriangle, Store, Calendar, Filter, Percent, Archive } from 'lucide-react';

export default function WasteReportNew() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [supplierData, setSupplierData] = useState<WasteBySupplier[]>([]);
  const [period, setPeriod] = useState<'7days' | '30days' | 'thisMonth'>('30days');

  useEffect(() => {
    fetchData();
  }, [period]);

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setDate(1); // First day of current month
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const [summaryRes, supplierRes] = await Promise.all([
        reportService.getWasteSummary(startDate, endDate),
        reportService.getWasteBySupplier(startDate, endDate)
      ]);
      
      setSummary(summaryRes);
      setSupplierData(supplierRes);
    } catch (err) {
      console.error('Error fetching waste data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const blob = await reportService.exportWasteReport(startDate, endDate);
      reportService.downloadFile(blob, `waste-report-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      alert('Không thể xuất báo cáo');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A] mb-4"></div>
            <p className="text-gray-600">Đang tải báo cáo...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalInitial = summary?.initialStockQuantity ?? summary?.totalStockQuantity ?? 0;
  const currentStock = summary?.currentStockQuantity ?? ((summary?.unsoldQuantity || 0) + (summary?.expiredQuantity || 0));
  const totalSold = summary?.soldQuantity || 0;
  const totalExpired = summary?.expiredQuantity || 0;
  const totalRemaining = summary?.unsoldQuantity || 0;

  // Calculate rates
  const sellThroughRate = totalInitial > 0 ? (totalSold / totalInitial) * 100 : 0;
  const expiryRate = totalInitial > 0 ? (totalExpired / totalInitial) * 100 : 0;
  const remainingRate = totalInitial > 0 ? (totalRemaining / totalInitial) * 100 : 0;

  const platformAvgWasteRate = expiryRate;

  const topWasteStores = supplierData
    .map(s => ({
      ...s,
      calculatedExpiryRate: (s.initialStockQuantity ?? s.totalStockQuantity ?? 0) > 0
        ? ((s.expiredQuantity || 0) / (s.initialStockQuantity ?? s.totalStockQuantity ?? 0)) * 100
        : 0
    }))
    .sort((a, b) => b.calculatedExpiryRate - a.calculatedExpiryRate)
    .slice(0, 5);

  // Color definitions - Pastel colors
  const colors = {
    sold: {
      bg: 'bg-[#E8FFED]',
      text: 'text-[#2F855A]',
      border: 'border-[#B7E4C7]',
      icon: 'text-[#2F855A]'
    },
    expired: {
      bg: 'bg-[#FFE8E8]',
      text: 'text-[#E63946]',
      border: 'border-[#FFC7C7]',
      icon: 'text-[#E63946]'
    },
    remaining: {
      bg: 'bg-[#FFF3E8]',
      text: 'text-[#FF6B35]',
      border: 'border-[#FFD8C7]',
      icon: 'text-[#FF6B35]'
    },
    stock: {
      bg: 'bg-[#E8F4FF]',
      text: 'text-[#2D2D2D]',
      border: 'border-[#C7E0FF]',
      icon: 'text-[#2D2D2D]'
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="heading-primary">Báo cáo lãng phí</h1>
            <p className="text-muted">Theo dõi hiệu quả bán hàng và giảm thiểu lãng phí</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="input-field pl-10 pr-4 appearance-none"
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="thisMonth">Tháng này</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              className="btn-primary"
            >
              <Download className="w-4 h-4" />
              Xuất CSV
            </button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Stock */}
          <div className={`card p-6 ${colors.stock.bg} ${colors.stock.border} border-2`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-white/50`}>
                <Package className={`w-6 h-6 ${colors.stock.icon}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{currentStock.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Tồn kho hiện tại</p>
                <p className="text-xs text-gray-500 mt-1">Ban đầu: {totalInitial.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Sold */}
          <div className={`card p-6 ${colors.sold.bg} ${colors.sold.border} border-2`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-white/50`}>
                <TrendingUp className={`w-6 h-6 ${colors.sold.icon}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${colors.sold.text}`}>{totalSold.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Đã bán</p>
                <p className={`text-xs ${colors.sold.text} mt-1`}>{sellThroughRate.toFixed(1)}% sell-through</p>
              </div>
            </div>
          </div>

          {/* Remaining */}
          <div className={`card p-6 ${colors.remaining.bg} ${colors.remaining.border} border-2`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-white/50`}>
                <Archive className={`w-6 h-6 ${colors.remaining.icon}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${colors.remaining.text}`}>{totalRemaining.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Tồn kho</p>
                <p className={`text-xs ${colors.remaining.text} mt-1`}>{remainingRate.toFixed(1)}% chưa bán</p>
              </div>
            </div>
          </div>

          {/* Expired */}
          <div className={`card p-6 ${colors.expired.bg} ${colors.expired.border} border-2`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-white/50`}>
                <AlertTriangle className={`w-6 h-6 ${colors.expired.icon}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${colors.expired.text}`}>{totalExpired.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Đã hết hạn</p>
                <p className={`text-xs ${colors.expired.text} mt-1`}>{expiryRate.toFixed(1)}% lãng phí</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="bg-[#E8F4FF] p-3 rounded-lg">
              <Percent className="w-6 h-6 text-[#2D2D2D]" />
            </div>
            <div className="flex-1">
              <h3 className="heading-secondary">Định nghĩa chỉ số</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sell-Through Rate */}
                <div className={`p-4 rounded-xl border-2 ${colors.sold.border} ${colors.sold.bg}`}>
                  <p className="font-semibold text-gray-800 mb-2">Sell-Through Rate</p>
                  <p className="text-sm text-gray-600 mb-3">Đã bán / Tổng tồn kho ban đầu</p>
                  <p className={`text-lg font-bold ${colors.sold.text}`}>{sellThroughRate.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-2">Từ đơn hàng DELIVERED</p>
                </div>

                {/* Expiry Rate */}
                <div className={`p-4 rounded-xl border-2 ${colors.expired.border} ${colors.expired.bg}`}>
                  <p className="font-semibold text-gray-800 mb-2">Expiry Rate (Waste)</p>
                  <p className="text-sm text-gray-600 mb-3">Hết hạn / Tổng tồn kho ban đầu</p>
                  <p className={`text-lg font-bold ${colors.expired.text}`}>{expiryRate.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-2">Sản phẩm EXPIRED</p>
                </div>

                {/* Remaining Rate */}
                <div className={`p-4 rounded-xl border-2 ${colors.remaining.border} ${colors.remaining.bg}`}>
                  <p className="font-semibold text-gray-800 mb-2">Remaining Rate</p>
                  <p className="text-sm text-gray-600 mb-3">Tồn kho / Tổng tồn kho ban đầu</p>
                  <p className={`text-lg font-bold ${colors.remaining.text}`}>{remainingRate.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-2">Sản phẩm ACTIVE</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Average */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[#E8F4FF] p-3 rounded-lg">
                <Store className="w-6 h-6 text-[#2D2D2D]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{platformAvgWasteRate.toFixed(1)}%</h3>
                <p className="text-gray-600">Tỉ lệ lãng phí trung bình toàn nền tảng</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Từ {supplierData.length} nhà cung cấp</p>
              <p className="text-xs text-gray-400 mt-1">Cập nhật: {new Date().toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>

        {/* Top 5 Waste Stores */}
        <div className="card p-6">
          <h2 className="heading-secondary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Top 5 cửa hàng có tỉ lệ lãng phí cao nhất
          </h2>
          <div className="space-y-4">
            {topWasteStores.map((store, index) => {
              const initialStock = store.initialStockQuantity ?? store.totalStockQuantity ?? 0;
              const currentStock = store.currentStockQuantity ?? (store.unsoldQuantity ?? 0);
              const sold = store.soldQuantity ?? 0;
              const expired = store.expiredQuantity ?? 0;

              const storeSellThrough = initialStock > 0 ? (sold / initialStock) * 100 : 0;
              const storeExpiryRate = initialStock > 0 ? (expired / initialStock) * 100 : 0;
              
              return (
                <div 
                  key={store.supplierId} 
                  className="flex items-center justify-between p-4 bg-surface-light rounded-lg hover:bg-surface transition-colors card-hover"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-sm
                      ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-amber-400' : 'bg-gray-400'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      {store.avatarUrl && (
                        <img 
                          src={store.avatarUrl} 
                          alt={store.supplierName}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{store.supplierName}</p>
                        <p className="text-sm text-gray-500">{store.totalStores} cửa hàng • Sell-through: {storeSellThrough.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tồn kho ban đầu</p>
                      <p className="font-semibold text-gray-900">{initialStock.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tồn kho hiện tại</p>
                      <p className="font-semibold text-blue-600">{currentStock.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Đã bán</p>
                      <p className={`font-semibold ${colors.sold.text}`}>{sold.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Hết hạn</p>
                      <p className={`font-semibold ${colors.expired.text}`}>{expired.toLocaleString()}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-xs text-gray-500 mb-1">Expiry Rate</p>
                      <p className={`text-lg font-bold ${colors.expired.text}`}>{storeExpiryRate.toFixed(1)}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${colors.expired.bg.replace('bg-', 'bg-')}`}
                          style={{ width: `${Math.min(storeExpiryRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Stores Waste Rate Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-default bg-surface-light">
            <h2 className="heading-secondary flex items-center gap-2">
              <Store className="w-5 h-5 text-[#2F855A]" />
              Tỉ lệ lãng phí theo cửa hàng
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cửa hàng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho ban đầu</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho hiện tại</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đã bán</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hết hạn</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sell-Through</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplierData.map((store) => {
                  const initialStock = store.initialStockQuantity ?? store.totalStockQuantity ?? 0;
                  const currentStock = store.currentStockQuantity ?? (store.unsoldQuantity ?? 0);
                  const sold = store.soldQuantity ?? 0;
                  const expired = store.expiredQuantity ?? 0;

                  const sellThrough = initialStock > 0 ? (sold / initialStock) * 100 : 0;
                  const expiryRate = initialStock > 0 ? (expired / initialStock) * 100 : 0;

                  return (
                    <tr key={store.supplierId} className="hover:bg-surface-light transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {store.avatarUrl && (
                            <img 
                              src={store.avatarUrl} 
                              alt={store.supplierName}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{store.supplierName}</p>
                            <p className="text-xs text-gray-500">{store.totalStores} cửa hàng</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-900">{initialStock.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-blue-600">{currentStock.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-medium ${colors.sold.text}`}>{sold.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-medium ${colors.expired.text}`}>{expired.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-semibold ${colors.sold.text}`}>
                            {sellThrough.toFixed(1)}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${colors.sold.bg.replace('bg-', 'bg-')}`}
                              style={{ width: `${Math.min(sellThrough, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-semibold ${colors.expired.text}`}>
                            {expiryRate.toFixed(1)}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${colors.expired.bg.replace('bg-', 'bg-')}`}
                              style={{ width: `${Math.min(expiryRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}