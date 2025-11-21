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


  const totalInitial = summary?.initialStockQuantity ?? summary?.totalStockQuantity ?? 0; // Tổng tồn kho ban đầu
  const currentStock = summary?.currentStockQuantity ?? ((summary?.unsoldQuantity || 0) + (summary?.expiredQuantity || 0));
  const totalSold = summary?.soldQuantity || 0; // Từ đơn hàng DELIVERED
  const totalExpired = summary?.expiredQuantity || 0; // Sản phẩm hết hạn
  const totalRemaining = summary?.unsoldQuantity || 0; // Sản phẩm ACTIVE

  // Calculate rates dựa trên tồn kho ban đầu
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo cáo lãng phí</h1>
            <p className="text-gray-600">Theo dõi hiệu quả bán hàng và giảm thiểu lãng phí</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F855A] focus:border-transparent appearance-none bg-white"
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="thisMonth">Tháng này</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-[#2F855A] text-white rounded-lg hover:bg-[#276749] transition-colors flex items-center gap-2 font-medium"
            >
              <Download className="w-4 h-4" />
              Xuất CSV
            </button>
          </div>
        </div>

        {/* Main Metrics - Mô hình SaveFood */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{currentStock.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Tồn kho hiện tại</p>
                <p className="text-xs text-gray-400 mt-1">Tổng tồn kho ban đầu: {totalInitial.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600">{totalSold.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Đã bán</p>
                <p className="text-xs text-green-600 mt-1">{sellThroughRate.toFixed(1)}% sell-through</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-lg">
                <Archive className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-amber-600">{totalRemaining.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Tồn kho</p>
                <p className="text-xs text-amber-600 mt-1">{remainingRate.toFixed(1)}% chưa bán</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-600">{totalExpired.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Đã hết hạn</p>
                <p className="text-xs text-red-600 mt-1">{expiryRate.toFixed(1)}% lãng phí</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Percent className="w-6 h-6 text-blue-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-3">Định nghĩa chỉ số</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/60 rounded-lg p-3">
                  <p className="font-semibold text-gray-800 mb-1">Sell-Through Rate</p>
                  <p className="text-gray-600">Đã bán / Tổng tồn kho ban đầu</p>
                  <p className="text-green-600 font-bold mt-1">{sellThroughRate.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Từ đơn hàng DELIVERED</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <p className="font-semibold text-gray-800 mb-1">Expiry Rate (Waste)</p>
                  <p className="text-gray-600">Hết hạn / Tổng tồn kho ban đầu</p>
                  <p className="text-red-600 font-bold mt-1">{expiryRate.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Sản phẩm EXPIRED</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <p className="font-semibold text-gray-800 mb-1">Remaining Rate</p>
                  <p className="text-gray-600">Tồn kho / Tổng tồn kho ban đầu</p>
                  <p className="text-amber-600 font-bold mt-1">{remainingRate.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Sản phẩm ACTIVE</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Average */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <Store className="w-6 h-6 text-purple-600" />
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                      <p className="font-semibold text-green-600">{sold.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Hết hạn</p>
                      <p className="font-semibold text-red-600">{expired.toLocaleString()}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-xs text-gray-500 mb-1">Expiry Rate</p>
                      <p className="text-lg font-bold text-red-600">{storeExpiryRate.toFixed(1)}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full transition-all"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#2F855A]" />
              Tỉ lệ lãng phí theo cửa hàng
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
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
                    <tr key={store.supplierId} className="hover:bg-gray-50 transition-colors">
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
                        <span className="font-medium text-green-600">{sold.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-red-600">{expired.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-semibold ${
                            sellThrough >= 80 ? 'text-green-600' : 
                            sellThrough >= 50 ? 'text-amber-600' : 
                            'text-red-600'
                          }`}>
                            {sellThrough.toFixed(1)}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                sellThrough >= 80 ? 'bg-green-500' : 
                                sellThrough >= 50 ? 'bg-amber-500' : 
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(sellThrough, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-semibold ${
                            expiryRate >= 30 ? 'text-red-600' : 
                            expiryRate >= 15 ? 'text-amber-600' : 
                            'text-green-600'
                          }`}>
                            {expiryRate.toFixed(1)}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                expiryRate >= 30 ? 'bg-red-500' : 
                                expiryRate >= 15 ? 'bg-amber-500' : 
                                'bg-green-500'
                              }`}
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