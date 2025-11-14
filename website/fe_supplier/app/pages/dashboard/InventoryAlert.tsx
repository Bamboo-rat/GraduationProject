import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  RefreshCw, 
  Search, 
  Filter, 
  Clock,
  ShoppingCart,
  Calendar,
  ArrowRight
} from 'lucide-react';
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
  threshold: number;
  imageUrl?: string;
  expiryDate?: string;
  status: string;
}

interface ExpiringItem {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantity: number;
  expiryDate: string;
  daysRemaining: number;
  imageUrl?: string;
}

export default function InventoryAlert() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
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
      analyzeExpiringItems(data.content);
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
              threshold: threshold,
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

  const analyzeExpiringItems = (products: ProductResponse[]) => {
    const items: ExpiringItem[] = [];
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        if (variant.expiryDate) {
          const expiryDate = new Date(variant.expiryDate);
          const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0 && daysRemaining <= 7) {
            const totalQuantity = variant.storeStocks?.reduce((sum, stock) => sum + (stock.stockQuantity || 0), 0) || 0;
            
            if (totalQuantity > 0) {
              items.push({
                productId: product.productId,
                productName: product.name,
                variantId: variant.variantId,
                variantName: variant.name,
                quantity: totalQuantity,
                expiryDate: variant.expiryDate,
                daysRemaining: daysRemaining,
                imageUrl: product.images?.[0]?.imageUrl,
              });
            }
          }
        }
      });
    });

    // Sort by days remaining (most urgent first)
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);
    setExpiringItems(items);
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
          <h1 className="text-3xl font-bold text-[#2D2D2D]">🏪 Quản Lý Tồn Kho</h1>
          <p className="text-[#6B6B6B] mt-1">Theo dõi cảnh báo tồn kho thấp và sản phẩm sắp hết hạn</p>
        </div>
        <button
          onClick={loadInventory}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#276749] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#A4C3A2]"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* SECTION A: Low Stock Alerts */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-orange-900">
                    ⚠️ {lowStockItems.length} SẢN PHẨM SẮP HẾT HÀNG
                  </h2>
                  <p className="text-sm text-orange-700">Ngưỡng cảnh báo: ≤ 10 đơn vị</p>
                </div>
              </div>

              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-orange-700">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tất cả sản phẩm đều có đủ tồn kho</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden border-2 border-orange-200">
                  <table className="min-w-full">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                          Còn lại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                          Ngưỡng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                      {lowStockItems.slice(0, 10).map((item, index) => (
                        <tr key={index} className="hover:bg-orange-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-lg object-cover mr-3 border-2 border-orange-200"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                                  <Package className="w-6 h-6 text-orange-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{item.productName}</p>
                                <p className="text-sm text-gray-500">{item.variantName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xl font-bold text-orange-600">{item.currentStock} sp</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 font-medium">{item.threshold}</span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-lg hover:bg-[#276749] transition-colors text-sm font-medium">
                              <ShoppingCart className="w-4 h-4" />
                              Nhập thêm
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* SECTION B: Expiring Items */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-900">
                    🕐 {expiringItems.length} SẢN PHẨM SẮP HẾT HẠN
                  </h2>
                  <p className="text-sm text-yellow-700">Còn lại {'<'} 7 ngày</p>
                </div>
              </div>

              {expiringItems.length === 0 ? (
                <div className="text-center py-8 text-yellow-700">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không có sản phẩm nào sắp hết hạn</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden border-2 border-yellow-200">
                  <table className="min-w-full">
                    <thead className="bg-yellow-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-yellow-900 uppercase">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-yellow-900 uppercase">
                          Số lượng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-yellow-900 uppercase">
                          Hết hạn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-yellow-900 uppercase">
                          Còn lại
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-100">
                      {expiringItems.map((item, index) => (
                        <tr key={index} className="hover:bg-yellow-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-lg object-cover mr-3 border-2 border-yellow-200"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center mr-3">
                                  <Package className="w-6 h-6 text-yellow-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{item.productName}</p>
                                <p className="text-sm text-gray-500">{item.variantName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xl font-bold text-gray-900">{item.quantity} sp</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-700 font-medium">
                              {new Date(item.expiryDate).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                                item.daysRemaining <= 2
                                  ? 'bg-red-100 text-red-700'
                                  : item.daysRemaining <= 4
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                              {item.daysRemaining} ngày
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Action Recommendations */}
      {!loading && (lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Khuyến nghị hành động</h3>
              <ul className="text-blue-800 space-y-2">
                {lowStockItems.length > 0 && (
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Liên hệ nhà cung cấp để nhập thêm <strong>{lowStockItems.length}</strong> sản phẩm
                      đang ở mức cảnh báo
                    </span>
                  </li>
                )}
                {expiringItems.length > 0 && (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Xem xét chạy khuyến mãi cho <strong>{expiringItems.length}</strong> sản phẩm sắp hết hạn để giảm lãng phí
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Ưu tiên hiển thị sản phẩm sắp hết hạn ở vị trí nổi bật trên cửa hàng</span>
                    </li>
                  </>
                )}
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cập nhật trạng thái sản phẩm hết hàng để tránh khách hàng đặt nhầm</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
