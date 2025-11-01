import { X, Package, Calendar, Tag, Store, Image, Layers, BarChart3, Info } from 'lucide-react';
import type { ProductResponse } from '~/service/productService';

interface ProductDetailModalProps {
  product: ProductResponse;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getVariantStatus = (variant: any) => {
    if (variant.isExpired) return { label: 'Hết hạn', class: 'badge-error' };
    if (variant.isOutOfStock) return { label: 'Hết hàng', class: 'badge-warning' };
    if (variant.isAvailable) return { label: 'Còn hàng', class: 'badge-success' };
    return { label: 'Không xác định', class: 'badge-neutral' };
  };

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-default bg-surface-light">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="heading-secondary mb-1">Chi tiết sản phẩm</h2>
              <p className="text-sm text-muted">Xem đầy đủ thông tin sản phẩm và biến thể</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-text hover:bg-surface rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Column - Product Overview */}
            <div className="lg:col-span-1 space-y-6">
              {/* Product Image */}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text">Hình ảnh chính</h3>
                </div>
                {primaryImage ? (
                  <img
                    src={primaryImage.imageUrl}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-lg border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-full h-64 bg-surface-light rounded-lg border-2 border-dashed border-default flex flex-col items-center justify-center">
                    <Image className="w-12 h-12 text-light mb-2" />
                    <p className="text-sm text-light">Chưa có hình ảnh</p>
                  </div>
                )}
              </div>

              {/* Product Status & Info */}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text">Thông tin chung</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted mb-1">Trạng thái</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Danh mục</p>
                    <p className="font-medium text-text">{product.categoryName || 'Chưa phân loại'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Ngày tạo</p>
                    <p className="font-medium text-text flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {product.createdAt ? formatDate(product.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Summary */}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text">Tổng quan tồn kho</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-surface-light rounded-lg">
                    <div>
                      <p className="text-sm text-muted">Tổng tồn kho</p>
                      <p className="text-xl font-bold text-primary">{product.totalInventory || 0}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary/60" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-surface-light rounded-lg">
                    <div>
                      <p className="text-sm text-muted">Biến thể khả dụng</p>
                      <p className="text-xl font-bold text-secondary">
                        {product.availableVariantCount || 0}/{product.totalVariantCount || 0}
                      </p>
                    </div>
                    <Layers className="w-8 h-8 text-secondary/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Basic Info */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text">Thông tin cơ bản</h3>
                </div>
                <h1 className="text-2xl font-bold text-text mb-4">{product.name}</h1>
                
                {product.description && (
                  <div className="bg-surface-light rounded-lg p-4 border border-default">
                    <p className="text-sm font-medium text-text mb-2">Mô tả sản phẩm</p>
                    <p className="text-sm text-muted leading-relaxed">{product.description}</p>
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              {product.images && product.images.length > 1 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Image className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-text">Thư viện hình ảnh</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {product.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.imageUrl}
                          alt={`Product ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border-2 border-default group-hover:border-primary transition-colors cursor-pointer"
                        />
                        {img.isPrimary && (
                          <span className="absolute top-1 right-1 bg-primary text-surface text-xs px-2 py-1 rounded-full">
                            Chính
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attributes */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-text">Thuộc tính sản phẩm</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.attributes.map((attr, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-surface-light rounded-lg border border-default">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text">{attr.attributeName}</p>
                          <p className="text-sm text-muted mt-1">{attr.attributeValue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-text">
                      Biến thể sản phẩm ({product.variants.length})
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {product.variants.map((variant) => {
                      const variantStatus = getVariantStatus(variant);
                      return (
                        <div key={variant.variantId} className="border border-default rounded-lg overflow-hidden">
                          {/* Variant Header */}
                          <div className="bg-surface-light p-4 border-b border-default">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-text">{variant.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${variantStatus.class}`}>
                                    {variantStatus.label}
                                  </span>
                                </div>
                                <p className="text-sm text-muted">SKU: {variant.sku}</p>
                              </div>
                              
                              {/* Variant Images */}
                              {variant.variantImages && variant.variantImages.length > 0 && (
                                <div className="flex gap-2">
                                  {variant.variantImages.slice(0, 2).map((img, index) => (
                                    <img
                                      key={index}
                                      src={img.imageUrl}
                                      alt={`Variant ${index + 1}`}
                                      className="w-10 h-10 object-cover rounded border border-default"
                                    />
                                  ))}
                                  {variant.variantImages.length > 2 && (
                                    <div className="w-10 h-10 bg-surface rounded border border-default flex items-center justify-center text-xs text-muted">
                                      +{variant.variantImages.length - 2}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Variant Details */}
                          <div className="p-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-3 bg-surface-light rounded-lg">
                                <p className="text-xs text-muted mb-1">Giá gốc</p>
                                <p className="text-sm font-semibold text-text">{formatPrice(variant.originalPrice)}</p>
                              </div>
                              {variant.discountPrice && variant.discountPrice > 0 && (
                                <div className="text-center p-3 bg-surface-light rounded-lg">
                                  <p className="text-xs text-muted mb-1">Giá ưu đãi</p>
                                  <p className="text-sm font-semibold text-accent-red">{formatPrice(variant.discountPrice)}</p>
                                </div>
                              )}
                              {variant.manufacturingDate && (
                                <div className="text-center p-3 bg-surface-light rounded-lg">
                                  <p className="text-xs text-muted mb-1">Ngày SX</p>
                                  <p className="text-sm text-text flex items-center justify-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(variant.manufacturingDate)}
                                  </p>
                                </div>
                              )}
                              <div className="text-center p-3 bg-surface-light rounded-lg">
                                <p className="text-xs text-muted mb-1">Hạn SD</p>
                                <p className="text-sm text-text flex items-center justify-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(variant.expiryDate)}
                                </p>
                              </div>
                            </div>

                            {/* Store Stocks */}
                            {variant.storeStocks && variant.storeStocks.length > 0 && (
                              <div className="bg-surface-light rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Store className="w-4 h-4 text-secondary" />
                                  <p className="text-sm font-medium text-text">Tồn kho theo cửa hàng</p>
                                </div>
                                <div className="space-y-2">
                                  {variant.storeStocks.map((store) => (
                                    <div
                                      key={store.storeId}
                                      className="flex items-center justify-between p-3 bg-surface rounded-lg border border-default"
                                    >
                                      <span className="text-sm font-medium text-text">{store.storeName}</span>
                                      <div className="flex items-center gap-4">
                                        {store.priceOverride && (
                                          <span className="text-xs text-accent-warm bg-orange-50 px-2 py-1 rounded">
                                            {formatPrice(store.priceOverride)}
                                          </span>
                                        )}
                                        <span className={`text-sm font-semibold ${
                                          store.stockQuantity > 0 ? 'text-secondary' : 'text-accent-red'
                                        }`}>
                                          {store.stockQuantity > 0 ? `${store.stockQuantity} sản phẩm` : 'Hết hàng'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-default bg-surface-light">
          <div className="text-sm text-muted">
            Cập nhật lần cuối: {product.updatedAt ? formatDate(product.updatedAt) : 'N/A'}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              Đóng
            </button>
            <a href={`/products/edit/${product.productId}`} className="btn-primary">
              Chỉnh sửa sản phẩm
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}