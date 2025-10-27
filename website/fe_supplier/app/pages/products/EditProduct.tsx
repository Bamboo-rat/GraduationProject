import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import productService  from '~/service/productService';
import type { ProductResponse, UpdateProductRequest } from '~/service/productService';
import categoryService from '~/service/categoryService';
import type { Category } from '~/service/categoryService';

export default function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductResponse | null>(null);

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
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.warn('Categories data is not an array:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]); // Set to empty array on error
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

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Không tìm thấy sản phẩm</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa sản phẩm</h1>
        <p className="text-sm text-gray-500 mt-1">
          Chỉ có thể cập nhật thông tin cơ bản. Để thay đổi biến thể, hình ảnh hoặc thuộc tính, vui lòng xóa và tạo lại sản phẩm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: Sữa chua vị dâu Vinamilk 100ml"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả sản phẩm
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Mô tả chi tiết về sản phẩm..."
                maxLength={2000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {Array.isArray(categories) && categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/products/list')}
                className="px-6 py-2 border rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>

        {/* Product Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin hiện tại</h2>

            {/* Images */}
            {product.images && product.images.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                <div className="grid grid-cols-2 gap-2">
                  {product.images.slice(0, 4).map((img, index) => (
                    <img
                      key={index}
                      src={img.imageUrl}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biến thể ({product.variants.length})
              </label>
              <div className="space-y-2">
                {product.variants.slice(0, 3).map((variant, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">{variant.name}</div>
                    <div className="text-gray-600">SKU: {variant.sku}</div>
                    <div className="text-gray-600">
                      Giá: {variant.originalPrice.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                ))}
                {product.variants.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    Và {product.variants.length - 3} biến thể khác...
                  </div>
                )}
              </div>
            </div>

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Thuộc tính</label>
                <div className="space-y-1 text-sm">
                  {product.attributes.map((attr, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{attr.attributeName}:</span>
                      <span className="font-medium">{attr.attributeValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trạng thái:</span>
                <span className="font-medium">{product.status}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Ngày tạo:</span>
                <span>{new Date(product.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
