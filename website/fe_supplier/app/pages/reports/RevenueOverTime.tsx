import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Download, RefreshCw, BarChart3 } from 'lucide-react';
import walletService from '~/service/walletService';
import reportService from '~/service/reportService';
import type { WalletStatsResponse } from '~/service/walletService';

export default function RevenueOverTime() {
  const [stats, setStats] = useState<WalletStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadStats();
  }, [period, selectedYear, selectedMonth]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await walletService.getWalletStats({
        year: selectedYear,
        month: period === 'month' ? selectedMonth : undefined,
      });
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A4C3A2]"></div>
      </div>
    );
  }

  const maxAmount = Math.max(
    ...(stats?.monthlyBreakdown?.map(m => Math.max(m.income, m.expense)) || [0])
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Doanh thu theo thời gian</h1>
          <p className="text-[#6B6B6B] mt-1">Phân tích chi tiết doanh thu và chi phí theo thời gian</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Period & Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8FFED] p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Kỳ báo cáo:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                period === 'month'
                  ? 'bg-[#2F855A] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Theo tháng
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                period === 'year'
                  ? 'bg-[#2F855A] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Theo năm
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-[#B7E4C7] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  Năm {year}
                </option>
              ))}
            </select>
            {period === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-[#B7E4C7] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-green-700 font-medium mb-1">Tổng thu nhập</h3>
          <p className="text-2xl font-bold text-green-800">
            {walletService.formatVND(stats?.totalIncome || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border-2 border-red-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-red-700 font-medium mb-1">Tổng chi phí</h3>
          <p className="text-2xl font-bold text-red-800">
            {walletService.formatVND(stats?.totalExpense || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-blue-700 font-medium mb-1">Lợi nhuận ròng</h3>
          <p className="text-2xl font-bold text-blue-800">
            {walletService.formatVND(stats?.netAmount || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-purple-700 font-medium mb-1">Số giao dịch</h3>
          <p className="text-2xl font-bold text-purple-800">{stats?.totalTransactions || 0}</p>
        </div>
      </div>

      {/* Chart */}
      {stats?.monthlyBreakdown && stats.monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#2D2D2D]">Biểu đồ doanh thu</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </button>
          </div>

          <div className="space-y-4">
            {stats.monthlyBreakdown.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{data.monthName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-600 font-semibold">
                      +{walletService.formatVND(data.income)}
                    </span>
                    <span className="text-red-600 font-semibold">
                      -{walletService.formatVND(data.expense)}
                    </span>
                    <span className="text-blue-600 font-bold">
                      ={walletService.formatVND(data.net)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 h-8">
                  <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-end pr-2"
                      style={{ width: `${(data.income / maxAmount) * 100}%` }}
                    >
                      {data.income > 0 && (
                        <span className="text-xs text-white font-semibold">Thu</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-end pr-2"
                      style={{ width: `${(data.expense / maxAmount) * 100}%` }}
                    >
                      {data.expense > 0 && (
                        <span className="text-xs text-white font-semibold">Chi</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {data.transactionCount} giao dịch
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Type Breakdown */}
      {stats?.transactionTypeBreakdown && stats.transactionTypeBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6">Phân loại giao dịch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.transactionTypeBreakdown.map((type, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${
                  type.isIncome
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{type.label}</span>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                    {type.count} lần
                  </span>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    type.isIncome ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {type.isIncome ? '+' : '-'}
                  {walletService.formatVND(Math.abs(type.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Note */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Tóm tắt {stats?.period}</h3>
            <div className="text-blue-800 space-y-1">
              <p>
                • Tổng thu nhập: <strong>{walletService.formatVND(stats?.totalIncome || 0)}</strong>
              </p>
              <p>
                • Tổng chi phí (hoa hồng, hoàn tiền...): <strong>{walletService.formatVND(stats?.totalExpense || 0)}</strong>
              </p>
              <p>
                • Lợi nhuận ròng: <strong className={stats && stats.netAmount >= 0 ? 'text-green-700' : 'text-red-700'}>{walletService.formatVND(stats?.netAmount || 0)}</strong>
              </p>
              <p>
                • Tổng số giao dịch: <strong>{stats?.totalTransactions || 0}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
