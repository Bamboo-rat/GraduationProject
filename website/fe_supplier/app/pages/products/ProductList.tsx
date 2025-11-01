import { useState, useEffect } from 'react';
import productService from '~/service/productService';
import type { ProductResponse, ProductStatus, ProductListParams } from '~/service/productService';
import ProductDetailModal from '~/component/features/product/ProductDetailModal';

export default function ProductList() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: ProductListParams = {
        page: currentPage,
        size: 10,
      };

      if (statusFilter) {
        params.status = statusFilter as ProductStatus;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await productService.getMyProducts(params);

      setProducts(response.content);
      setTotalPages(response.page.totalPages);
      setTotalElements(response.page.totalElements);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchProducts();
  };

  const handleToggleStatus = async (productId: string, currentStatus: ProductStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'ẩn' : 'hiện';
    if (!confirm(`Bạn có chắc muốn ${action} sản phẩm này?`)) {
      return;
    }

    try {
      const makeActive = currentStatus !== 'ACTIVE';
      await productService.toggleProductVisibility(productId, makeActive);
      alert('Cập nhật trạng thái thành công');
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Lỗi khi cập nhật trạng thái: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      alert('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert('Lỗi khi xóa sản phẩm: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const statusConfig: Record<ProductStatus, { label: string; class: string }> = {
      ACTIVE: { label: 'Đang hoạt động', class: 'badge-success' },
      INACTIVE: { label: 'Đã ẩn', class: 'badge-neutral' },
      SOLD_OUT: { label: 'Hết hàng', class: 'badge-warning' },
      EXPIRED: { label: 'Hết hạn', class: 'badge-error' },
      SUSPENDED: { label: 'Bị tạm ngưng', class: 'badge-error' },
      DELETED: { label: 'Đã xóa', class: 'badge-neutral' },
    };

    const config = statusConfig[status] || { label: status, class: 'badge-neutral' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted animate-pulse">Đang tải danh sách sản phẩm...</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="heading-primary mb-2">Danh sách sản phẩm</h1>
        <p className="text-muted mb-6">Quản lý và theo dõi các sản phẩm của bạn</p>
        
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                !statusFilter ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                statusFilter === 'ACTIVE' ? 'btn-primary' : 'bg-surface border-default border text-text hover:bg-surface-light'
              }`}
            >
              Đang hoạt động
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                statusFilter === 'INACTIVE' ? 'btn-primary' : 'bg-surface border-default border text-text hover:bg-surface-light'
              }`}
            >
              Đã ẩn
            </button>
            <button
              onClick={() => setStatusFilter('SOLD_OUT')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                statusFilter === 'SOLD_OUT' ? 'btn-primary' : 'bg-surface border-default border text-text hover:bg-surface-light'
              }`}
            >
              Hết hàng
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                statusFilter === 'EXPIRED' ? 'btn-primary' : 'bg-surface border-default border text-text hover:bg-surface-light'
              }`}
            >
              Hết hạn
            </button>
          </div>

          {/* Search and Add Product */}
          <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field flex-1 min-w-[200px]"
              />
              <button
                onClick={handleSearch}
                className="btn-primary whitespace-nowrap"
              >
                Tìm kiếm
              </button>
            </div>
            <a
              href="/products/create"
              className="btn-secondary whitespace-nowrap text-center"
            >
              + Thêm sản phẩm
            </a>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-surface-light">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Hình ảnh
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Biến thể
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-lg mb-2">📦</div>
                      <p>Không tìm thấy sản phẩm nào</p>
                      <p className="text-sm text-light mt-1">Hãy thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  // Find primary image with fallback for both isPrimary and primary fields
                  // Also handle case where images array might be null/undefined
                  const primaryImage = product.images?.find((img: any) =>
                    img.isPrimary === true || img.primary === true
                  ) || product.images?.[0]; // Fallback to first image if no primary

                  return (
                    <tr key={product.productId} className="hover:bg-surface-light transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {primaryImage?.imageUrl ? (
                          <img
                            src={primaryImage.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 object-cover rounded-lg border border-default"
                            onError={(e) => {
                              // Handle broken image
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-12 w-12 bg-surface-light rounded-lg border border-default flex items-center justify-center ${primaryImage?.imageUrl ? 'hidden' : ''}`}>
                          <span className="text-light text-xs">📦</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-text">{product.name}</div>
                        {product.suspensionReason && (
                          <div className="text-xs text-accent-red mt-1">
                            ⚠️ Lý do tạm ngưng: {product.suspensionReason}
                          </div>
                        )}
                        {/* Stock Info */}
                        {product.totalInventory !== undefined && (
                          <div className="text-xs text-muted mt-1">
                            📦 Tồn kho: <span className="font-semibold text-secondary">{product.totalInventory}</span>
                            {product.availableVariantCount !== undefined && product.totalVariantCount !== undefined && (
                              <span className="ml-2">
                                ({product.availableVariantCount}/{product.totalVariantCount} biến thể khả dụng)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {product.categoryName || 'Chưa phân loại'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {product.totalVariantCount || product.variants?.length || 0} biến thể
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-primary hover:text-primary-dark transition-colors font-medium"
                          >
                            Chi tiết
                          </button>
                          <a
                            href={`/products/edit/${product.productId}`}
                            className="text-secondary hover:text-primary-dark transition-colors font-medium"
                          >
                            Sửa
                          </a>
                          {(product.status === 'ACTIVE' || product.status === 'INACTIVE') && (
                            <button
                              onClick={() => handleToggleStatus(product.productId, product.status)}
                              className="text-accent-warm hover:text-orange-600 transition-colors font-medium"
                            >
                              {product.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
                            </button>
                          )}
                          {product.status !== 'DELETED' && product.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleDelete(product.productId)}
                              className="text-accent-red hover:text-red-700 transition-colors font-medium"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="bg-surface-light px-6 py-4 flex items-center justify-between border-t border-default">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted">
                  Hiển thị <span className="font-semibold text-text">{currentPage * 10 + 1}</span> đến{' '}
                  <span className="font-semibold text-text">
                    {Math.min((currentPage + 1) * 10, totalElements)}
                  </span>{' '}
                  trong tổng số <span className="font-semibold text-text">{totalElements}</span> sản phẩm
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="btn-secondary rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-4 py-2 border text-sm font-medium transition-colors ${
                        currentPage === i
                          ? 'bg-primary text-surface border-primary-dark z-10'
                          : 'bg-surface border-default text-text hover:bg-surface-light'
                      } ${i === 0 ? 'rounded-l-lg' : ''} ${i === totalPages - 1 ? 'rounded-r-lg' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="btn-secondary rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}