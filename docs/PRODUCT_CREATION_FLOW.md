# PRODUCT CREATION FLOW - LUỒNG TẠO SẢN PHẨM

## 📋 Phân Tích Data Model Hiện Tại

### Cấu trúc quan hệ:
```
Product (Sản phẩm chính)
  ├─ ProductAttribute (Thuộc tính: Thương hiệu, Xuất xứ, Khối lượng...)
  ├─ ProductVariant (Biến thể: Kích cỡ, Màu sắc, Vị...)
  │    └─ StoreProduct (Tồn kho tại từng cửa hàng)
  └─ ProductImage (Hình ảnh sản phẩm)
```

### Ví dụ thực tế:
**Sản phẩm: "Sữa Chua Vinamilk"**
- **Product**: Sữa Chua Vinamilk
- **ProductAttribute**: 
  - Thương hiệu: Vinamilk
  - Xuất xứ: Việt Nam
  - Loại: Sữa chua có đường
- **ProductVariant**:
  - Vị Dâu 100ml (SKU: VNM-SCH-DAU-100)
  - Vị Việt Quất 100ml (SKU: VNM-SCH-VQ-100)
  - Vị Dâu 200ml (SKU: VNM-SCH-DAU-200)
- **ProductImage**: [url1, url2, url3]
- **StoreProduct**: Tồn kho từng variant tại từng Store

---

## 🎯 LUỒNG TẠO SẢN PHẨM ĐỀ XUẤT

### Phương án 1: **Single Request - Tạo tất cả cùng lúc** ⭐ RECOMMENDED

#### Ưu điểm:
- ✅ Tạo đầy đủ sản phẩm trong 1 request duy nhất
- ✅ Transaction safety: Tất cả hoặc không có gì
- ✅ UX tốt: Người dùng không phải submit nhiều lần
- ✅ Validation tập trung

#### Request Structure:
```json
POST /api/products

{
  "product": {
    "name": "Sữa Chua Vinamilk",
    "description": "Sữa chua thơm ngon bổ dưỡng",
    "categoryId": "cat-123",
    "status": "PENDING_APPROVAL"
  },
  
  "attributes": [
    {
      "attributeName": "Thương hiệu",
      "attributeValue": "Vinamilk"
    },
    {
      "attributeName": "Xuất xứ",
      "attributeValue": "Việt Nam"
    },
    {
      "attributeName": "Loại",
      "attributeValue": "Sữa chua có đường"
    }
  ],
  
  "variants": [
    {
      "name": "Vị Dâu 100ml",
      "sku": "VNM-SCH-DAU-100",
      "originalPrice": 8000,
      "discountPrice": 7500,
      "manufacturingDate": "2025-10-01",
      "expiryDate": "2025-11-01"
    },
    {
      "name": "Vị Việt Quất 100ml",
      "sku": "VNM-SCH-VQ-100",
      "originalPrice": 8500,
      "discountPrice": 8000,
      "manufacturingDate": "2025-10-01",
      "expiryDate": "2025-11-01"
    },
    {
      "name": "Vị Dâu 200ml",
      "sku": "VNM-SCH-DAU-200",
      "originalPrice": 15000,
      "discountPrice": 14000,
      "manufacturingDate": "2025-10-01",
      "expiryDate": "2025-11-15"
    }
  ],
  
  "images": [
    {
      "imageUrl": "https://cloudinary.com/image1.jpg",
      "isPrimary": true
    },
    {
      "imageUrl": "https://cloudinary.com/image2.jpg",
      "isPrimary": false
    }
  ],
  
  "storeInventory": [
    {
      "storeId": "store-001",
      "variantSku": "VNM-SCH-DAU-100",
      "stockQuantity": 100,
      "priceOverride": null
    },
    {
      "storeId": "store-001",
      "variantSku": "VNM-SCH-VQ-100",
      "stockQuantity": 80,
      "priceOverride": null
    },
    {
      "storeId": "store-002",
      "variantSku": "VNM-SCH-DAU-100",
      "stockQuantity": 50,
      "priceOverride": 7800
    }
  ]
}
```

---

