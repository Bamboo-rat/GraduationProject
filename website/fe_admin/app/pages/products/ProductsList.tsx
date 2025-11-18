import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import type { PageResponse, PaginatedResponse } from '~/service/types';
import { productService, type Product, type ProductListParams } from '~/service/productService';
import Toast from '~/component/common/Toast';
import { Package, Search, Filter, Eye, Ban, CheckCircle, RefreshCw } from 'lucide-react';

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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize from URL params
  const urlPage = Number(searchParams.get('page')) || 0;
  const urlStatus = searchParams.get('status') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination
  const [page, setPage] = useState(urlPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>(urlCategory);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  // Modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Helper to update URL params
  const updateURLParams = (params: { page: string; status: string; category: string; search: string }) => {
    const newParams = new URLSearchParams();
    if (params.page !== '0') newParams.set('page', params.page);
    if (params.status) newParams.set('status', params.status);
    if (params.category) newParams.set('category', params.category);
    if (params.search) newParams.set('search', params.search);
    setSearchParams(newParams, { replace: true });
  };

  // Sync state with URL changes (back/forward navigation)
  useEffect(() => {
    const newPage = Number(searchParams.get('page')) || 0;
    const newStatus = searchParams.get('status') || '';
    const newCategory = searchParams.get('category') || '';
    const newSearch = searchParams.get('search') || '';
    
    if (page !== newPage) setPage(newPage);
    if (statusFilter !== newStatus) setStatusFilter(newStatus);
    if (categoryFilter !== newCategory) setCategoryFilter(newCategory);
    if (searchTerm !== newSearch) {
      setSearchTerm(newSearch);
      setDebouncedSearch(newSearch);
    }
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
      updateURLParams({ page: '0', status: statusFilter, category: categoryFilter, search: searchTerm });
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

      // Use lightweight summary endpoint for better performance
      const response = await productService.getProductsSummary(params);
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
      ACTIVE: { label: 'Đang bán', className: 'badge-success' },
      INACTIVE: { label: 'Ngừng bán', className: 'badge-neutral' },
      SOLD_OUT: { label: 'Hết hàng', className: 'badge-warning' },
      EXPIRED: { label: 'Hết hạn', className: 'badge-error' },
      SUSPENDED: { label: 'Bị khóa', className: 'badge-error' },
      DELETED: { label: 'Đã xóa', className: 'badge-neutral' }
    };

    const config = statusMap[status] || { label: status, className: 'badge-neutral' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-primary mb-2 flex items-center">
            <Package className="w-8 h-8 mr-3 text-[#2F855A]" />
            Tất cả Sản phẩm
          </h1>
          <p className="text-muted">Tổng số: {totalElements.toLocaleString()} sản phẩm</p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-2 flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm sản phẩm
              </label>
              <input
                type="text"
                placeholder="Tên sản phẩm, SKU, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                  updateURLParams({ page: '0', status: e.target.value, category: categoryFilter, search: searchTerm });
                }}
                className="input-field w-full"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang bán</option>
                <option value="INACTIVE">Ngừng bán</option>
                <option value="SOLD_OUT">Hết hàng</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="SUSPENDED">Bị khóa</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchProducts}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F855A] mb-3"></div>
              <p className="text-light">Đang tải danh sách sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <Package className="w-16 h-16 text-light mb-4 opacity-50" />
              <p className="text-light text-lg mb-2">
                {debouncedSearch || statusFilter
                  ? 'Không tìm thấy sản phẩm nào phù hợp'
                  : 'Chưa có sản phẩm nào'}
              </p>
              <p className="text-muted text-sm">
                {debouncedSearch || statusFilter
                  ? 'Thử thay đổi điều kiện tìm kiếm'
                  : 'Sản phẩm sẽ xuất hiện ở đây khi được tạo'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#B7E4C7]">
                  <thead className="bg-surface-light">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Biến thể
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-[#B7E4C7]">
                    {products.map((product) => {
                      const primaryImage = (product.images || []).find(img => img.isPrimary) || (product.images || [])[0];
                      const firstVariant = (product.variants || [])[0];

                      return (
                        <tr key={product.productId} className="hover:bg-surface-light transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              {primaryImage && (
                                <img
                                  className="h-14 w-14 rounded-lg object-cover border border-default"
                                  src={primaryImage.imageUrl}
                                  alt={product.name}
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-text truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-muted line-clamp-2 mt-1">
                                  {product.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                            {product.categoryName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                            {product.supplierName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-[#2F855A]">
                              {firstVariant && formatCurrency(firstVariant.discountPrice || firstVariant.originalPrice)}
                            </div>
                            {firstVariant && firstVariant.discountPrice && (
                              <div className="text-xs text-light line-through">
                                {formatCurrency(firstVariant.originalPrice)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-text font-medium">
                              {product.variants?.length || 0} biến thể
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(product.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewDetail(product.productId)}
                                className="text-[#2F855A] hover:text-[#8FB491] p-2 rounded-lg hover:bg-[#E8FFED] transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {product.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleSuspendClick(product)}
                                  className="text-[#E63946] hover:text-[#FF6B35] p-2 rounded-lg hover:bg-[#FFE8E8] transition-colors"
                                  title="Đình chỉ sản phẩm"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                              {product.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => handleUnsuspendClick(product)}
                                  className="text-[#2F855A] hover:text-[#8FB491] p-2 rounded-lg hover:bg-[#E8FFED] transition-colors"
                                  title="Gỡ đình chỉ"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-surface-light px-6 py-4 flex items-center justify-between border-t border-default">
                  <div>
                    <p className="text-sm text-muted">
                      Hiển thị <span className="font-medium text-text">{page * size + 1}</span> đến{' '}
                      <span className="font-medium text-text">{Math.min((page + 1) * size, totalElements)}</span> trong tổng số{' '}
                      <span className="font-medium text-text">{totalElements}</span> sản phẩm
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                      <button
                        onClick={() => {
                          const newPage = Math.max(0, page - 1);
                          setPage(newPage);
                          updateURLParams({ page: newPage.toString(), status: statusFilter, category: categoryFilter, search: searchTerm });
                        }}
                        disabled={page === 0}
                        className="btn-secondary rounded-l-lg rounded-r-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Trước
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
                            onClick={() => {
                              setPage(pageNumber);
                              updateURLParams({ page: pageNumber.toString(), status: statusFilter, category: categoryFilter, search: searchTerm });
                            }}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${pageNumber === page
                                ? 'bg-[#2F855A] text-surface border-[#2F855A]'
                                : 'bg-surface text-text border-default hover:bg-surface-light'
                              }`}
                          >
                            {pageNumber + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          const newPage = Math.min(totalPages - 1, page + 1);
                          setPage(newPage);
                          updateURLParams({ page: newPage.toString(), status: statusFilter, category: categoryFilter, search: searchTerm });
                        }}
                        disabled={page >= totalPages - 1}
                        className="btn-secondary rounded-r-lg rounded-l-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau →
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
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-[#2D2D2D] bg-opacity-50" onClick={() => setShowSuspendModal(false)}></div>
            <div className="relative bg-surface rounded-lg max-w-lg w-full p-6 animate-scaleIn">
              <h3 className="heading-secondary mb-4 text-[#E63946]">Đình chỉ sản phẩm</h3>
              <p className="text-sm text-text mb-4">
                Bạn sắp đình chỉ sản phẩm: <strong className="text-[#E63946]">"{selectedProduct.name}"</strong>
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                  Lý do đình chỉ <span className="text-[#E63946]">*</span>
                </label>
                <textarea
                  className="input-field w-full"
                  rows={4}
                  placeholder="Nhập lý do đình chỉ sản phẩm..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 border border-default text-text rounded-lg hover:bg-surface-light transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={!suspendReason.trim()}
                  className="btn-primary bg-[#E63946] hover:bg-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-[#2D2D2D] bg-opacity-50" onClick={() => setShowUnsuspendModal(false)}></div>
            <div className="relative bg-surface rounded-lg max-w-lg w-full p-6 animate-scaleIn">
              <h3 className="heading-secondary mb-4 text-[#2F855A]">Gỡ bỏ đình chỉ</h3>
              <p className="text-sm text-text mb-6">
                Bạn sắp gỡ bỏ đình chỉ cho sản phẩm: <strong className="text-[#2F855A]">"{selectedProduct.name}"</strong>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUnsuspendModal(false)}
                  className="px-4 py-2 border border-default text-text rounded-lg hover:bg-surface-light transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUnsuspend}
                  className="btn-primary bg-[#2F855A] hover:bg-[#8FB491]"
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