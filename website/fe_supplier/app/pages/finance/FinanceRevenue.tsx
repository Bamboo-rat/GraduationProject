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
import * as XLSX from 'xlsx';
import walletService from '~/service/walletService';
import type { WalletSummaryResponse } from '~/service/walletService';
import reportService from '~/service/reportService';

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0,
    orderCompleted: { count: 0, amount: 0 },
    orderRefund: { count: 0, amount: 0 },
    commission: { count: 0, amount: 0 },
    commissionRefund: { count: 0, amount: 0 }
  });

  useEffect(() => {
    loadFinanceData();
  }, [timePeriod]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timePeriod) {
        case '7days':
          startDate.setDate(startDate.getDate() - 6);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 29);
          break;
        case 'thisMonth':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 29);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Load wallet summary and transactions
      const [walletData, transactionsData] = await Promise.all([
        walletService.getWalletSummary(),
        walletService.getMyTransactions({
          startDate: startDateStr,
          endDate: endDateStr,
          page: 0,
          size: 1000 // Lấy tất cả giao dịch trong kỳ
        })
      ]);
      
      setSummary(walletData);
      setTransactions(transactionsData.content || []);

      // Tính toán thống kê từ transactions thực tế
      const txList = transactionsData.content || [];
      
      let grossRevenue = 0; // Doanh thu gốc từ đơn hàng
      let refundAmount = 0; // Tiền hoàn trả
      let totalCommission = 0; // Tổng hoa hồng
      const orderCompleted = { count: 0, amount: 0 };
      const orderRefund = { count: 0, amount: 0 };
      const commission = { count: 0, amount: 0 };
      const commissionRefund = { count: 0, amount: 0 };

      txList.forEach((tx: any) => {
        const amount = tx.amount || 0;
        
        switch (tx.transactionType) {
          case 'ORDER_COMPLETED':
            orderCompleted.count++;
            orderCompleted.amount += amount; 
            grossRevenue += amount;
            break;
          case 'ORDER_REFUND':
            orderRefund.count++;
            orderRefund.amount += Math.abs(amount); // Hiển thị dương
            refundAmount += Math.abs(amount); // Tính toán dương
            break;
          case 'COMMISSION_FEE':
            commission.count++;
            commission.amount += Math.abs(amount); // Hiển thị dương
            totalCommission += Math.abs(amount); // Tính toán dương
            break;
          case 'COMMISSION_REFUND':
            commissionRefund.count++;
            commissionRefund.amount += amount; // amount dương
            totalCommission -= amount; 
            break;
        }
      });

      // Tính toán đúng:
      // Tổng thu nhập (thực nhận) = Doanh thu gốc - Hoàn tiền = Tiền khách hàng trả thực tế
      const totalIncome = grossRevenue - refundAmount;
      // Tổng chi phí = CHỈ tính hoa hồng (đã trừ hoàn hồng), KHÔNG tính hoàn tiền vào chi phí
      // Vì hoàn tiền đã được trừ ở totalIncome rồi
      const totalExpense = totalCommission;
      // Lợi nhuận ròng = Thu nhập thực - Hoa hồng
      const netProfit = totalIncome - totalExpense;

      setStats({
        totalIncome,
        totalExpense,
        netProfit,
        transactionCount: txList.length,
        orderCompleted,
        orderRefund,
        commission,
        commissionRefund
      });

      // Nhóm transactions theo ngày cho biểu đồ
      const txByDate: any = {};
      txList.forEach((tx: any) => {
        const date = new Date(tx.createdAt).toLocaleDateString('vi-VN', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (!txByDate[date]) {
          txByDate[date] = { revenue: 0, commission: 0, refund: 0, netIncome: 0 };
        }
        
        const amount = Math.abs(tx.amount || 0);
        
        if (tx.transactionType === 'ORDER_COMPLETED') {
          txByDate[date].revenue += amount;
        } else if (tx.transactionType === 'COMMISSION_FEE') {
          txByDate[date].commission += amount;
        } else if (tx.transactionType === 'ORDER_REFUND') {
          txByDate[date].refund += amount;
        } else if (tx.transactionType === 'COMMISSION_REFUND') {
          txByDate[date].commission -= amount; 
        }
      });

      // Chuyển sang array và tính netIncome
      const chartData = Object.keys(txByDate).map(date => ({
        date,
        revenue: txByDate[date].revenue - txByDate[date].refund,
        commission: txByDate[date].commission,
        netIncome: (txByDate[date].revenue - txByDate[date].refund) - txByDate[date].commission
      }));
      
      setRevenueData(chartData);
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

  const exportToExcel = () => {
    try {
      const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
      const totalCommission = revenueData.reduce((sum, item) => sum + item.commission, 0);
      const totalNetIncome = revenueData.reduce((sum, item) => sum + item.netIncome, 0);

      // Prepare summary data
      const summaryData = [
        ['BÁO CÁO TÀI CHÍNH - SAVEFOOD'],
        ['Thời gian xuất:', new Date().toLocaleString('vi-VN')],
        ['Kỳ báo cáo:', timePeriod === '7days' ? '7 ngày qua' : timePeriod === '30days' ? '30 ngày qua' : 'Tháng này'],
        [],
        ['TỔNG QUAN TÀI CHÍNH'],
        ['Số dư khả dụng:', summary?.availableBalance || 0],
        ['Số dư đang chờ:', summary?.pendingBalance || 0],
        ['Tổng thu nhập thực nhận:', stats.totalIncome, `(Doanh thu ${walletService.formatVND(stats.orderCompleted.amount)} - Hoàn tiền ${walletService.formatVND(stats.orderRefund.amount)})`],
        ['Tổng chi phí (Hoa hồng):', stats.totalExpense, `${((summary?.commissionRate || 0.1) * 100).toFixed(1)}% doanh thu`],
        ['Lợi nhuận ròng:', stats.netProfit, 'Thu nhập - Chi phí'],
        [],
        ['PHÂN LOẠI GIAO DỊCH'],
        ['Loại giao dịch', 'Số lần', 'Số tiền (VNĐ)'],
        ['Thu nhập đơn hàng', stats.orderCompleted.count, `+${stats.orderCompleted.amount.toLocaleString('vi-VN')}`],
        ['Hoàn tiền đơn hàng', stats.orderRefund.count, `-${stats.orderRefund.amount.toLocaleString('vi-VN')}`],
        ['Phí hoa hồng', stats.commission.count, `-${stats.commission.amount.toLocaleString('vi-VN')}`],
        ['Hoàn hoa hồng', stats.commissionRefund.count, `+${stats.commissionRefund.amount.toLocaleString('vi-VN')}`],
        ['', 'Tổng:', stats.transactionCount],
        [],
        ['CHI TIẾT DOANH THU THEO NGÀY'],
        ['Ngày', 'Doanh thu thực (VNĐ)', 'Hoa hồng (VNĐ)', 'Lợi nhuận ròng (VNĐ)']
      ];

      // Add revenue data
      revenueData.forEach(item => {
        summaryData.push([
          item.date,
          item.revenue,
          item.commission,
          item.netIncome
        ]);
      });

      summaryData.push([]);
      summaryData.push(['TỔNG CỘNG', totalRevenue, totalCommission, totalNetIncome]);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths
      ws['!cols'] = [
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 }
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo doanh thu');

      // Generate filename with current date
      const fileName = `BaoCao_DoanhThu_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Export file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Không thể xuất file Excel. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A8D5BA]"></div>
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
          <h1 className="text-3xl font-bold text-[#2D3748]">Báo cáo tài chính</h1>
          <p className="text-[#718096] mt-1">Quản lý thu nhập và giao dịch của bạn</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadFinanceData}
            className="flex items-center gap-2 px-4 py-2 bg-[#6C9A8F] text-white rounded-xl hover:bg-[#5A8A7F] transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* 2.1. Wallet Overview - 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Số dư khả dụng */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#2D7D46]" />
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
            <div className="w-10 h-10 rounded-lg bg-[#FFF3E0] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#F57C00]" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Số dư đang chờ</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {walletService.formatVND(summary?.pendingBalance || 0)}
          </p>
          <p className="text-xs text-gray-500">Sẽ khả dụng sau 7 ngày</p>
        </div>

        {/* Tổng thu nhập thực nhận */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1976D2]" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Tổng thu nhập</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {walletService.formatVND(stats.totalIncome)}
          </p>
          <p className="text-xs text-gray-500">Tiền thực nhận trong kỳ</p>
        </div>

        {/* Tổng chi phí */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFEBEE] flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-[#C53030]" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Tổng chi phí</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {walletService.formatVND(stats.totalExpense)}
          </p>
          <p className="text-xs text-gray-500">Hoa hồng nền tảng</p>
        </div>
      </div>

      {/* Phân loại giao dịch - ĐÃ SỬA VỊ TRÍ SỐ TIỀN VÀ SỐ ĐƠN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-700" />
          Phân loại giao dịch
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Thu nhập đơn hàng */}
          <div className="bg-[#E8F5E9] rounded-lg p-4 border border-[#C8E6C9]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#2D7D46]">Thu nhập đơn hàng</span>
              <ArrowUpCircle className="w-5 h-5 text-[#2D7D46]" />
            </div>
            <p className="text-2xl font-bold text-[#2D7D46] mb-1">
              +{walletService.formatVND(stats.orderCompleted.amount)}
            </p>
            <p className="text-sm text-[#2D7D46]">
              {stats.orderCompleted.count} đơn hàng
            </p>
          </div>

          {/* Hoàn tiền đơn hàng */}
          <div className="bg-[#FFF3E0] rounded-lg p-4 border border-[#FFE0B2]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#F57C00]">Hoàn tiền đơn hàng</span>
              <ArrowDownCircle className="w-5 h-5 text-[#F57C00]" />
            </div>
            <p className="text-2xl font-bold text-[#F57C00] mb-1">
              -{walletService.formatVND(stats.orderRefund.amount)}
            </p>
            <p className="text-sm text-[#F57C00]">
              {stats.orderRefund.count} đơn hàng
            </p>
          </div>

          {/* Phí hoa hồng */}
          <div className="bg-[#FFEBEE] rounded-lg p-4 border border-[#FFCDD2]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#C53030]">Phí hoa hồng (thực)</span>
              <DollarSign className="w-5 h-5 text-[#C53030]" />
            </div>
            <p className="text-2xl font-bold text-[#C53030] mb-1">
              -{walletService.formatVND(stats.totalExpense)}
            </p>
            <p className="text-sm text-[#C53030]">
              {stats.commission.count} lần trừ - {stats.commissionRefund.count} lần hoàn
            </p>
          </div>

          {/* Hoàn hoa hồng */}
          <div className="bg-[#E3F2FD] rounded-lg p-4 border border-[#BBDEFB]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#1976D2]">Hoàn hoa hồng</span>
              <RefreshCw className="w-5 h-5 text-[#1976D2]" />
            </div>
            <p className="text-2xl font-bold text-[#1976D2] mb-1">
              +{walletService.formatVND(stats.commissionRefund.amount)}
            </p>
            <p className="text-sm text-[#1976D2]">
              {stats.commissionRefund.count} đơn hủy
            </p>
          </div>
        </div>

        {/* Chi tiết tính hoa hồng */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Chi tiết hoa hồng:</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Hoa hồng gốc:</span>
              <span className="ml-2 font-semibold text-red-600">-{walletService.formatVND(stats.commission.amount)}</span>
            </div>
            <div>
              <span className="text-gray-600">Hoàn lại:</span>
              <span className="ml-2 font-semibold text-blue-600">+{walletService.formatVND(stats.commissionRefund.amount)}</span>
            </div>
            <div>
              <span className="text-gray-600">Hoa hồng thực tế:</span>
              <span className="ml-2 font-semibold text-orange-600">-{walletService.formatVND(stats.totalExpense)}</span>
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Tổng thu nhập (thực nhận)</p>
              <p className="text-2xl font-bold text-[#2D7D46]">
                {walletService.formatVND(stats.totalIncome)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Doanh thu {walletService.formatVND(stats.orderCompleted.amount)} - Hoàn tiền {walletService.formatVND(stats.orderRefund.amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Tổng chi phí</p>
              <p className="text-2xl font-bold text-[#C53030]">
                {walletService.formatVND(stats.totalExpense)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Hoa hồng {walletService.formatVND(stats.commission.amount)} - Hoàn {walletService.formatVND(stats.commissionRefund.amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Lợi nhuận ròng</p>
              <p className="text-2xl font-bold text-[#1976D2]">
                {walletService.formatVND(stats.netProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Thu nhập - Chi phí</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#6C9A8F] text-white rounded-lg hover:bg-[#5A8A7F] transition-colors font-medium shadow-sm">
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
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] transition-all duration-200"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="thisMonth">Tháng này</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
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
            <Bar dataKey="revenue" fill="#A8D5BA" name="Doanh thu thực" />
            <Bar dataKey="commission" fill="#FF9AA2" name="Hoa hồng" />
            <Bar dataKey="netIncome" fill="#6C9A8F" name="Lợi nhuận ròng" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-[#E8F5E9] rounded-lg p-4 border border-[#C8E6C9]">
            <p className="text-sm text-gray-600 font-medium mb-1">Doanh thu thực</p>
            <p className="text-xl font-bold text-gray-900">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
            </p>
            <p className="text-xs text-gray-500 mt-1">Đã trừ hoàn tiền</p>
          </div>
          <div className="bg-[#FFEBEE] rounded-lg p-4 border border-[#FFCDD2]">
            <p className="text-sm text-gray-600 font-medium mb-1">Tổng hoa hồng</p>
            <p className="text-xl font-bold text-gray-900">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.commission, 0))}
            </p>
            <p className="text-xs text-gray-500 mt-1">{((summary?.commissionRate || 0.1) * 100).toFixed(0)}% doanh thu</p>
          </div>
          <div className="bg-[#E3F2FD] rounded-lg p-4 border border-[#BBDEFB]">
            <p className="text-sm text-gray-600 font-medium mb-1">Lợi nhuận ròng</p>
            <p className="text-xl font-bold text-gray-900">
              {walletService.formatVND(revenueData.reduce((sum, item) => sum + item.netIncome, 0))}
            </p>
            <p className="text-xs text-gray-500 mt-1">Tiền vào ví</p>
          </div>
          <div className="bg-[#F3E5F5] rounded-lg p-4 border border-[#E1BEE7]">
            <p className="text-sm text-gray-600 font-medium mb-1">Số giao dịch</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.transactionCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Trong kỳ báo cáo</p>
          </div>
        </div>
      </div>
    </div>
  );
}