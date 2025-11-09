import { useEffect, useState } from 'react';
import { AlertTriangle, Package, TrendingDown, RefreshCw, Search, Filter } from 'lucide-react';
import productService from '~/service/productService';
import type { ProductResponse } from '~/service/productService';

interface LowStockItem {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  storeId: string;
  storeName: string;
  currentStock: number;
  imageUrl?: string;
  expiryDate?: string;
  status: string;
}

export default function InventoryAlert() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'low'>('all');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await productService.getMyProducts({
        page: 0,
        size: 100,
        status: 'ACTIVE',
      });
      setProducts(data.content);
      analyzeLowStock(data.content);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeLowStock = (products: ProductResponse[]) => {
    const items: LowStockItem[] = [];

    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        variant.storeStocks?.forEach((stock) => {
          const currentStock = stock.stockQuantity || 0;
          const threshold = 10; // Default low stock threshold

          if (currentStock <= threshold) {
            items.push({
              productId: product.productId,
              productName: product.name,
              variantId: variant.variantId,
              variantName: variant.name,
              sku: variant.sku,
              storeId: stock.storeId,
              storeName: stock.storeName,
              currentStock: currentStock,
              imageUrl: product.images?.[0]?.imageUrl,
              expiryDate: variant.expiryDate,
              status: currentStock === 0 ? 'OUT_OF_STOCK' : currentStock <= 5 ? 'CRITICAL' : 'LOW',
            });
          }
        });
      });
    });

    setLowStockItems(items);
  };

  const filteredItems = lowStockItems.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.storeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterLevel === 'all' ||
      (filterLevel === 'critical' && item.status === 'CRITICAL') ||
      (filterLevel === 'low' && item.status === 'LOW');

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: lowStockItems.length,
    critical: lowStockItems.filter((i) => i.status === 'CRITICAL').length,
    outOfStock: lowStockItems.filter((i) => i.status === 'OUT_OF_STOCK').length,
    lowStock: lowStockItems.filter((i) => i.status === 'LOW').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      case 'CRITICAL':
        return 'bg-orange-100 text-orange-800';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'Hết hàng';
      case 'CRITICAL':
        return 'Nguy hiểm';
      case 'LOW':
        return 'Sắp hết';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Cảnh báo tồn kho</h1>
          <p className="text-[#6B6B6B] mt-1">Theo dõi sản phẩm sắp hết hàng và cần nhập thêm</p>
        </div>
        <button
          onClick={loadInventory}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Tổng cảnh báo</h3>
          <p className="text-2xl font-bold text-[#2D2D2D]">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Hết hàng</h3>
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Mức nguy hiểm</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-1">Sắp hết</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8FFED] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm, SKU, cửa hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#B7E4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="px-4 py-2 border border-[#B7E4C7] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="critical">Chỉ nguy hiểm</option>
              <option value="low">Chỉ sắp hết</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Alert Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8FFED] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#A4C3A2]"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold mb-2">Không có cảnh báo tồn kho</p>
            <p className="text-sm">Tất cả sản phẩm đều còn đủ hàng trong kho</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F8FFF9]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Cửa hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Hạn sử dụng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FFF9] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">{item.variantName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-700">{item.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{item.storeName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-lg font-bold ${
                          item.currentStock === 0
                            ? 'text-red-600'
                            : item.currentStock <= 5
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.expiryDate
                        ? new Date(item.expiryDate).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Recommendations */}
      {filteredItems.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Khuyến nghị hành động</h3>
              <ul className="text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Liên hệ nhà cung cấp để nhập thêm <strong>{stats.critical + stats.outOfStock}</strong> sản phẩm
                    đang ở mức nguy hiểm
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cập nhật trạng thái sản phẩm hết hàng để tránh khách hàng đặt nhầm</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Xem xét chạy khuyến mãi cho sản phẩm sắp hết hạn để giảm lãng phí</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
