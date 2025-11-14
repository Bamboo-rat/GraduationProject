import { useEffect, useState } from 'react';
import {
  DollarSign,
  Clock,
  TrendingUp,
  CreditCard,
  FileText,
  RefreshCw,
  Download,
  Filter,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import walletService from '~/service/walletService';
import type { WalletSummaryResponse } from '~/service/walletService';

interface Transaction {
  id: string;
  timestamp: string;
  type: 'ORDER_COMPLETED' | 'COMMISSION' | 'REFUND' | 'WITHDRAWAL';
  amount: number;
  balanceAfter: number;
  referenceCode: string;
}

export default function FinanceRevenue() {
  const [summary, setSummary] = useState<WalletSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'7days' | '30days' | 'thisMonth' | 'custom'>('30days');
  const [transactionType, setTransactionType] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadFinanceData();
  }, [timePeriod]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const data = await walletService.getWalletSummary();
      setSummary(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ORDER_COMPLETED':
        return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
      case 'COMMISSION':
        return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
      case 'REFUND':
        return <ArrowDownCircle className="w-5 h-5 text-orange-600" />;
      case 'WITHDRAWAL':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'ORDER_COMPLETED':
        return 'Đơn hoàn thành';
      case 'COMMISSION':
        return 'Hoa hồng nền tảng';
      case 'REFUND':
        return 'Hoàn tiền đơn hủy';
      case 'WITHDRAWAL':
        return 'Rút tiền';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'ORDER_COMPLETED':
        return 'bg-green-50';
      case 'COMMISSION':
        return 'bg-red-50';
      case 'REFUND':
        return 'bg-orange-50';
      case 'WITHDRAWAL':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType =
      transactionType === 'all' ||
      (transactionType === 'credit' && tx.amount > 0) ||
      (transactionType === 'debit' && tx.amount < 0);
    const matchesSearch =
      searchTerm === '' ||
      tx.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTransactionLabel(tx.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A4C3A2]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Báo Cáo Tài Chính</h1>
          <p className="text-[#6B6B6B] mt-1">Quản lý thu nhập và giao dịch của bạn</p>
        </div>
        <button
          onClick={loadFinanceData}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* 2.1. Wallet Overview - 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Số dư khả dụng */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              💵 Khả dụng
            </span>
          </div>
          <h3 className="text-sm font-medium text-green-700 mb-2">Số dư khả dụng</h3>
          <p className="text-3xl font-bold text-green-800 mb-1">
            {walletService.formatVND(summary?.availableBalance || 0)}
          </p>
          <p className="text-xs text-green-600">(Có thể rút ngay)</p>
        </div>

        {/* Số dư đang chờ */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
              ⏳ Chờ xử lý
            </span>
          </div>
          <h3 className="text-sm font-medium text-yellow-700 mb-2">Số dư đang chờ</h3>
          <p className="text-3xl font-bold text-yellow-800 mb-1">
            {walletService.formatVND(summary?.pendingBalance || 0)}
          </p>
          <p className="text-xs text-yellow-600">(Sẽ khả dụng sau 7 ngày)</p>
        </div>

        {/* Tổng thu nhập */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              📊 Tổng
            </span>
          </div>
          <h3 className="text-sm font-medium text-blue-700 mb-2">Tổng thu nhập</h3>
          <p className="text-3xl font-bold text-blue-800 mb-1">
            {walletService.formatVND(summary?.totalBalance || 0)}
          </p>
          <p className="text-xs text-blue-600">(Available + Pending)</p>
        </div>

        {/* Hoa hồng đã trả */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm">
              <ArrowDownCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-red-700 bg-red-100 px-3 py-1 rounded-full">
              📉 {summary?.commissionRate || 10}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-red-700 mb-2">Hoa hồng đã trả</h3>
          <p className="text-3xl font-bold text-red-800 mb-1">
            {walletService.formatVND(summary?.estimatedCommissionThisMonth || 0)}
          </p>
          <p className="text-xs text-red-600">(Tháng này)</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex items-center gap-2 px-6 py-3 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors font-semibold shadow-sm">
          <CreditCard className="w-5 h-5" />
          💳 Rút tiền
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#E8FFED] text-[#2F855A] rounded-xl hover:bg-[#F8FFF9] transition-colors font-semibold shadow-sm">
          <FileText className="w-5 h-5" />
          📜 Lịch sử giao dịch
        </button>
      </div>

      {/* 2.2. Revenue Over Time Chart */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E8FFED] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2F855A]" />
            Doanh Thu Theo Thời Gian
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              className="px-4 py-2 border-2 border-[#B7E4C7] rounded-xl bg-white text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="thisMonth">Tháng này</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#E8FFED] text-[#2F855A] rounded-xl hover:bg-[#F8FFF9] transition-colors">
              <Download className="w-4 h-4" />
              Xuất
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8FFED" />
            <XAxis 
              dataKey="date" 
              stroke="#6B6B6B"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B6B6B"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: any) => walletService.formatVND(value)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '2px solid #E8FFED',
                borderRadius: '12px',
                padding: '12px'
              }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#60A5FA" name="🟦 Doanh thu gốc" />
            <Bar dataKey="netIncome" fill="#2F855A" name="🟩 Thu nhập thực" />
            <Bar dataKey="commission" fill="#EF4444" name="🟥 Hoa hồng nền tảng" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-1">Tổng doanh thu gốc</p>
            <p className="text-2xl font-bold text-blue-800">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <p className="text-sm text-green-700 font-medium mb-1">Thu nhập thực tế</p>
            <p className="text-2xl font-bold text-green-800">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.netIncome, 0))}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
            <p className="text-sm text-red-700 font-medium mb-1">Tổng hoa hồng</p>
            <p className="text-2xl font-bold text-red-800">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.commission, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* 2.3. Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E8FFED] overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-[#E8FFED]">
          <h2 className="text-xl font-semibold text-[#2D2D2D] flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#2F855A]" />
            Lịch Sử Giao Dịch
          </h2>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-[#B7E4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                className="px-4 py-2 border-2 border-[#B7E4C7] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
              >
                <option value="all">Tất cả giao dịch</option>
                <option value="credit">Tiền vào (+)</option>
                <option value="debit">Tiền ra (-)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#F8FFF9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Số dư sau
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mã tham chiếu
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className={`hover:bg-[#F8FFF9] transition-colors ${getTransactionColor(transaction.type)}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(transaction.timestamp).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <span className="text-sm font-medium text-gray-900">
                        {getTransactionLabel(transaction.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{walletService.formatVND(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {walletService.formatVND(transaction.balanceAfter)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-blue-600 hover:text-blue-800 cursor-pointer">
                      {transaction.referenceCode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold mb-2">Không có giao dịch</p>
            <p className="text-sm">Không tìm thấy giao dịch phù hợp với bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
}
