import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import productService from '~/service/productService';
import type { ProductResponse, UpdateProductRequest, StoreStockInfo } from '~/service/productService';
import categoryService from '~/service/categoryService';
import type { Category } from '~/service/categoryService';
import storeService from '~/service/storeService';
import type { StoreResponse } from '~/service/storeService';
import StockUpdateModal from '~/component/features/product/StockUpdateModal';
import { ArrowLeft, Package, Image, Layers, Tag, Store, Calendar, AlertCircle, Edit3 } from 'lucide-react';

export default function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [stores, setStores] = useState<StoreResponse[]>([]);

  // Stock update modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{
    variantId: string;
    variantName: string;
    store: StoreStockInfo;
  } | null>(null);

  // Form data
  const [formData, setFormData] = useState<UpdateProductRequest>({
    name: '',
    description: '',
    categoryId: '',
  });

  // Load product data
  useEffect(() => {
    if (productId) {
      loadProduct();
      loadCategories();
      loadStores();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoadingData(true);
      const data = await productService.getProductById(productId!);
      setProduct(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        categoryId: data.categoryId,
      });
    } catch (error: any) {
      console.error('Error loading product:', error);
      alert('Không thể tải thông tin sản phẩm: ' + (error.response?.data?.message || error.message));
      navigate('/products/list');
    } finally {
      setLoadingData(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.warn('Categories data is not an array:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadStores = async () => {
    try {
      const response = await storeService.getMyStores({ page: 0, size: 100, status: 'ACTIVE' });
      if (response && Array.isArray(response.content)) {
        setStores(response.content);
      } else {
        console.warn('Stores content is not an array:', response);
        setStores([]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!formData.categoryId) {
      alert('Vui lòng chọn danh mục');
      return;
    }

    setLoading(true);
    try {
      await productService.updateProduct(productId!, formData);
      alert('Cập nhật sản phẩm thành công!');
      navigate('/products/list');
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert('Lỗi khi cập nhật sản phẩm: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Open stock update modal
  const handleOpenStockModal = (variantId: string, variantName: string, store: StoreStockInfo) => {
    setSelectedStock({ variantId, variantName, store });
    setStockModalOpen(true);
  };

  // Confirm stock update
  const handleConfirmStockUpdate = async (newStock: number, note?: string) => {
    if (!selectedStock) return;

    try {
      const updatedProduct = await productService.updateVariantStock(
        productId!,
        selectedStock.variantId,
        selectedStock.store.storeId,
        newStock,
        note
      );
      
      setProduct(updatedProduct);
      alert('Cập nhật tồn kho thành công!');
    } catch (error: any) {
      console.error('Error updating stock:', error);
      throw new Error(error.response?.data?.message || 'Cập nhật tồn kho thất bại');
    }
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

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted ml-4">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted">Không tìm thấy sản phẩm</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/products/list')}
          className="btn-secondary mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </button>
        <h1 className="heading-primary mb-2">Chỉnh sửa sản phẩm</h1>
        <p className="text-muted">
          Chỉ có thể cập nhật thông tin cơ bản. Để thay đổi biến thể, hình ảnh hoặc thuộc tính, vui lòng xóa và tạo lại sản phẩm.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Product Info Form */}
        <div className="xl:col-span-2">
          <div className="card p-6">
            <h2 className="heading-secondary mb-4 flex items-center gap-2">
              <Edit3 size={20} className="text-primary" />
              Thông tin cơ bản
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tên sản phẩm <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="VD: Sữa chua vị dâu Vinamilk 100ml"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Mô tả sản phẩm
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full resize-none"
                  rows={6}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                  maxLength={2000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Danh mục <span className="text-accent-red">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-default">
                <button
                  type="button"
                  onClick={() => navigate('/products/list')}
                  className="btn-secondary px-6 py-2"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                      Đang lưu...
                    </span>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Product Preview */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stock Overview */}
          {(product.totalInventory !== undefined || product.availableVariantCount !== undefined) && (
            <div className="card p-6">
              <h3 className="heading-secondary mb-4 flex items-center gap-2">
                <Package size={20} className="text-primary" />
                Tổng quan tồn kho
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {product.totalInventory !== undefined && (
                  <div className="text-center p-4 bg-surface-light rounded-lg border border-default">
                    <p className="text-2xl font-bold text-primary mb-1">{product.totalInventory}</p>
                    <p className="text-sm text-muted">Tổng tồn kho</p>
                  </div>
                )}
                {product.availableVariantCount !== undefined && product.totalVariantCount !== undefined && (
                  <div className="text-center p-4 bg-surface-light rounded-lg border border-default">
                    <p className="text-2xl font-bold text-secondary mb-1">
                      {product.availableVariantCount}/{product.totalVariantCount}
                    </p>
                    <p className="text-sm text-muted">Biến thể khả dụng</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Images */}
          {product.images && product.images.length > 0 && (
            <div className="card p-6">
              <h3 className="heading-secondary mb-4 flex items-center gap-2">
                <Image size={20} className="text-primary" />
                Hình ảnh chung ({product.images.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {product.images.slice(0, 4).map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.imageUrl}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-default group-hover:border-primary transition-colors"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-2 right-2 bg-primary text-surface text-xs px-2 py-1 rounded-full">
                        Chính
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {product.images.length > 4 && (
                <div className="text-sm text-muted text-center mt-3">
                  +{product.images.length - 4} ảnh khác
                </div>
              )}
            </div>
          )}

          {/* Variants */}
          <div className="card p-6">
            <h3 className="heading-secondary mb-4 flex items-center gap-2">
              <Layers size={20} className="text-primary" />
              Biến thể ({product.variants.length})
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {product.variants.map((variant, index) => {
                const variantStatus = getVariantStatus(variant);
                return (
                  <div key={index} className="border border-default rounded-lg overflow-hidden">
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
                            {variant.variantImages.slice(0, 2).map((img, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={img.imageUrl}
                                alt={`Variant ${imgIndex + 1}`}
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
                      <div className="grid grid-cols-2 gap-4 mb-4">
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
                              <Calendar size={12} />
                              {formatDate(variant.manufacturingDate)}
                            </p>
                          </div>
                        )}
                        <div className="text-center p-3 bg-surface-light rounded-lg">
                          <p className="text-xs text-muted mb-1">Hạn SD</p>
                          <p className="text-sm text-text flex items-center justify-center gap-1">
                            <Calendar size={12} />
                            {formatDate(variant.expiryDate)}
                          </p>
                        </div>
                      </div>

                      {/* Store Stocks */}
                      <div className="bg-surface-light rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Store size={16} className="text-secondary" />
                          <p className="text-sm font-medium text-text">Tồn kho theo cửa hàng</p>
                        </div>
                        {stores.length === 0 ? (
                          <p className="text-sm text-light text-center py-2">Bạn chưa có cửa hàng nào</p>
                        ) : (
                          <div className="space-y-2">
                            {stores.map((store) => {
                              const existingStock = variant.storeStocks?.find(
                                (s) => s.storeId === store.storeId
                              );
                              const stockQuantity = existingStock?.stockQuantity || 0;

                              const storeStockInfo: StoreStockInfo = {
                                storeId: store.storeId,
                                storeName: store.storeName,
                                stockQuantity: stockQuantity,
                                priceOverride: existingStock?.priceOverride,
                              };

                              return (
                                <div key={store.storeId} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-default group hover:bg-surface-light transition-colors">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-text">{store.storeName}</span>
                                    <span className={`text-sm ml-2 ${
                                      stockQuantity > 0 ? 'text-secondary font-semibold' : 'text-light'
                                    }`}>
                                      {stockQuantity > 0 ? `${stockQuantity} sản phẩm` : '0 sản phẩm'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStockModal(variant.variantId, variant.name, storeStockInfo)}
                                    className="btn-secondary text-xs px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {stockQuantity > 0 ? 'Cập nhật' : 'Thêm'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attributes */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="card p-6">
              <h3 className="heading-secondary mb-4 flex items-center gap-2">
                <Tag size={20} className="text-primary" />
                Thuộc tính ({product.attributes.length})
              </h3>
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

          {/* Product Status */}
          <div className="card p-6">
            <h3 className="heading-secondary mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-primary" />
              Thông tin hệ thống
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Trạng thái:</span>
                <span className="text-sm font-medium text-text">{product.status}</span>
              </div>
              {product.createdAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Ngày tạo:</span>
                  <span className="text-sm text-text flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(product.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Update Modal */}
      {selectedStock && (
        <StockUpdateModal
          isOpen={stockModalOpen}
          onClose={() => {
            setStockModalOpen(false);
            setSelectedStock(null);
          }}
          onConfirm={handleConfirmStockUpdate}
          storeName={selectedStock.store.storeName}
          variantName={selectedStock.variantName}
          currentStock={selectedStock.store.stockQuantity}
        />
      )}
    </div>
  );
}