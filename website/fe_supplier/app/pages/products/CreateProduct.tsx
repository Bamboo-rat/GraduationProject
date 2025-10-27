import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import productService from '~/service/productService';
import type {
  CreateProductRequest,
  ProductInfoRequest,
  ProductAttributeRequest,
  ProductVariantRequest,
  ProductImageRequest,
  StoreInventoryRequest,
} from '~/service/productService';
import categoryService from '~/service/categoryService';
import type { Category } from '~/service/categoryService';
import storeService from '~/service/storeService';
import type { StoreResponse } from '~/service/storeService';
import fileStorageService from '~/service/fileStorageService';
import { PlusCircle, Trash2, Upload, Image as ImageIcon, ArrowLeft } from 'lucide-react';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<StoreResponse[]>([]);

  // Form data matching backend CreateProductRequest
  const [productInfo, setProductInfo] = useState<ProductInfoRequest>({
    name: '',
    description: '',
    categoryId: '',
  });

  const [attributes, setAttributes] = useState<ProductAttributeRequest[]>([]);
  const [variants, setVariants] = useState<ProductVariantRequest[]>([
    {
      name: '',
      originalPrice: 0,
      discountPrice: 0,
      expiryDate: '',
      manufacturingDate: '',
    },
  ]);
  const [images, setImages] = useState<ProductImageRequest[]>([]);
  const [storeInventory, setStoreInventory] = useState<StoreInventoryRequest[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Load categories and stores
  useEffect(() => {
    loadCategories();
    loadStores();
  }, []);

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
      alert('Không thể tải danh mục');
    }
  };

  const loadStores = async () => {
    try {
      const response = await storeService.getMyStores({ page: 0, size: 100, status: 'ACTIVE' });
      // Ensure content is an array
      if (response && Array.isArray(response.content)) {
        setStores(response.content);
      } else {
        console.warn('Stores content is not an array:', response);
        setStores([]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]); // Set to empty array on error
      alert('Không thể tải danh sách cửa hàng');
    }
  };

  // Product Info Form
  const renderProductInfoForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Tên sản phẩm <span className="text-accent-red">*</span>
        </label>
        <input
          type="text"
          value={productInfo.name}
          onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
          className="input-field w-full"
          placeholder="VD: Sữa chua vị dâu Vinamilk 100ml"
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Mô tả sản phẩm
        </label>
        <textarea
          value={productInfo.description}
          onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })}
          className="input-field w-full resize-none"
          rows={4}
          placeholder="Mô tả chi tiết về sản phẩm..."
          maxLength={2000}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Danh mục <span className="text-accent-red">*</span>
        </label>
        <select
          value={productInfo.categoryId}
          onChange={(e) => setProductInfo({ ...productInfo, categoryId: e.target.value })}
          className="input-field w-full"
        >
          <option value="">-- Chọn danh mục --</option>
          {Array.isArray(categories) && categories.map((cat) => (
            <option key={cat.id} value={cat.id.toString()}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // Step 2: Attributes
  const addAttribute = () => {
    setAttributes([...attributes, { attributeName: '', attributeValue: '' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: 'attributeName' | 'attributeValue', value: string) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const renderAttributesForm = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted">Thêm các thuộc tính mô tả cho sản phẩm</p>
        <button
          type="button"
          onClick={addAttribute}
          className="btn-secondary flex items-center gap-2"
        >
          <PlusCircle size={18} /> Thêm thuộc tính
        </button>
      </div>

      {attributes.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-default rounded-lg bg-surface-light">
          <ImageIcon size={48} className="mx-auto text-light mb-2" />
          <p className="text-muted">Chưa có thuộc tính nào</p>
          <p className="text-light text-sm mt-1">Bấm "Thêm thuộc tính" để bắt đầu</p>
        </div>
      )}

      {attributes.map((attr, index) => (
        <div key={index} className="flex gap-3 items-start p-4 border border-default rounded-lg bg-surface card-hover">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Tên thuộc tính (VD: Thương hiệu, Xuất xứ)"
              value={attr.attributeName}
              onChange={(e) => updateAttribute(index, 'attributeName', e.target.value)}
              className="input-field"
              maxLength={100}
            />
            <input
              type="text"
              placeholder="Giá trị (VD: Vinamilk, Việt Nam)"
              value={attr.attributeValue}
              onChange={(e) => updateAttribute(index, 'attributeValue', e.target.value)}
              className="input-field"
              maxLength={500}
            />
          </div>
          <button
            type="button"
            onClick={() => removeAttribute(index)}
            className="text-accent-red hover:text-red-700 transition-colors p-2"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))}
    </div>
  );

  // Step 3: Variants
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: '',
        originalPrice: 0,
        discountPrice: 0,
        expiryDate: '',
        manufacturingDate: '',
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      alert('Phải có ít nhất 1 biến thể');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = <K extends keyof ProductVariantRequest>(index: number, field: K, value: ProductVariantRequest[K]) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value } as ProductVariantRequest;
    setVariants(updated);
  };

  const renderVariantsForm = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted">Thêm các biến thể (kích thước, hương vị, dung tích)</p>
        <button
          type="button"
          onClick={addVariant}
          className="btn-secondary flex items-center gap-2"
        >
          <PlusCircle size={18} /> Thêm biến thể
        </button>
      </div>

      {variants.map((variant, index) => (
        <div key={index} className="p-4 border border-default rounded-lg bg-surface card-hover space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-text">Biến thể {index + 1}</h3>
            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-accent-red hover:text-red-700 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Tên biến thể <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: 100ml, 200ml, vị dâu"
                value={variant.name}
                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                className="input-field w-full"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Giá gốc (VNĐ) <span className="text-accent-red">*</span>
              </label>
              <input
                type="number"
                placeholder="50000"
                value={variant.originalPrice || ''}
                onChange={(e) => updateVariant(index, 'originalPrice', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Giá giảm (VNĐ)
              </label>
              <input
                type="number"
                placeholder="30000"
                value={variant.discountPrice || ''}
                onChange={(e) => updateVariant(index, 'discountPrice', parseFloat(e.target.value) || 0)}
                className="input-field w-full"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Hạn sử dụng <span className="text-accent-red">*</span>
              </label>
              <input
                type="date"
                value={variant.expiryDate}
                onChange={(e) => updateVariant(index, 'expiryDate', e.target.value)}
                className="input-field w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Ngày sản xuất
              </label>
              <input
                type="date"
                value={variant.manufacturingDate || ''}
                onChange={(e) => updateVariant(index, 'manufacturingDate', e.target.value)}
                className="input-field w-full"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Step 4: Images
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      for (const file of Array.from(files)) {
        const validation = fileStorageService.validateFile(file, 5, ['image/jpeg', 'image/png', 'image/jpg']);
        if (!validation.valid) {
          alert(validation.error);
          continue;
        }

        const url = await fileStorageService.uploadProductImage(file);
        setImages((prev) => [
          ...prev,
          {
            imageUrl: url,
            isPrimary: prev.length === 0, // First image is primary
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // If removed image was primary, make first image primary
    if (updated.length > 0 && images[index].isPrimary) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  const setPrimaryImage = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setImages(updated);
  };

  const renderImagesForm = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-default rounded-lg p-8 text-center bg-surface-light transition-colors hover:border-primary">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
          disabled={uploadingImages}
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer flex flex-col items-center gap-3 ${uploadingImages ? 'opacity-50' : ''}`}
        >
          <Upload size={48} className="text-light" />
          <div>
            <p className="text-text font-medium">
              {uploadingImages ? 'Đang tải ảnh...' : 'Bấm để chọn ảnh hoặc kéo thả ảnh vào đây'}
            </p>
            <p className="text-sm text-muted mt-1">PNG, JPG, JPEG (tối đa 5MB mỗi ảnh)</p>
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group bg-surface rounded-lg border border-default overflow-hidden card-hover">
              <img
                src={img.imageUrl}
                alt={`Product ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1 bg-accent-red text-surface rounded hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="p-2 bg-surface-light">
                <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                  <input
                    type="radio"
                    name="primary-image"
                    checked={img.isPrimary}
                    onChange={() => setPrimaryImage(index)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className={img.isPrimary ? 'font-semibold text-primary' : ''}>
                    Ảnh chính
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Store Inventory Form
  const renderInventoryForm = () => (
    <div className="space-y-4">
      {stores.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-default rounded-lg bg-surface-light">
          <p className="text-muted">Bạn chưa có cửa hàng nào được kích hoạt.</p>
          <p className="text-light text-sm mt-1">Vui lòng tạo cửa hàng trước khi thêm tồn kho</p>
        </div>
      )}

      {stores.length > 0 && variants.map((variant, vIndex) => (
        <div key={vIndex} className="border border-default rounded-lg p-4 space-y-4 bg-surface card-hover">
          <h3 className="font-semibold text-text border-b border-default pb-2">
            📦 Biến thể: {variant.name || `Biến thể ${vIndex + 1}`}
          </h3>

          {stores.map((store) => {
            const inventoryKey = `${store.storeId}-${vIndex}`;
            const existingInventory = storeInventory.find(
              (inv) => inv.storeId === store.storeId && inv.variantSku === inventoryKey
            );

            return (
              <div key={store.storeId} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-surface-light rounded-lg">
                <div className="text-sm font-medium text-text">{store.name}</div>
                <div>
                  <label className="block text-xs text-muted mb-1">Số lượng</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={existingInventory?.stockQuantity || ''}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 0;
                      setStoreInventory((prev) => {
                        const filtered = prev.filter(
                          (inv) => !(inv.storeId === store.storeId && inv.variantSku === inventoryKey)
                        );
                        if (quantity > 0) {
                          return [
                            ...filtered,
                            {
                              storeId: store.storeId,
                              variantSku: inventoryKey, // Temporary key, backend will use actual SKU
                              stockQuantity: quantity,
                            },
                          ];
                        }
                        return filtered;
                      });
                    }}
                    className="input-field w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Giá đặc biệt (tùy chọn)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={existingInventory?.priceOverride || ''}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      setStoreInventory((prev) => {
                        const existing = prev.find(
                          (inv) => inv.storeId === store.storeId && inv.variantSku === inventoryKey
                        );
                        if (existing) {
                          return prev.map((inv) =>
                            inv.storeId === store.storeId && inv.variantSku === inventoryKey
                              ? { ...inv, priceOverride: price > 0 ? price : undefined }
                              : inv
                          );
                        }
                        return prev;
                      });
                    }}
                    className="input-field w-full"
                    min="0"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  // Validation
  const validateForm = () => {
    // Validate product info
    if (!productInfo.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return false;
    }
    if (!productInfo.categoryId) {
      alert('Vui lòng chọn danh mục');
      return false;
    }

    // Validate variants
    if (variants.length === 0) {
      alert('Phải có ít nhất 1 biến thể');
      return false;
    }

    for (const variant of variants) {
      if (!variant.name.trim()) {
        alert('Vui lòng nhập tên cho tất cả biến thể');
        return false;
      }
      if (variant.originalPrice <= 0) {
        alert('Giá gốc phải lớn hơn 0');
        return false;
      }
      if (!variant.expiryDate) {
        alert('Vui lòng nhập hạn sử dụng cho tất cả biến thể');
        return false;
      }
      // Check expiry date is in the future
      const expiryDate = new Date(variant.expiryDate);
      if (expiryDate <= new Date()) {
        alert('Hạn sử dụng phải là ngày trong tương lai');
        return false;
      }
    }

    return true;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Note: Backend auto-generates SKUs, so we need to pass empty storeInventory
      // or handle it differently. For now, we'll send an empty array.
      const request: CreateProductRequest = {
        product: productInfo,
        attributes: attributes.filter((a) => a.attributeName && a.attributeValue),
        variants: variants,
        images: images,
        storeInventory: [], // Backend requires SKUs which are auto-generated
      };

      await productService.createProduct(request);
      alert('Tạo sản phẩm thành công! Sản phẩm đã được kích hoạt.');
      navigate('/products/list');
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert('Lỗi khi tạo sản phẩm: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="heading-primary mb-2">Tạo sản phẩm mới</h1>
        <p className="text-muted">Điền đầy đủ thông tin sản phẩm bên dưới</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Basic Info */}
        <div className="card p-6">
          <h2 className="heading-secondary mb-4 pb-3 border-b border-default">
            1. Thông tin cơ bản <span className="text-accent-red">*</span>
          </h2>
          {renderProductInfoForm()}
        </div>

        {/* Attributes */}
        <div className="card p-6">
          <h2 className="heading-secondary mb-4 pb-3 border-b border-default">
            2. Thuộc tính sản phẩm <span className="text-light text-sm font-normal">(Tùy chọn)</span>
          </h2>
          {renderAttributesForm()}
        </div>

        {/* Variants */}
        <div className="card p-6">
          <h2 className="heading-secondary mb-4 pb-3 border-b border-default">
            3. Biến thể sản phẩm <span className="text-accent-red">*</span>
          </h2>
          {renderVariantsForm()}
        </div>

        {/* Images */}
        <div className="card p-6">
          <h2 className="heading-secondary mb-4 pb-3 border-b border-default">
            4. Hình ảnh sản phẩm <span className="text-light text-sm font-normal">(Tùy chọn)</span>
          </h2>
          {renderImagesForm()}
        </div>

        {/* Store Inventory */}
        <div className="card p-6">
          <h2 className="heading-secondary mb-4 pb-3 border-b border-default">
            5. Tồn kho tại cửa hàng <span className="text-light text-sm font-normal">(Tùy chọn)</span>
          </h2>
          {renderInventoryForm()}
        </div>

        {/* Action Buttons */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/products/list')}
              className="btn-secondary px-6 py-3 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                  Đang tạo sản phẩm...
                </span>
              ) : (
                'Tạo sản phẩm'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}