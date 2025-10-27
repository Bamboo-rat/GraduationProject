import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import productService, {
  CreateProductRequest,
  ProductInfoRequest,
  ProductAttributeRequest,
  ProductVariantRequest,
  ProductImageRequest,
  StoreInventoryRequest,
} from '~/service/productService';
import categoryService, { Category } from '~/service/categoryService';
import storeService, { StoreResponse } from '~/service/storeService';
import fileStorageService from '~/service/fileStorageService';
import { PlusCircle, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Không thể tải danh mục');
    }
  };

  const loadStores = async () => {
    try {
      const response = await storeService.getMyStores({ page: 0, size: 100, status: 'ACTIVE' });
      setStores(response.content);
    } catch (error) {
      console.error('Error loading stores:', error);
      alert('Không thể tải danh sách cửa hàng');
    }
  };

  // Step 1: Product Info
  const renderProductInfoForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Bước 1: Thông tin cơ bản</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên sản phẩm <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={productInfo.name}
          onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="VD: Sữa chua vị dâu Vinamilk 100ml"
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả sản phẩm
        </label>
        <textarea
          value={productInfo.description}
          onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Mô tả chi tiết về sản phẩm..."
          maxLength={2000}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Danh mục <span className="text-red-500">*</span>
        </label>
        <select
          value={productInfo.categoryId}
          onChange={(e) => setProductInfo({ ...productInfo, categoryId: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Chọn danh mục --</option>
          {categories.map((cat) => (
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
        <h2 className="text-xl font-bold">Bước 2: Thuộc tính sản phẩm (Tùy chọn)</h2>
        <button
          onClick={addAttribute}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <PlusCircle size={18} /> Thêm thuộc tính
        </button>
      </div>

      {attributes.length === 0 && (
        <p className="text-gray-500">Chưa có thuộc tính. Bấm "Thêm thuộc tính" để thêm.</p>
      )}

      {attributes.map((attr, index) => (
        <div key={index} className="flex gap-2 items-start p-4 border rounded">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tên thuộc tính (VD: Thương hiệu, Xuất xứ)"
              value={attr.attributeName}
              onChange={(e) => updateAttribute(index, 'attributeName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-2"
              maxLength={100}
            />
            <input
              type="text"
              placeholder="Giá trị (VD: Vinamilk, Việt Nam)"
              value={attr.attributeValue}
              onChange={(e) => updateAttribute(index, 'attributeValue', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              maxLength={500}
            />
          </div>
          <button
            onClick={() => removeAttribute(index)}
            className="text-red-500 hover:text-red-700"
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

  const updateVariant = (index: number, field: keyof ProductVariantRequest, value: any) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const renderVariantsForm = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Bước 3: Biến thể sản phẩm <span className="text-red-500">*</span></h2>
        <button
          onClick={addVariant}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <PlusCircle size={18} /> Thêm biến thể
        </button>
      </div>

      {variants.map((variant, index) => (
        <div key={index} className="p-4 border rounded space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Biến thể {index + 1}</h3>
            {variants.length > 1 && (
              <button
                onClick={() => removeVariant(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên biến thể <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: 100ml, 200ml, vị dâu"
                value={variant.name}
                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá gốc (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="50000"
                value={variant.originalPrice || ''}
                onChange={(e) => updateVariant(index, 'originalPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá giảm (VNĐ)
              </label>
              <input
                type="number"
                placeholder="30000"
                value={variant.discountPrice || ''}
                onChange={(e) => updateVariant(index, 'discountPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hạn sử dụng <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={variant.expiryDate}
                onChange={(e) => updateVariant(index, 'expiryDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sản xuất
              </label>
              <input
                type="date"
                value={variant.manufacturingDate || ''}
                onChange={(e) => updateVariant(index, 'manufacturingDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
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
      <h2 className="text-xl font-bold mb-4">Bước 4: Hình ảnh sản phẩm (Tùy chọn)</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload size={48} className="text-gray-400" />
          <p className="text-sm text-gray-600">
            {uploadingImages ? 'Đang tải ảnh...' : 'Bấm để chọn ảnh hoặc kéo thả ảnh vào đây'}
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, JPEG (tối đa 5MB mỗi ảnh)</p>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img.imageUrl}
                alt={`Product ${index + 1}`}
                className="w-full h-32 object-cover rounded border"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => removeImage(index)}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-1">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name="primary-image"
                    checked={img.isPrimary}
                    onChange={() => setPrimaryImage(index)}
                  />
                  Ảnh chính
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step 5: Store Inventory
  const renderInventoryForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Bước 5: Tồn kho tại cửa hàng (Tùy chọn)</h2>

      {stores.length === 0 && (
        <p className="text-gray-500">Bạn chưa có cửa hàng nào được kích hoạt.</p>
      )}

      {stores.length > 0 && variants.map((variant, vIndex) => (
        <div key={vIndex} className="border rounded p-4 space-y-3">
          <h3 className="font-semibold">Biến thể: {variant.name || `Biến thể ${vIndex + 1}`}</h3>

          {stores.map((store) => {
            const inventoryKey = `${store.storeId}-${vIndex}`;
            const existingInventory = storeInventory.find(
              (inv) => inv.storeId === store.storeId && inv.variantSku === inventoryKey
            );

            return (
              <div key={store.storeId} className="grid grid-cols-3 gap-3 items-center">
                <div className="col-span-1 text-sm font-medium">{store.name}</div>
                <div>
                  <input
                    type="number"
                    placeholder="Số lượng"
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
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Giá đặc biệt (tùy chọn)"
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
                    className="w-full px-3 py-2 border rounded-md"
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
  const validateStep = () => {
    if (currentStep === 1) {
      if (!productInfo.name.trim()) {
        alert('Vui lòng nhập tên sản phẩm');
        return false;
      }
      if (!productInfo.categoryId) {
        alert('Vui lòng chọn danh mục');
        return false;
      }
    }

    if (currentStep === 3) {
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
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateStep()) return;

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tạo sản phẩm mới</h1>

      {/* Wizard Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 5 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between mb-8 text-sm">
        <div className={`flex-1 text-center ${currentStep === 1 ? 'font-semibold' : ''}`}>
          Thông tin cơ bản
        </div>
        <div className={`flex-1 text-center ${currentStep === 2 ? 'font-semibold' : ''}`}>
          Thuộc tính
        </div>
        <div className={`flex-1 text-center ${currentStep === 3 ? 'font-semibold' : ''}`}>
          Biến thể
        </div>
        <div className={`flex-1 text-center ${currentStep === 4 ? 'font-semibold' : ''}`}>
          Hình ảnh
        </div>
        <div className={`flex-1 text-center ${currentStep === 5 ? 'font-semibold' : ''}`}>
          Tồn kho
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {currentStep === 1 && renderProductInfoForm()}
        {currentStep === 2 && renderAttributesForm()}
        {currentStep === 3 && renderVariantsForm()}
        {currentStep === 4 && renderImagesForm()}
        {currentStep === 5 && renderInventoryForm()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Quay lại
        </button>

        {currentStep < 5 ? (
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tiếp theo →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>
        )}
      </div>
    </div>
  );
}
