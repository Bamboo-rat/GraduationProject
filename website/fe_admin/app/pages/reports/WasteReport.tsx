import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import reportService from '~/service/reportService';
import type { WasteSummary, WasteBySupplier } from '~/service/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Package, TrendingUp, AlertTriangle, Store, Calendar, Filter } from 'lucide-react';

export default function WasteReportNew() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [supplierData, setSupplierData] = useState<WasteBySupplier[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'7days' | '30days' | 'thisMonth'>('30days');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, supplierRes] = await Promise.all([
        reportService.getWasteSummary(),
        reportService.getWasteBySupplier()
      ]);
      setSummary(summaryRes);
      setSupplierData(supplierRes);
      
      // Mock time series data
      const mockTimeSeries = generateMockTimeSeries(period);
      setTimeSeriesData(mockTimeSeries);
    } catch (err) {
      console.error('Error fetching waste data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTimeSeries = (period: string) => {
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 30;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        wasteRate: Math.random() * 30 + 10,
        listed: Math.floor(Math.random() * 100 + 50),
        sold: Math.floor(Math.random() * 60 + 20),
        unsold: Math.floor(Math.random() * 30 + 5)
      });
    }
    return data;
  };

  const handleExport = async () => {
    try {
      const blob = await reportService.exportWasteReport();
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

  const totalListed = summary?.totalListed || 0;
  const totalSold = summary?.totalSold || 0;
  const totalUnsold = summary?.totalUnsold || 0;
  const wasteRate = summary?.wasteRate || 0;
  const platformAvgWasteRate = supplierData.length > 0 
    ? supplierData.reduce((sum, s) => sum + s.wasteRate, 0) / supplierData.length 
    : 0;

  const topWasteStores = supplierData
    .sort((a, b) => b.wasteRate - a.wasteRate)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo Cáo Lãng Phí</h1>
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

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{totalListed.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Tổng nhập bán</p>
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
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-600">{totalUnsold.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Không bán được</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-orange-600">{wasteRate.toFixed(1)}%</h3>
                <p className="text-sm text-gray-600">Tỉ lệ lãng phí</p>
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

        {/* Waste Rate Time Series Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2F855A]" />
              Xu hướng lãng phí theo thời gian
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                stroke="#6b7280"
              />
              <YAxis 
                yAxisId="left"
                fontSize={12}
                stroke="#6b7280"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                fontSize={12}
                stroke="#f97316"
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  background: 'white'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="listed" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Nhập bán"
                dot={{ fill: '#3b82f6', r: 3 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="sold" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Đã bán"
                dot={{ fill: '#10b981', r: 3 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="unsold" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Không bán được"
                dot={{ fill: '#ef4444', r: 3 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="wasteRate" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Tỉ lệ lãng phí (%)"
                dot={{ fill: '#f97316', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Waste Stores */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Top 5 cửa hàng có tỉ lệ lãng phí cao nhất
          </h2>
          <div className="space-y-4">
            {topWasteStores.map((store, index) => {
              const storeWasteRate = store.wasteRate;
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
                        <p className="text-sm text-gray-500">{store.totalStores} cửa hàng</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Nhập bán</p>
                      <p className="font-semibold text-gray-900">{store.totalStockQuantity.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Đã bán</p>
                      <p className="font-semibold text-green-600">{store.soldQuantity.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Lãng phí</p>
                      <p className="font-semibold text-red-600">{store.unsoldQuantity.toLocaleString()}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-lg font-bold text-amber-600">{storeWasteRate.toFixed(1)}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-amber-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(storeWasteRate, 100)}%` }}
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nhập bán</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đã bán</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lãng phí</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplierData.map((store) => {
                  const listed = store.totalStockQuantity;
                  const sold = store.soldQuantity;
                  const unsold = store.unsoldQuantity;
                  const rate = store.wasteRate;

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
                        <span className="font-medium text-gray-900">{listed.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-green-600">{sold.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-red-600">{unsold.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-semibold ${
                            rate >= 30 ? 'text-red-600' : 
                            rate >= 15 ? 'text-amber-600' : 
                            'text-green-600'
                          }`}>
                            {rate.toFixed(1)}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                rate >= 30 ? 'bg-red-500' : 
                                rate >= 15 ? 'bg-amber-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
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