import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import { productService, type Product } from '~/service/productService';
import Toast from '~/component/common/Toast';
import { ArrowLeft, Package, Store, Tag, Image as ImageIcon, Ban, CheckCircle } from 'lucide-react';

export default function ProductDetailRoute() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  const fetchProductDetail = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const response = await productService.getProductById(productId);
      setProduct(response.data);
    } catch (error: any) {
      console.error('Error fetching product details:', error);
      setToast({
        message: error.response?.data?.message || 'Không thể tải thông tin sản phẩm',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!product || !suspendReason.trim()) {
      setToast({ message: 'Vui lòng nhập lý do đình chỉ', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await productService.suspendProduct(product.productId, suspendReason);
      setToast({ message: 'Đã đình chỉ sản phẩm thành công', type: 'success' });
      setShowSuspendModal(false);
      setSuspendReason('');
      await fetchProductDetail();
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
    if (!product) return;

    try {
      setLoading(true);
      await productService.unsuspendProduct(product.productId);
      setToast({ message: 'Đã gỡ bỏ đình chỉ thành công', type: 'success' });
      setShowUnsuspendModal(false);
      await fetchProductDetail();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Không thể gỡ bỏ đình chỉ',
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
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

  if (loading) {
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

  if (!product) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">Không tìm thấy thông tin sản phẩm</div>
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/products/list-products')}
              className="text-blue-600 hover:text-blue-800"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const images = product.images || [];
  const variants = product.variants || [];
  const attributes = product.attributes || [];
  const primaryImage = images.find(img => img.isPrimary) || images[0];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/products/list-products')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chi tiết Sản phẩm</h1>
              <p className="text-gray-600 mt-1">{product.name}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {product.status === 'ACTIVE' && (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <Ban className="w-4 h-4 mr-2" />
                Đình chỉ
              </button>
            )}
            {product.status === 'SUSPENDED' && (
              <button
                onClick={() => setShowUnsuspendModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Gỡ đình chỉ
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin sản phẩm
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tên sản phẩm</label>
                  <p className="mt-1 text-gray-900 font-medium">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mô tả</label>
                  <p className="mt-1 text-gray-900">{product.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Danh mục</label>
                    <p className="mt-1 text-gray-900">{product.categoryName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nhà cung cấp</label>
                    <p className="mt-1 text-gray-900">{product.supplierName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Variants */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-blue-600" />
                Biến thể sản phẩm ({variants.length})
              </h2>
              {variants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Chưa có biến thể nào</p>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div key={variant.variantId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{variant.name}</h3>
                        <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Giá gốc:</span>
                          <p className="font-medium">{formatCurrency(variant.originalPrice)}</p>
                        </div>
                        {variant.discountPrice && (
                          <div>
                            <span className="text-gray-500">Giá giảm:</span>
                            <p className="font-medium text-green-600">{formatCurrency(variant.discountPrice)}</p>
                          </div>
                        )}
                        {variant.manufacturingDate && (
                          <div>
                            <span className="text-gray-500">NSX:</span>
                            <p className="font-medium">{new Date(variant.manufacturingDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                        )}
                        {variant.expiryDate && (
                          <div>
                            <span className="text-gray-500">HSD:</span>
                            <p className="font-medium">{new Date(variant.expiryDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Attributes */}
            {attributes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Thuộc tính</h2>
                <div className="grid grid-cols-2 gap-3">
                  {product.attributes.map((attr) => (
                    <div key={attr.attributeId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">{attr.attributeName}</span>
                      <span className="text-sm text-gray-900">{attr.attributeValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Images */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                Hình ảnh
              </h3>
              {primaryImage ? (
                <>
                  <img
                    src={primaryImage.imageUrl}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-lg mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.png';
                    }}
                  />
                  {images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.slice(1).map((img) => (
                        <img
                          key={img.imageId}
                          src={img.imageUrl}
                          alt={product.name}
                          className="w-full h-20 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.png';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">Chưa có hình ảnh</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Trạng thái</h3>
              <div className="text-center">
                {getStatusBadge(product.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowSuspendModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Đình chỉ sản phẩm</h3>
              <p className="text-sm text-gray-500 mb-4">
                Đình chỉ sản phẩm <strong>{product.name}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do đình chỉ *</label>
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
      {showUnsuspendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowUnsuspendModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gỡ bỏ đình chỉ</h3>
              <p className="text-sm text-gray-500 mb-4">
                Gỡ bỏ đình chỉ cho sản phẩm <strong>{product.name}</strong>?
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
