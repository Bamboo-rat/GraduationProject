import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import productService from '~/service/productService';
import type {
  ProductFullUpdateRequest,
  ProductInfoRequest,
  AttributeUpdateRequest,
  VariantUpdateRequest,
  ImageUpdateRequest,
  StoreInventoryUpdateRequest,
  ProductResponse,
} from '~/service/productService';

// Local interface for form state (includes UI-only fields)
interface VariantFormData extends Omit<VariantUpdateRequest, 'variantImages' | 'storeInventory'> {
  // State stores images and inventory separately
}
import fileStorageService from '~/service/fileStorageService';
import { PlusCircle, Trash2, Upload, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Toast, { type ToastType } from '~/component/common/Toast';
import { useFormProtection } from '~/utils/useFormProtection';
import { useCategories } from '~/hooks/useCategories';
import { useAllActiveStores } from '~/hooks/useStores';

export default function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Use React Query hooks for cached data
  const { data: categories = [], isLoading: loadingCategories, error: categoriesError } = useCategories();
  const { data: stores = [], isLoading: loadingStores, error: storesError } = useAllActiveStores();

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  // Form data matching backend CreateProductRequest
  const [productInfo, setProductInfo] = useState<ProductInfoRequest>({
    name: '',
    description: '',
    categoryId: '',
  });

  const [attributes, setAttributes] = useState<AttributeUpdateRequest[]>([]);
  const [variants, setVariants] = useState<VariantFormData[]>([
    {
      name: '',
      originalPrice: 0,
      discountPrice: 0,
      expiryDate: '',
      manufacturingDate: '',
    },
  ]);
  const [productImages, setProductImages] = useState<ImageUpdateRequest[]>([]); // Ảnh chung sản phẩm
  const [variantImages, setVariantImages] = useState<{ [variantIndex: number]: ImageUpdateRequest[] }>({}); // Ảnh từng biến thể
  // Store inventory keyed by variantIndex-storeId
  const [storeInventory, setStoreInventory] = useState<{ [key: string]: StoreInventoryUpdateRequest[] }>({});
  const [uploadingImages, setUploadingImages] = useState<{ type: 'product' | 'variant'; index?: number } | null>(null);

  // Load existing product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        showToast('Không tìm thấy ID sản phẩm', 'error');
        navigate('/products/list');
        return;
      }

      setLoadingData(true);
      try {
        const product = await productService.getProductById(productId);
        
        // Map product info
        setProductInfo({
          name: product.name,
          description: product.description || '',
          categoryId: product.categoryId,
        });

        // Map attributes
        if (product.attributes && product.attributes.length > 0) {
          setAttributes(
            product.attributes.map((attr: any) => ({
              attributeId: attr.attributeId,
              attributeName: attr.attributeName,
              attributeValue: attr.attributeValue,
              delete: false,
            }))
          );
        }

        // Map product images
        if (product.images && product.images.length > 0) {
          setProductImages(
            product.images.map((img: any) => ({
              imageId: img.imageId,
              imageUrl: img.imageUrl,
              primary: img.primary,
              delete: false,
            }))
          );
        }

        // Map variants
        if (product.variants && product.variants.length > 0) {
          const mappedVariants: VariantFormData[] = product.variants.map((variant: any) => ({
            variantId: variant.variantId,
            name: variant.name,
            sku: variant.sku,
            originalPrice: variant.originalPrice,
            discountPrice: variant.discountPrice,
            manufacturingDate: variant.manufacturingDate,
            expiryDate: variant.expiryDate,
            delete: false,
          }));
          setVariants(mappedVariants);

          // Map variant images
          const mappedVariantImages: { [key: number]: ImageUpdateRequest[] } = {};
          product.variants.forEach((variant: any, index: number) => {
            if (variant.variantImages && variant.variantImages.length > 0) {
              mappedVariantImages[index] = variant.variantImages.map((img: any) => ({
                imageId: img.imageId,
                imageUrl: img.imageUrl,
                primary: img.primary,
                delete: false,
              }));
            }
          });
          setVariantImages(mappedVariantImages);

          // Map store inventory
          const mappedInventory: { [key: string]: StoreInventoryUpdateRequest[] } = {};
          product.variants.forEach((variant: any, index: number) => {
            if (variant.storeStocks && variant.storeStocks.length > 0) {
              mappedInventory[index.toString()] = variant.storeStocks.map((stock: any) => ({
                storeId: stock.storeId || stock.store?.storeId, // Handle both direct storeId and nested store.storeId
                stockQuantity: stock.stockQuantity,
                priceOverride: stock.priceOverride,
              }));
            }
          });
          setStoreInventory(mappedInventory);
        }

        showToast('Đã tải dữ liệu sản phẩm', 'success');
      } catch (error: any) {
        console.error('Error loading product:', error);
        showToast('Lỗi khi tải sản phẩm: ' + (error.response?.data?.message || error.message), 'error');
        navigate('/products/list');
      } finally {
        setLoadingData(false);
      }
    };

    loadProduct();
  }, [productId, navigate]);

  // Track if form is dirty (has unsaved changes)
  const isDirty = useMemo(() => {
    return (
      productInfo.name !== '' ||
      productInfo.description !== '' ||
      productInfo.categoryId !== '' ||
      attributes.length > 0 ||
      variants.length > 1 ||
      variants[0].name !== '' ||
      variants[0].originalPrice !== 0 ||
      productImages.length > 0 ||
      Object.keys(variantImages).length > 0 ||
      Object.keys(storeInventory).length > 0
    );
  }, [productInfo, attributes, variants, productImages, variantImages, storeInventory]);

  // Restore form data from backup
  const restoreFormData = (backup: any) => {
    if (backup.productInfo) setProductInfo(backup.productInfo);
    if (backup.attributes) setAttributes(backup.attributes);
    if (backup.variants) setVariants(backup.variants);
    if (backup.productImages) setProductImages(backup.productImages);
    if (backup.variantImages) setVariantImages(backup.variantImages);
    if (backup.storeInventory) setStoreInventory(backup.storeInventory);
    showToast('Đã khôi phục dữ liệu form', 'success');
  };

  // Form protection hook
  const { clearBackup } = useFormProtection({
    formData: {
      productInfo,
      attributes,
      variants,
      productImages,
      variantImages,
      storeInventory,
    },
    isDirty,
    storageKey: 'create-product-backup',
    autoSaveInterval: 30000, // 30 seconds
    onRestore: restoreFormData,
  });
  
  // Show error toast if data loading fails
  if (categoriesError) {
    showToast('Không thể tải danh mục: ' + (categoriesError as any).message, 'error');
  }
  if (storesError) {
    showToast('Không thể tải danh sách cửa hàng: ' + (storesError as any).message, 'error');
  }

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
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.name}
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
      showToast('Phải có ít nhất 1 biến thể', 'warning');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
    const updatedVariantImages = { ...variantImages };
    delete updatedVariantImages[index];
    const reindexed: { [key: number]: ImageUpdateRequest[] } = {};
    Object.keys(updatedVariantImages).forEach((key) => {
      const oldIndex = parseInt(key);
      const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
      reindexed[newIndex] = updatedVariantImages[oldIndex];
    });
    setVariantImages(reindexed);
    
    // Remove inventory for deleted variant and reindex remaining
    setStoreInventory((prevInventory) => {
      const updated: { [key: string]: StoreInventoryUpdateRequest[] } = {};
      Object.entries(prevInventory).forEach(([key, invs]) => {
        const vIndex = parseInt(key);
        if (vIndex === index) return; // Skip deleted variant
        const newIndex = vIndex > index ? vIndex - 1 : vIndex;
        updated[newIndex.toString()] = invs;
      });
      return updated;
    });
  };

  const updateVariant = <K extends keyof VariantFormData>(index: number, field: K, value: VariantFormData[K]) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value } as VariantFormData;
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

          {/* Ảnh riêng cho biến thể này */}
          <div className="mt-4 pt-4 border-t border-default">
            <label className="block text-sm font-medium text-text mb-3">
              📸 Ảnh riêng cho biến thể này <span className="text-light text-xs font-normal">(Tùy chọn)</span>
            </label>
            
            {/* Upload button */}
            <div className="mb-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleVariantImageUpload(e, index)}
                className="hidden"
                id={`variant-image-upload-${index}`}
                disabled={uploadingImages?.type === 'variant' && uploadingImages.index === index}
              />
              <label
                htmlFor={`variant-image-upload-${index}`}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-surface-light border border-default rounded-lg cursor-pointer hover:bg-surface transition-colors ${
                  uploadingImages?.type === 'variant' && uploadingImages.index === index ? 'opacity-50' : ''
                }`}
              >
                <Upload size={16} />
                <span className="text-sm">
                  {uploadingImages?.type === 'variant' && uploadingImages.index === index ? 'Đang tải...' : 'Tải ảnh lên'}
                </span>
              </label>
            </div>

            {/* Image grid */}
            {variantImages[index] && variantImages[index].length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {variantImages[index].map((img, imgIndex) => (
                  <div key={imgIndex} className="relative group bg-surface rounded border border-default overflow-hidden">
                    <img
                      src={img.imageUrl}
                      alt={`Variant ${index + 1} - ${imgIndex + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removeVariantImage(index, imgIndex)}
                        className="p-1 bg-accent-red text-surface rounded hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {img.isPrimary && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-surface text-xs text-center py-0.5">
                        Ảnh chính
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(!variantImages[index] || variantImages[index].length === 0) && (
              <p className="text-xs text-muted italic">Chưa có ảnh cho biến thể này</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Step 4: Product-level Images (Ảnh chung)
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages({ type: 'product' });
    try {
      for (const file of Array.from(files)) {
        const validation = fileStorageService.validateFile(file, 5, ['image/jpeg', 'image/png', 'image/jpg']);
        if (!validation.valid) {
          showToast(validation.error || 'File không hợp lệ', 'error');
          continue;
        }

        const url = await fileStorageService.uploadProductImage(file);
        setProductImages((prev) => [
          ...prev,
          {
            imageUrl: url,
            isPrimary: prev.length === 0, // First image is primary
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      showToast('Lỗi khi tải ảnh: ' + error.message, 'error');
    } finally {
      setUploadingImages(null);
    }
  };

  const removeProductImage = (index: number) => {
    const updated = productImages.filter((_, i) => i !== index);
    // If removed image was primary, make first image primary
    if (updated.length > 0 && productImages[index].isPrimary) {
      updated[0].isPrimary = true;
    }
    setProductImages(updated);
  };

  const setPrimaryProductImage = (index: number) => {
    const updated = productImages.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setProductImages(updated);
  };

  // Variant-level Images (Ảnh riêng biến thể)
  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages({ type: 'variant', index: variantIndex });
    try {
      const newImages: ImageUpdateRequest[] = [];
      for (const file of Array.from(files)) {
        const validation = fileStorageService.validateFile(file, 5, ['image/jpeg', 'image/png', 'image/jpg']);
        if (!validation.valid) {
          showToast(validation.error || 'File không hợp lệ', 'error');
          continue;
        }

        const url = await fileStorageService.uploadProductImage(file);
        newImages.push({
          imageUrl: url,
          isPrimary: false,
        });
      }

      setVariantImages((prev) => {
        const currentImages = prev[variantIndex] || [];
        const updatedImages = [...currentImages, ...newImages];
        // If this is the first image, make it primary
        if (currentImages.length === 0 && updatedImages.length > 0) {
          updatedImages[0].isPrimary = true;
        }
        return {
          ...prev,
          [variantIndex]: updatedImages,
        };
      });
    } catch (error: any) {
      console.error('Error uploading variant images:', error);
      showToast('Lỗi khi tải ảnh: ' + error.message, 'error');
    } finally {
      setUploadingImages(null);
    }
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariantImages((prev) => {
      const currentImages = prev[variantIndex] || [];
      const updated = currentImages.filter((_, i) => i !== imageIndex);
      // If removed image was primary, make first image primary
      if (updated.length > 0 && currentImages[imageIndex].isPrimary) {
        updated[0].isPrimary = true;
      }
      return {
        ...prev,
        [variantIndex]: updated,
      };
    });
  };

  const renderProductImagesForm = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted mb-3">
        Ảnh chung sẽ hiển thị cho tất cả biến thể. Bạn cũng có thể thêm ảnh riêng cho từng biến thể ở bước 3.
      </p>

      <div className="border-2 border-dashed border-default rounded-lg p-8 text-center bg-surface-light transition-colors hover:border-primary">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleProductImageUpload}
          className="hidden"
          id="product-image-upload"
          disabled={uploadingImages?.type === 'product'}
        />
        <label
          htmlFor="product-image-upload"
          className={`cursor-pointer flex flex-col items-center gap-3 ${uploadingImages?.type === 'product' ? 'opacity-50' : ''}`}
        >
          <Upload size={48} className="text-light" />
          <div>
            <p className="text-text font-medium">
              {uploadingImages?.type === 'product' ? 'Đang tải ảnh...' : 'Bấm để chọn ảnh chung cho sản phẩm'}
            </p>
            <p className="text-sm text-muted mt-1">PNG, JPG, JPEG (tối đa 5MB mỗi ảnh)</p>
          </div>
        </label>
      </div>

      {productImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {productImages.map((img, index) => (
            <div key={index} className="relative group bg-surface rounded-lg border border-default overflow-hidden card-hover">
              <img
                src={img.imageUrl}
                alt={`Product ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => removeProductImage(index)}
                  className="p-1 bg-accent-red text-surface rounded hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="p-2 bg-surface-light">
                <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                  <input
                    type="radio"
                    name="primary-product-image"
                    checked={img.isPrimary}
                    onChange={() => setPrimaryProductImage(index)}
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
            const variantInventory = storeInventory[vIndex.toString()] || [];
            const existingInventory = variantInventory.find((inv) => inv.storeId === store.storeId);

            return (
              <div key={store.storeId} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-surface-light rounded-lg">
                <div className="text-sm font-medium text-text">{store.storeName}</div>
                <div>
                  <label className="block text-xs text-muted mb-1">Số lượng</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={existingInventory?.stockQuantity || ''}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 0;
                      setStoreInventory((prev) => {
                        const updated = { ...prev };
                        const key = vIndex.toString();
                        const variantInvs = updated[key] || [];
                        const filtered = variantInvs.filter((inv) => inv.storeId !== store.storeId);
                        
                        if (quantity > 0) {
                          updated[key] = [
                            ...filtered,
                            {
                              storeId: store.storeId,
                              stockQuantity: quantity,
                            },
                          ];
                        } else {
                          updated[key] = filtered;
                        }
                        return updated;
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
                        const updated = { ...prev };
                        const key = vIndex.toString();
                        const variantInvs = updated[key] || [];
                        const existing = variantInvs.find((inv) => inv.storeId === store.storeId);
                        
                        if (existing) {
                          updated[key] = variantInvs.map((inv) =>
                            inv.storeId === store.storeId
                              ? { ...inv, priceOverride: price > 0 ? price : undefined }
                              : inv
                          );
                        }
                        return updated;
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
      showToast('Vui lòng nhập tên sản phẩm', 'warning');
      return false;
    }
    if (!productInfo.categoryId) {
      showToast('Vui lòng chọn danh mục', 'warning');
      return false;
    }

    // Validate variants
    if (variants.length === 0) {
      showToast('Phải có ít nhất 1 biến thể', 'warning');
      return false;
    }

    for (const variant of variants) {
      if (!variant.name.trim()) {
        showToast('Vui lòng nhập tên cho tất cả biến thể', 'warning');
        return false;
      }
      if (variant.originalPrice <= 0) {
        showToast('Giá gốc phải lớn hơn 0', 'warning');
        return false;
      }
      if (!variant.expiryDate) {
        showToast('Vui lòng nhập hạn sử dụng cho tất cả biến thể', 'warning');
        return false;
      }
      // Check expiry date is in the future
      const expiryDate = new Date(variant.expiryDate);
      if (expiryDate <= new Date()) {
        showToast('Hạn sử dụng phải là ngày trong tương lai', 'warning');
        return false;
      }
    }

    return true;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!productId) {
      showToast('Không tìm thấy ID sản phẩm', 'error');
      return;
    }

    setLoading(true);
    try {
      // Build variant update requests with images and inventory
      const variantRequests: VariantUpdateRequest[] = variants.map((variant, index) => {
        const images = variantImages[index] || [];
        const inventory = storeInventory[index.toString()] || [];
        
        return {
          ...variant,
          variantImages: images, // All variant images (existing + new)
          storeInventory: inventory,
        };
      });

      const request: ProductFullUpdateRequest = {
        name: productInfo.name,
        description: productInfo.description,
        categoryId: productInfo.categoryId,
        attributes: attributes.filter((a) => a.attributeName && a.attributeValue),
        variants: variantRequests,
        productImages: productImages, // Product-level images
      };

      await productService.fullUpdateProduct(productId, request);
      showToast('Cập nhật sản phẩm thành công!', 'success');
      
      // Clear backup after successful submission
      clearBackup();
      
      setTimeout(() => navigate('/products/list'), 1500);
    } catch (error: any) {
      console.error('Error updating product:', error);
      showToast('Lỗi khi cập nhật sản phẩm: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Loading state */}
      {loadingData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted">Đang tải dữ liệu sản phẩm...</p>
          </div>
        </div>
      )}

      {!loadingData && (
        <>
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
            <p className="text-muted">Điều chỉnh thông tin sản phẩm bên dưới</p>
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

        {/* Product Images */}
        <div className="card p-6">
          <h2 className="heading-secondary mb-4 pb-3 border-b border-default">
            4. Hình ảnh chung sản phẩm <span className="text-light text-sm font-normal">(Tùy chọn)</span>
          </h2>
          {renderProductImagesForm()}
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
              disabled={loading || loadingData}
              className="btn-primary px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                  Đang lưu thay đổi...
                </span>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      </>
      )}
    </div>
  );
}