### Phương án 2: **Multi-Step Flow - Tạo từng bước**

#### Ưu điểm:
- ✅ Linh hoạt hơn
- ✅ Có thể lưu draft
- ✅ Dễ validate từng bước

#### Nhược điểm:
- ⚠️ Phức tạp hơn
- ⚠️ Nhiều requests
- ⚠️ Cần quản lý state

#### Flow:
```
Step 1: Tạo Product chính
POST /api/products
Body: { name, description, categoryId, status }
Response: { productId }

Step 2: Thêm Attributes
POST /api/products/{productId}/attributes
Body: { attributes: [...] }

Step 3: Thêm Variants
POST /api/products/{productId}/variants
Body: { variants: [...] }

Step 4: Thêm Images
POST /api/products/{productId}/images
Body: { images: [...] }

Step 5: Thêm Store Inventory
POST /api/products/{productId}/inventory
Body: { storeInventory: [...] }
```

---

## 💻 IMPLEMENTATION - Phương án 1 (Recommended)

### 1. DTO Classes

#### ProductCreateRequest.java
```java
package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ProductCreateRequest {
    
    @Valid
    @NotNull(message = "Product information is required")
    private ProductInfoRequest product;
    
    @Valid
    private List<ProductAttributeRequest> attributes = new ArrayList<>();
    
    @Valid
    @NotEmpty(message = "At least one variant is required")
    private List<ProductVariantRequest> variants = new ArrayList<>();
    
    @Valid
    private List<ProductImageRequest> images = new ArrayList<>();
    
    @Valid
    private List<StoreInventoryRequest> storeInventory = new ArrayList<>();
}
```

#### ProductInfoRequest.java
```java
package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductInfoRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    @NotBlank(message = "Category ID is required")
    private String categoryId;
    
    // Status will be set to PENDING_APPROVAL by default
    private String status;
}
```

#### ProductAttributeRequest.java
```java
package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductAttributeRequest {
    
    @NotBlank(message = "Attribute name is required")
    @Size(max = 100, message = "Attribute name must not exceed 100 characters")
    private String attributeName;
    
    @NotBlank(message = "Attribute value is required")
    @Size(max = 500, message = "Attribute value must not exceed 500 characters")
    private String attributeValue;
}
```

#### ProductVariantRequest.java
```java
package com.example.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductVariantRequest {
    
    @NotBlank(message = "Variant name is required")
    @Size(max = 200, message = "Variant name must not exceed 200 characters")
    private String name;
    
    @NotBlank(message = "SKU is required")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "SKU must contain only uppercase letters, numbers, and hyphens")
    @Size(max = 100, message = "SKU must not exceed 100 characters")
    private String sku;
    
    @NotNull(message = "Original price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal originalPrice;
    
    @DecimalMin(value = "0.0", message = "Discount price must be greater than or equal to 0")
    private BigDecimal discountPrice;
    
    private LocalDate manufacturingDate;
    
    @NotNull(message = "Expiry date is required")
    @Future(message = "Expiry date must be in the future")
    private LocalDate expiryDate;
}
```

#### ProductImageRequest.java
```java
package com.example.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductImageRequest {

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private boolean isPrimary = false;
}
```

#### StoreInventoryRequest.java
```java
package com.example.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StoreInventoryRequest {
    
    @NotBlank(message = "Store ID is required")
    private String storeId;
    
    @NotBlank(message = "Variant SKU is required")
    private String variantSku;
    
    @Min(value = 0, message = "Stock quantity must be at least 0")
    private int stockQuantity;
    
    // Giá đặc biệt tại cửa hàng này (optional)
    private BigDecimal priceOverride;
}
```

---

### 2. Service Implementation

#### ProductService.java
```java
package com.example.backend.service;

import com.example.backend.dto.request.ProductCreateRequest;
import com.example.backend.dto.response.ProductResponse;

public interface ProductService {
    
    /**
     * Create new product with variants, attributes, images, and inventory
     * @param request Complete product creation request
     * @param supplierId Supplier ID (from JWT)
     * @return Created product with all details
     */
    ProductResponse createProduct(ProductCreateRequest request, String supplierId);
}
```

