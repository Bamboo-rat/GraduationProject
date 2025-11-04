import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import type { PageResponse, PaginatedResponse } from '~/service/types';
import { productService, type Product, type ProductListParams } from '~/service/productService';
import Toast from '~/component/common/Toast';
import { Package, Search, Filter, Eye, Ban, CheckCircle } from 'lucide-react';

const isPaginatedResponse = <T,>(
  data: PaginatedResponse<T> | PageResponse<T>
): data is PaginatedResponse<T> => {
  return typeof data === 'object' && data !== null && 'page' in data;
};

const isSpringPageResponse = <T,>(
  data: PaginatedResponse<T> | PageResponse<T>
): data is PageResponse<T> => {
  return typeof data === 'object' && data !== null && 'pageable' in data;
};


export default function ProductsList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter, categoryFilter, debouncedSearch]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params: ProductListParams = {
        page,
        size,
        sort: 'createdAt,desc'
      };

      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await productService.getAllProducts(params);
      const pageData = response?.data;

      if (!pageData) {
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
        setToast({ message: 'Không nhận được dữ liệu từ máy chủ', type: 'error' });
        return;
      }

      const content = Array.isArray(pageData.content) ? pageData.content : [];
      setProducts(content);

      if (isPaginatedResponse<Product>(pageData)) {
        const pagination = pageData.page ?? { totalPages: 0, totalElements: 0 };
        setTotalPages(pagination?.totalPages ?? 0);
        setTotalElements(pagination?.totalElements ?? content.length);
      } else if (isSpringPageResponse<Product>(pageData)) {
        setTotalPages(pageData.totalPages ?? 0);
        setTotalElements(pageData.totalElements ?? content.length);
      } else {
        const fallbackTotalPages =
          typeof (pageData as { totalPages?: number }).totalPages === 'number'
            ? (pageData as { totalPages: number }).totalPages
            : 0;

        const fallbackTotalElements =
          typeof (pageData as { totalElements?: number }).totalElements === 'number'
            ? (pageData as { totalElements: number }).totalElements
            : content.length;

        setTotalPages(fallbackTotalPages);
        setTotalElements(fallbackTotalElements);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
      setToast({
        message: error.response?.data?.message || 'Không thể tải danh sách sản phẩm',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'Đang bán', className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Ngừng bán', className: 'bg-gray-100 text-gray-800' },
      SOLD_OUT: { label: 'Hết hàng', className: 'bg-orange-100 text-orange-800' },
      EXPIRED: { label: 'Hết hạn', className: 'bg-red-100 text-red-800' },
      SUSPENDED: { label: 'Bị khóa', className: 'bg-red-100 text-red-800' },
      DELETED: { label: 'Đã xóa', className: 'bg-gray-100 text-gray-500' }
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const handleViewDetail = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleSuspendClick = (product: Product) => {
    setSelectedProduct(product);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const handleUnsuspendClick = (product: Product) => {
    setSelectedProduct(product);
    setShowUnsuspendModal(true);
  };

  const handleSuspend = async () => {
    if (!selectedProduct || !suspendReason.trim()) {
      setToast({ message: 'Vui lòng nhập lý do đình chỉ', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await productService.suspendProduct(selectedProduct.productId, suspendReason);
      setToast({ message: 'Đã đình chỉ sản phẩm thành công', type: 'success' });
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedProduct(null);
      await fetchProducts();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Không thể đình chỉ sản phẩm',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await productService.unsuspendProduct(selectedProduct.productId);
      setToast({ message: 'Đã gỡ bỏ đình chỉ thành công', type: 'success' });
      setShowUnsuspendModal(false);
      setSelectedProduct(null);
      await fetchProducts();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Không thể gỡ bỏ đình chỉ',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
            <Package className="w-8 h-8 mr-2 text-blue-600" />
            Tất cả Sản phẩm
          </h1>
          <p className="text-gray-600">Tổng số: {totalElements.toLocaleString()} sản phẩm</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tên sản phẩm, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Đang bán</option>
                <option value="INACTIVE">Ngừng bán</option>
                <option value="SOLD_OUT">Hết hàng</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="SUSPENDED">Bị khóa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hành động
              </label>
              <button
                onClick={fetchProducts}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {debouncedSearch || statusFilter
                ? 'Không tìm thấy sản phẩm nào phù hợp'
                : 'Chưa có sản phẩm nào'}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nhà cung cấp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Biến thể
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
                    const firstVariant = product.variants[0];

                    return (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {primaryImage && (
                              <img
                                className="h-12 w-12 rounded object-cover"
                                src={primaryImage.imageUrl}
                                alt={product.name}
                              />
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.categoryName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {firstVariant && formatCurrency(firstVariant.discountPrice || firstVariant.originalPrice)}
                          </div>
                          {firstVariant && firstVariant.discountPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatCurrency(firstVariant.originalPrice)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.variants.length} biến thể
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewDetail(product.productId)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4 inline" />
                          </button>
                          {product.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleSuspendClick(product)}
                              className="text-red-600 hover:text-red-900 mr-3"
                              title="Đình chỉ"
                            >
                              <Ban className="w-4 h-4 inline" />
                            </button>
                          )}
                          {product.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleUnsuspendClick(product)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Gỡ đình chỉ"
                            >
                              <CheckCircle className="w-4 h-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{page * size + 1}</span> đến{' '}
                      <span className="font-medium">{Math.min((page + 1) * size, totalElements)}</span> trong tổng số{' '}
                      <span className="font-medium">{totalElements}</span> sản phẩm
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNumber = i;
                        if (totalPages > 5) {
                          if (page < 3) pageNumber = i;
                          else if (page > totalPages - 4) pageNumber = totalPages - 5 + i;
                          else pageNumber = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNumber === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowSuspendModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Đình chỉ sản phẩm</h3>
              <p className="text-sm text-gray-500 mb-4">
                Đình chỉ sản phẩm <strong>{selectedProduct.name}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do đình chỉ *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Nhập lý do đình chỉ..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={!suspendReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận đình chỉ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend Modal */}
      {showUnsuspendModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowUnsuspendModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gỡ bỏ đình chỉ</h3>
              <p className="text-sm text-gray-500 mb-4">
                Gỡ bỏ đình chỉ cho sản phẩm <strong>{selectedProduct.name}</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUnsuspendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUnsuspend}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Xác nhận gỡ đình chỉ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}
