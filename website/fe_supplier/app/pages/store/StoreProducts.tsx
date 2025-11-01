import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import storeService from '~/service/storeService';
import type { StoreResponse } from '~/service/storeService';
import type { ProductResponse } from '~/service/productService';
import type { StoreProductVariantResponse } from '~/service/storeService';
import { ArrowLeft, Package, ShoppingBag, Layers, AlertCircle, Store } from 'lucide-react';

export default function StoreProducts() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [storeProducts, setStoreProducts] = useState<StoreProductVariantResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (storeId) {
      loadStoreInfo();
      loadStoreProducts();
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

  const loadStoreProducts = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      // Use management endpoint for suppliers - works for stores in ANY status
      // (PENDING, ACTIVE, SUSPENDED, REJECTED, etc.)
      const response = await storeService.getStoreProductVariantsForManagement(storeId, {
        page,
        size: pageSize,
        sortBy: 'createdAt',
        sortDirection: 'DESC'
      });

      if (response && Array.isArray(response.content)) {
        setStoreProducts(response.content);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      console.error('Error loading store product variants:', error);
      alert('Không thể tải danh sách biến thể sản phẩm của cửa hàng');
    } finally {
      setLoading(false);
    }
  };  const formatPrice = (price: number) => {
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
            <p className="text-muted ml-4">Đang tải biến thể sản phẩm...</p>
          </div>
        ) : storeProducts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-default rounded-lg bg-surface-light">
            <ShoppingBag size={48} className="mx-auto text-light mb-3" />
            <p className="text-muted mb-2">Chưa có biến thể sản phẩm nào tại cửa hàng này</p>
            <p className="text-sm text-light">Thêm tồn kho cho các biến thể sản phẩm để hiển thị ở đây</p>
          </div>
        ) : (
          <div className="space-y-3">
            {storeProducts.map((variantProduct) => {
              // Find primary image with fallback for both isPrimary and primary fields
              const primaryImage = variantProduct.variantImages?.find((img: any) =>
                img.isPrimary === true || img.primary === true
              ) || variantProduct.variantImages?.[0];
              const isExpired = variantProduct.expiryDate && new Date(variantProduct.expiryDate) < new Date();
              const isOutOfStock = variantProduct.stockQuantity === 0;

              return (
                <div 
                  key={variantProduct.variantId} 
                  className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                    isExpired || isOutOfStock ? 'opacity-60 border-light' : 'border-default'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
                    {/* Variant Image */}
                    <div className="flex items-center justify-center">
                      {primaryImage ? (
                        <img
                          src={primaryImage.imageUrl}
                          alt={variantProduct.variantName}
                          className="w-full h-28 object-cover rounded-lg border border-default"
                        />
                      ) : (
                        <div className="w-full h-28 bg-surface-light rounded-lg border border-default flex items-center justify-center">
                          <Package size={28} className="text-light" />
                        </div>
                      )}
                    </div>

                    {/* Variant Details */}
                    <div className="md:col-span-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {/* Product Name & Category */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-text">{variantProduct.productName}</h3>
                            <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded">
                              {variantProduct.categoryName}
                            </span>
                          </div>
                          
                          {/* Variant Name */}
                          <div className="flex items-center gap-2 mb-1">
                            <Layers size={14} className="text-muted" />
                            <p className="text-sm font-medium text-muted">
                              Biến thể: {variantProduct.variantName}
                            </p>
                          </div>
                          
                          {/* SKU */}
                          <p className="text-xs text-light">SKU: {variantProduct.sku}</p>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col gap-1 items-end ml-3">
                          {isExpired && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Hết hạn
                            </span>
                          )}
                          {isOutOfStock && !isExpired && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Hết hàng
                            </span>
                          )}
                          {variantProduct.isAvailable && !isExpired && !isOutOfStock && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Còn hàng
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Stock Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        {/* Price */}
                        <div className="bg-surface-light p-3 rounded-lg">
                          <p className="text-xs text-muted mb-1">Giá bán</p>
                          <div className="flex flex-col">
                            {variantProduct.priceOverride ? (
                              <>
                                <span className="text-sm font-semibold text-accent-red">
                                  {formatPrice(variantProduct.priceOverride)}
                                </span>
                                <span className="text-xs line-through text-light">
                                  {formatPrice(variantProduct.originalPrice)}
                                </span>
                              </>
                            ) : variantProduct.discountPrice ? (
                              <>
                                <span className="text-sm font-semibold text-accent-red">
                                  {formatPrice(variantProduct.discountPrice)}
                                </span>
                                <span className="text-xs line-through text-light">
                                  {formatPrice(variantProduct.originalPrice)}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-text">
                                {formatPrice(variantProduct.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="bg-surface-light p-3 rounded-lg">
                          <p className="text-xs text-muted mb-1">Tồn kho</p>
                          <p className={`text-lg font-semibold ${
                            variantProduct.stockQuantity > 10 ? 'text-secondary' : 
                            variantProduct.stockQuantity > 0 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {variantProduct.stockQuantity} sản phẩm
                          </p>
                        </div>

                        {/* Expiry Date */}
                        <div className="bg-surface-light p-3 rounded-lg">
                          <p className="text-xs text-muted mb-1">Hạn sử dụng</p>
                          {variantProduct.expiryDate ? (
                            <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-text'}`}>
                              {formatDate(variantProduct.expiryDate)}
                            </p>
                          ) : (
                            <p className="text-sm text-light">Không có</p>
                          )}
                        </div>
                      </div>
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