#### ProductServiceImpl.java
```java
package com.example.backend.service.impl;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.ProductResponse;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.ProductMapper;
import com.example.backend.repository.*;
import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final StoreRepository storeRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request, String supplierId) {
        log.info("Creating product: {} for supplier: {}", request.getProduct().getName(), supplierId);

        // 1. Validate supplier exists and is active
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        if (!supplier.getStatus().equals(com.example.backend.entity.enums.SupplierStatus.ACTIVE)) {
            throw new BadRequestException(ErrorCode.SUPPLIER_NOT_APPROVED);
        }

        // 2. Validate category exists
        Category category = categoryRepository.findById(request.getProduct().getCategoryId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        // 3. Validate SKU uniqueness
        validateSkuUniqueness(request.getVariants());

        // 4. Validate store IDs
        validateStoreIds(request.getStoreInventory(), supplier);

        // 5. Create Product entity
        Product product = new Product();
        product.setName(request.getProduct().getName());
        product.setDescription(request.getProduct().getDescription());
        product.setSupplier(supplier);
        product.setCategory(category);
        product.setStatus(ProductStatus.PENDING_APPROVAL); // Always pending approval initially

        // 6. Add Attributes
        if (request.getAttributes() != null && !request.getAttributes().isEmpty()) {
            for (ProductAttributeRequest attrReq : request.getAttributes()) {
                ProductAttribute attribute = new ProductAttribute();
                attribute.setAttributeName(attrReq.getAttributeName());
                attribute.setAttributeValue(attrReq.getAttributeValue());
                attribute.setProduct(product);
                product.getAttributes().add(attribute);
            }
        }

        // 7. Add Images
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (ProductImageRequest imgReq : request.getImages()) {
                ProductImage image = new ProductImage();
                image.setImageUrl(imgReq.getImageUrl());
                image.setPrimary(imgReq.isPrimary());
                image.setDisplayOrder(imgReq.getDisplayOrder());
                image.setProduct(product);
                product.getImages().add(image);
            }
        }

        // 8. Add Variants
        Map<String, ProductVariant> variantMap = new HashMap<>();
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductVariantRequest varReq : request.getVariants()) {
                ProductVariant variant = new ProductVariant();
                variant.setName(varReq.getName());
                variant.setSku(varReq.getSku());
                variant.setOriginalPrice(varReq.getOriginalPrice());
                variant.setDiscountPrice(varReq.getDiscountPrice());
                variant.setManufacturingDate(varReq.getManufacturingDate());
                variant.setExpiryDate(varReq.getExpiryDate());
                variant.setProduct(product);
                
                product.getVariants().add(variant);
                variantMap.put(variant.getSku(), variant);
            }
        }

        // 9. Save Product (cascade will save all children)
        product = productRepository.save(product);
        log.info("Product saved successfully with ID: {}", product.getProductId());

        // 10. Create Store Inventory (after variants are persisted)
        if (request.getStoreInventory() != null && !request.getStoreInventory().isEmpty()) {
            for (StoreInventoryRequest invReq : request.getStoreInventory()) {
                ProductVariant variant = variantMap.get(invReq.getVariantSku());
                if (variant == null) {
                    log.warn("Variant not found for SKU: {}", invReq.getVariantSku());
                    continue;
                }

                Store store = storeRepository.findById(invReq.getStoreId())
                        .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

                StoreProduct storeProduct = new StoreProduct();
                storeProduct.setStore(store);
                storeProduct.setVariant(variant);
                storeProduct.setStockQuantity(invReq.getStockQuantity());
                storeProduct.setPriceOverride(invReq.getPriceOverride());
                
                variant.getStoreProducts().add(storeProduct);
            }
            
            // Save again to persist StoreProducts
            product = productRepository.save(product);
        }

        log.info("Product created successfully: {} with {} variants and {} attributes", 
                product.getName(), product.getVariants().size(), product.getAttributes().size());

        return productMapper.toResponse(product);
    }

    /**
     * Validate that all SKUs are unique
     */
    private void validateSkuUniqueness(List<ProductVariantRequest> variants) {
        Set<String> skus = new HashSet<>();
        Set<String> duplicates = new HashSet<>();

        for (ProductVariantRequest variant : variants) {
            if (!skus.add(variant.getSku())) {
                duplicates.add(variant.getSku());
            }
        }

        if (!duplicates.isEmpty()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, 
                    "Duplicate SKUs found: " + String.join(", ", duplicates));
        }

        // Check against database
        // TODO: Implement SKU repository check
    }

    /**
     * Validate that all store IDs belong to the supplier
     */
    private void validateStoreIds(List<StoreInventoryRequest> inventory, Supplier supplier) {
        if (inventory == null || inventory.isEmpty()) {
            return;
        }

        Set<String> supplierStoreIds = new HashSet<>();
        supplier.getStores().forEach(store -> supplierStoreIds.add(store.getStoreId()));

        for (StoreInventoryRequest inv : inventory) {
            if (!supplierStoreIds.contains(inv.getStoreId())) {
                throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                        "Store ID " + inv.getStoreId() + " does not belong to this supplier");
            }
        }
    }
}
```

