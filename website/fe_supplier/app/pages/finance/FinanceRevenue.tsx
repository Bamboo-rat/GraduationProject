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
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Báo cáo tài chính</h1>
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Số dư khả dụng</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {walletService.formatVND(summary?.availableBalance || 0)}
          </p>
          <p className="text-xs text-gray-500">Có thể rút ngay</p>
        </div>

        {/* Số dư đang chờ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Số dư đang chờ</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {walletService.formatVND(summary?.pendingBalance || 0)}
          </p>
          <p className="text-xs text-gray-500">Sẽ khả dụng sau 7 ngày</p>
        </div>

        {/* Tổng thu nhập */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Tổng thu nhập</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {walletService.formatVND(summary?.totalBalance || 0)}
          </p>
          <p className="text-xs text-gray-500">Available + Pending</p>
        </div>

        {/* Hoa hồng đã trả */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Hoa hồng đã trả</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {walletService.formatVND(summary?.estimatedCommissionThisMonth || 0)}
          </p>
          <p className="text-xs text-gray-500">Tháng này ({summary?.commissionRate || 10}%)</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#2F855A] text-white rounded-lg hover:bg-[#276749] transition-colors font-medium">
          <CreditCard className="w-5 h-5" />
          Rút tiền
        </button>
      </div>

      {/* 2.2. Revenue Over Time Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            Doanh thu theo thời gian
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="thisMonth">Tháng này</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Xuất
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: any) => walletService.formatVND(value)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#60A5FA" name="Doanh thu gốc" />
            <Bar dataKey="netIncome" fill="#2F855A" name="Thu nhập thực" />
            <Bar dataKey="commission" fill="#EF4444" name="Hoa hồng nền tảng" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Tổng doanh thu gốc</p>
            <p className="text-2xl font-bold text-gray-900">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Thu nhập thực tế</p>
            <p className="text-2xl font-bold text-gray-900">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.netIncome, 0))}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Tổng hoa hồng</p>
            <p className="text-2xl font-bold text-gray-900">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.commission, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
