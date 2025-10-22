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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

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
    public ProductResponse createProduct(ProductCreateRequest request, String keycloakId) {
        log.info("Creating product: {} for keycloakId: {}", request.getProduct().getName(), keycloakId);

        // 1. Find supplier by keycloakId
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
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

    @Override
    @Transactional
    public ProductResponse approveProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        product.setStatus(ProductStatus.APPROVED);
        product = productRepository.save(product);

        log.info("Product {} approved by admin", productId);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse rejectProduct(String productId, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        product.setStatus(ProductStatus.REJECTED);
        product = productRepository.save(product);

        log.info("Product {} rejected by admin. Reason: {}", productId, reason);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(ProductStatus status, String categoryId, String supplierId, String search, Pageable pageable) {
        Page<Product> products;
        
        if (status != null && categoryId != null) {
            products = productRepository.findByStatusAndCategoryCategoryId(status, categoryId, pageable);
        } else if (status != null) {
            products = productRepository.findByStatus(status, pageable);
        } else if (categoryId != null) {
            products = productRepository.findByCategoryCategoryId(categoryId, pageable);
        } else if (supplierId != null) {
            products = productRepository.findBySupplierUserId(supplierId, pageable);
        } else {
            products = productRepository.findAll(pageable);
        }
        
        return products.map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getMyProducts(String keycloakId, ProductStatus status, String search, Pageable pageable) {
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        Page<Product> products;
        if (status != null) {
            products = productRepository.findBySupplierUserIdAndStatus(supplier.getUserId(), status, pageable);
        } else {
            products = productRepository.findBySupplierUserId(supplier.getUserId(), pageable);
        }
        
        return products.map(productMapper::toResponse);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(String productId, ProductUpdateRequest request, String keycloakId) {
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));
        
        // Validate ownership
        if (!product.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, "You do not have permission to update this product");
        }
        
        // Validate category
        if (request.getCategoryId() != null && !request.getCategoryId().equals(product.getCategory().getCategoryId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));
            product.setCategory(category);
        }
        
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        
        product = productRepository.save(product);
        log.info("Product {} updated by supplier {}", productId, keycloakId);
        
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProductStatus(String productId, ProductStatusUpdateRequest request, String keycloakId) {
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));
        
        // Validate ownership
        if (!product.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, "You do not have permission to update this product");
        }
        
        product.setStatus(request.getStatus());
        product = productRepository.save(product);
        
        log.info("Product {} status updated to {} by supplier {}", productId, request.getStatus(), keycloakId);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(String productId, String keycloakId) {
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));
        
        // Validate ownership
        if (!product.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, "You do not have permission to delete this product");
        }
        
        // Soft delete by setting status to SOLD_OUT (or can add a DELETED status)
        product.setStatus(ProductStatus.SOLD_OUT);
        productRepository.save(product);
        
        log.info("Product {} soft deleted by supplier {}", productId, keycloakId);
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