---

### 3. Controller

#### ProductController.java
```java
package com.example.backend.controller;

import com.example.backend.dto.request.ProductCreateRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.ProductResponse;
import com.example.backend.service.ProductService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product", description = "Product management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
        summary = "Create new product with variants and attributes",
        description = "Create a complete product with all variants, attributes, images, and inventory in a single request"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request,
            Authentication authentication) {
        
        log.info("POST /api/products - Creating new product: {}", request.getProduct().getName());

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String supplierId = JwtUtils.extractUserId(jwt);

        ProductResponse response = productService.createProduct(request, supplierId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully. Waiting for admin approval.", response));
    }
}
```

---

## 🎨 FRONTEND IMPLEMENTATION GUIDE

### React Example với Form Wizard:

```jsx
import { useState } from 'react';

const ProductCreateWizard = () => {
  const [formData, setFormData] = useState({
    product: { name: '', description: '', categoryId: '' },
    attributes: [],
    variants: [],
    images: [],
    storeInventory: []
  });

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Product Info
  const ProductInfoForm = () => (
    <div>
      <input 
        placeholder="Tên sản phẩm"
        value={formData.product.name}
        onChange={(e) => setFormData({
          ...formData,
          product: { ...formData.product, name: e.target.value }
        })}
      />
      <textarea 
        placeholder="Mô tả"
        value={formData.product.description}
        onChange={(e) => setFormData({
          ...formData,
          product: { ...formData.product, description: e.target.value }
        })}
      />
      <select 
        value={formData.product.categoryId}
        onChange={(e) => setFormData({
          ...formData,
          product: { ...formData.product, categoryId: e.target.value }
        })}
      >
        <option value="">Chọn danh mục</option>
        {/* Load categories from API */}
      </select>
    </div>
  );

  // Step 2: Attributes
  const AttributesForm = () => {
    const addAttribute = () => {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, { attributeName: '', attributeValue: '' }]
      });
    };

    const updateAttribute = (index, field, value) => {
      const newAttributes = [...formData.attributes];
      newAttributes[index][field] = value;
      setFormData({ ...formData, attributes: newAttributes });
    };

    return (
      <div>
        <h3>Thuộc tính sản phẩm</h3>
        {formData.attributes.map((attr, index) => (
          <div key={index}>
            <input 
              placeholder="Tên thuộc tính (vd: Thương hiệu)"
              value={attr.attributeName}
              onChange={(e) => updateAttribute(index, 'attributeName', e.target.value)}
            />
            <input 
              placeholder="Giá trị (vd: Vinamilk)"
              value={attr.attributeValue}
              onChange={(e) => updateAttribute(index, 'attributeValue', e.target.value)}
            />
          </div>
        ))}
        <button onClick={addAttribute}>+ Thêm thuộc tính</button>
      </div>
    );
  };

  // Step 3: Variants
  const VariantsForm = () => {
    const addVariant = () => {
      setFormData({
        ...formData,
        variants: [...formData.variants, {
          name: '',
          sku: '',
          originalPrice: 0,
          discountPrice: 0,
          expiryDate: ''
        }]
      });
    };

    return (
      <div>
        <h3>Biến thể sản phẩm</h3>
        {formData.variants.map((variant, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <input 
              placeholder="Tên biến thể (vd: Vị Dâu 100ml)"
              value={variant.name}
              onChange={(e) => {
                const newVariants = [...formData.variants];
                newVariants[index].name = e.target.value;
                setFormData({ ...formData, variants: newVariants });
              }}
            />
            <input 
              placeholder="SKU (vd: VNM-SCH-DAU-100)"
              value={variant.sku}
              onChange={(e) => {
                const newVariants = [...formData.variants];
                newVariants[index].sku = e.target.value;
                setFormData({ ...formData, variants: newVariants });
              }}
            />
            <input 
              type="number"
              placeholder="Giá gốc"
              value={variant.originalPrice}
              onChange={(e) => {
                const newVariants = [...formData.variants];
                newVariants[index].originalPrice = parseFloat(e.target.value);
                setFormData({ ...formData, variants: newVariants });
              }}
            />
            <input 
              type="date"
              placeholder="Hạn sử dụng"
              value={variant.expiryDate}
              onChange={(e) => {
                const newVariants = [...formData.variants];
                newVariants[index].expiryDate = e.target.value;
                setFormData({ ...formData, variants: newVariants });
              }}
            />
          </div>
        ))}
        <button onClick={addVariant}>+ Thêm biến thể</button>
      </div>
    );
  };

  // Step 4: Images
  const ImagesForm = () => {
    const handleUpload = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/files/upload/product', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const result = await response.json();
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, {
          imageUrl: result.data.url,
          isPrimary: prev.images.length === 0
        }]
      }));
    };

    return (
      <div>
        <h3>Hình ảnh sản phẩm</h3>
        <input 
          type="file" 
          multiple 
          accept="image/*"
          onChange={(e) => {
            Array.from(e.target.files).forEach(handleUpload);
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {formData.images.map((img, index) => (
            <div key={index}>
              <img src={img.imageUrl} alt="" style={{ width: '100%' }} />
              <label>
                <input 
                  type="checkbox" 
                  checked={img.isPrimary}
                  onChange={(e) => {
                    const newImages = formData.images.map((i, idx) => ({
                      ...i,
                      isPrimary: idx === index
                    }));
                    setFormData({ ...formData, images: newImages });
                  }}
                />
                Ảnh chính
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Step 5: Store Inventory
  const InventoryForm = () => (
    <div>
      <h3>Tồn kho tại cửa hàng</h3>
      {/* For each variant, allow setting quantity per store */}
      {formData.variants.map((variant, vIndex) => (
        <div key={vIndex}>
          <h4>{variant.name} ({variant.sku})</h4>
          {/* List of supplier's stores */}
          {stores.map((store, sIndex) => (
            <div key={sIndex}>
              <label>{store.storeName}</label>
              <input 
                type="number"
                placeholder="Số lượng"
                onChange={(e) => {
                  // Add to storeInventory array
                  const newInventory = [...formData.storeInventory];
                  const existingIndex = newInventory.findIndex(
                    inv => inv.storeId === store.storeId && inv.variantSku === variant.sku
                  );
                  
                  if (existingIndex >= 0) {
                    newInventory[existingIndex].stockQuantity = parseInt(e.target.value);
                  } else {
                    newInventory.push({
                      storeId: store.storeId,
                      variantSku: variant.sku,
                      stockQuantity: parseInt(e.target.value),
                      priceOverride: null
                    });
                  }
                  
                  setFormData({ ...formData, storeInventory: newInventory });
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Tạo sản phẩm thành công! Đang chờ admin phê duyệt.');
        // Redirect to product list
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <div>
      <h2>Tạo sản phẩm mới</h2>
      
      {/* Wizard Steps */}
      <div className="wizard-steps">
        <div className={currentStep >= 1 ? 'active' : ''}>1. Thông tin cơ bản</div>
        <div className={currentStep >= 2 ? 'active' : ''}>2. Thuộc tính</div>
        <div className={currentStep >= 3 ? 'active' : ''}>3. Biến thể</div>
        <div className={currentStep >= 4 ? 'active' : ''}>4. Hình ảnh</div>
        <div className={currentStep >= 5 ? 'active' : ''}>5. Tồn kho</div>
      </div>

      {/* Form Content */}
      {currentStep === 1 && <ProductInfoForm />}
      {currentStep === 2 && <AttributesForm />}
      {currentStep === 3 && <VariantsForm />}
      {currentStep === 4 && <ImagesForm />}
      {currentStep === 5 && <InventoryForm />}

      {/* Navigation */}
      <div className="wizard-nav">
        {currentStep > 1 && (
          <button onClick={() => setCurrentStep(currentStep - 1)}>
            ← Quay lại
          </button>
        )}
        {currentStep < 5 ? (
          <button onClick={() => setCurrentStep(currentStep + 1)}>
            Tiếp theo →
          </button>
        ) : (
          <button onClick={handleSubmit}>
            Tạo sản phẩm
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 📊 DATABASE SCHEMA VALIDATION

### Kiểm tra constraints cần có:

```sql
-- SKU phải unique
ALTER TABLE product_variants ADD CONSTRAINT uq_variant_sku UNIQUE (sku);

