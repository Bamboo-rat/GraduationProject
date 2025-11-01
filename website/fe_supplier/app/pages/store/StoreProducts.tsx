import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import storeService from '~/service/storeService';
import type { StoreResponse } from '~/service/storeService';
import type { ProductResponse } from '~/service/productService';
import { ArrowLeft, Package, ShoppingBag, Layers, AlertCircle, Store } from 'lucide-react';

export default function StoreProducts() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (storeId) {
      loadStoreInfo();
      loadProducts();
    }
  }, [storeId, page]);

  const loadStoreInfo = async () => {
    try {
      const storeData = await storeService.getStoreById(storeId!);
      setStore(storeData);
    } catch (error: any) {
      console.error('Error loading store:', error);
      alert('Không thể tải thông tin cửa hàng: ' + error.message);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await storeService.getStoreProducts(storeId!, { page, size: pageSize });
      setProducts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('Error loading products:', error);
      alert('Không thể tải danh sách sản phẩm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getProductStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'Hoạt động', className: 'badge-success' },
      INACTIVE: { label: 'Tạm ngừng', className: 'badge-neutral' },
      SOLD_OUT: { label: 'Hết hàng', className: 'badge-warning' },
      EXPIRED: { label: 'Hết hạn', className: 'badge-error' },
      SUSPENDED: { label: 'Bị đình chỉ', className: 'badge-error' },
      DELETED: { label: 'Đã xóa', className: 'badge-neutral' },
    };
    return statusConfig[status] || { label: status, className: 'badge-neutral' };
  };

  if (!store) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted ml-4">Đang tải thông tin cửa hàng...</p>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/store/listStore')}
          className="btn-secondary mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách cửa hàng
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="heading-primary mb-2 flex items-center gap-3">
              <Store size={28} className="text-primary" />
              {store.storeName}
            </h1>
            <p className="text-muted">Danh sách sản phẩm có sẵn tại cửa hàng này</p>
          </div>
          {store.imageUrl && (
            <img
              src={store.imageUrl}
              alt={store.storeName}
              className="w-20 h-20 object-cover rounded-lg border-2 border-default"
            />
          )}
        </div>
      </div>

      {/* Store Info Card */}
      <div className="card p-6 mb-6">
        <h2 className="heading-secondary mb-4">Thông tin cửa hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted mb-1">Địa chỉ:</p>
            <p className="text-sm text-text">{store.address}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Số điện thoại:</p>
            <p className="text-sm text-text">{store.phoneNumber}</p>
          </div>
          {store.openTime && store.closeTime && (
            <div>
              <p className="text-sm text-muted mb-1">Giờ mở cửa:</p>
              <p className="text-sm text-text">{store.openTime} - {store.closeTime}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted mb-1">Trạng thái:</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${storeService.getStatusColorClass(store.status as any)}`}>
              {storeService.getStatusLabel(store.status as any)}
            </span>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-primary" />
            <div>
              <h2 className="heading-secondary">Sản phẩm tại cửa hàng</h2>
              <p className="text-sm text-muted">Tổng {totalElements} sản phẩm</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted ml-4">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-default rounded-lg bg-surface-light">
            <ShoppingBag size={48} className="mx-auto text-light mb-3" />
            <p className="text-muted mb-2">Chưa có sản phẩm nào tại cửa hàng này</p>
            <p className="text-sm text-light">Thêm tồn kho cho sản phẩm để hiển thị ở đây</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const statusBadge = getProductStatusBadge(product.status);
              const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

              return (
                <div key={product.productId} className="border border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                    {/* Product Image */}
                    <div className="flex items-center justify-center">
                      {primaryImage ? (
                        <img
                          src={primaryImage.imageUrl}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg border border-default"
                        />
                      ) : (
                        <div className="w-full h-32 bg-surface-light rounded-lg border border-default flex items-center justify-center">
                          <Package size={32} className="text-light" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="md:col-span-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text mb-1">{product.name}</h3>
                          <p className="text-sm text-muted line-clamp-2">{product.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className} ml-3`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Variants */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Layers size={14} className="text-secondary" />
                            <p className="text-xs font-medium text-text">
                              {product.variants.length} biến thể
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {product.variants.map((variant) => {
                              // Find stock for this store
                              const storeStock = variant.storeStocks?.find((s) => s.storeId === storeId);
                              const stockQuantity = storeStock?.stockQuantity || 0;

                              return (
                                <div key={variant.variantId} className="bg-surface-light p-3 rounded-lg border border-default">
                                  <p className="text-sm font-medium text-text mb-1">{variant.name}</p>
                                  <p className="text-xs text-muted mb-1">SKU: {variant.sku}</p>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      {variant.discountPrice && variant.discountPrice > 0 ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs line-through text-light">
                                            {formatPrice(variant.originalPrice)}
                                          </span>
                                          <span className="text-sm font-semibold text-accent-red">
                                            {formatPrice(variant.discountPrice)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-sm font-semibold text-text">
                                          {formatPrice(variant.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-xs font-medium ${stockQuantity > 0 ? 'text-secondary' : 'text-light'}`}>
                                      {stockQuantity} sp
                                    </div>
                                  </div>
                                  {variant.expiryDate && (
                                    <p className="text-xs text-muted mt-1">
                                      HSD: {formatDate(variant.expiryDate)}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Stock Overview */}
                      {(product.totalInventory !== undefined || product.availableVariantCount !== undefined) && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-default">
                          {product.totalInventory !== undefined && (
                            <div className="flex items-center gap-2">
                              <AlertCircle size={14} className="text-muted" />
                              <p className="text-xs text-muted">
                                Tổng tồn kho: <span className="font-medium text-text">{product.totalInventory}</span>
                              </p>
                            </div>
                          )}
                          {product.availableVariantCount !== undefined && product.totalVariantCount !== undefined && (
                            <div className="flex items-center gap-2">
                              <Layers size={14} className="text-muted" />
                              <p className="text-xs text-muted">
                                Biến thể khả dụng:{' '}
                                <span className="font-medium text-text">
                                  {product.availableVariantCount}/{product.totalVariantCount}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-default">
            <p className="text-sm text-muted">
              Hiển thị {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalElements)} trong tổng {totalElements} sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="text-sm text-text px-3">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