-- Expiry date phải sau manufacturing date
ALTER TABLE product_variants ADD CONSTRAINT chk_variant_dates 
  CHECK (expiry_date > manufacturing_date);

-- Discount price <= Original price
ALTER TABLE product_variants ADD CONSTRAINT chk_variant_prices 
  CHECK (discount_price IS NULL OR discount_price <= original_price);

-- Stock quantity >= 0
ALTER TABLE store_products ADD CONSTRAINT chk_stock_quantity 
  CHECK (stock_quantity >= 0);
```

---

## ✅ VALIDATION CHECKLIST

### Backend Validation:
- ✅ Product name không trống, <= 200 ký tự
- ✅ Category tồn tại và active
- ✅ Supplier tồn tại và ACTIVE
- ✅ Ít nhất 1 variant
- ✅ SKU unique trong request
- ✅ SKU unique trong database
- ✅ Expiry date > today
- ✅ Expiry date > manufacturing date (nếu có)
- ✅ Discount price <= Original price
- ✅ Store IDs thuộc về supplier
- ✅ Variant SKU trong inventory tồn tại trong variants list

### Frontend Validation:
- ✅ Tất cả fields required được điền
- ✅ Format SKU đúng (uppercase, numbers, hyphens only)
- ✅ Prices > 0
- ✅ Dates hợp lệ
- ✅ Images đã upload thành công
- ✅ Ít nhất 1 ảnh được đánh dấu là primary

---

## 🎯 SUMMARY

### Luồng đề xuất (Single Request):

```
1. Frontend: Form wizard 5 bước thu thập data
   ├─ Step 1: Product info
   ├─ Step 2: Attributes (optional)
   ├─ Step 3: Variants (required, có thể nhiều)
   ├─ Step 4: Images (upload to Cloudinary trước)
   └─ Step 5: Inventory per store

2. Submit 1 request duy nhất chứa TẤT CẢ data

3. Backend: Transaction đảm bảo atomic
   ├─ Validate tất cả
   ├─ Create Product
   ├─ Add Attributes (cascade)
   ├─ Add Variants (cascade)
   ├─ Add Images (cascade)
   ├─ Create StoreProducts cho từng variant
   └─ Return complete ProductResponse

4. Product status = PENDING_APPROVAL
   └─ Admin approve → ACTIVE
   └─ Admin reject → REJECTED
```

### Ưu điểm phương án này:
✅ **UX tốt**: Wizard giúp người dùng dễ nhập liệu
✅ **Data integrity**: Transaction đảm bảo toàn vẹn
✅ **Flexible**: Có thể thêm nhiều variant, attribute
✅ **Scalable**: Dễ mở rộng thêm fields
✅ **Type-safe**: Validation chặt chẽ
✅ **Performance**: Chỉ 1 request, 1 transaction

Bạn có thể bắt đầu implement theo hướng dẫn này ngay!
