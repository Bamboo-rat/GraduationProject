package com.example.backend.service.impl;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.ProductResponse;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.entity.enums.StorageBucket;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.ProductMapper;
import com.example.backend.repository.*;
import com.example.backend.service.FileStorageService;
import com.example.backend.service.ProductService;
import com.example.backend.utils.ProductSpecification;
import com.example.backend.utils.SkuGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final StoreProductRepository storeProductRepository;
    private final ProductMapper productMapper;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request, String keycloakId) {
        log.info("Creating product: {} for keycloakId: {}", request.getProduct().getName(), keycloakId);

        // 1. Find supplier by keycloakId
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!supplier.getStatus().equals(com.example.backend.entity.enums.SupplierStatus.ACTIVE)) {
            throw new BadRequestException(ErrorCode.SUPPLIER_NOT_APPROVED);
        }

        // 2. Validate category exists
        Category category = categoryRepository.findById(request.getProduct().getCategoryId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        // 3. Validate store IDs
        validateStoreIds(request.getStoreInventory(), supplier);

        // 5. Create Product entity
        Product product = new Product();
        product.setName(request.getProduct().getName());
        product.setDescription(request.getProduct().getDescription());
        product.setSupplier(supplier);
        product.setCategory(category);
        product.setStatus(ProductStatus.ACTIVE);

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

        // 7. Add Product-level Images
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (ProductImageRequest imgReq : request.getImages()) {
                ProductImage image = new ProductImage();
                image.setImageUrl(imgReq.getImageUrl());
                image.setPrimary(imgReq.isPrimary());
                image.setProduct(product);
                image.setVariant(null); // Product-level image, not variant-specific
                product.getImages().add(image);
            }
        }

        // 8. Add Variants with auto-generated unique SKUs
        Map<String, ProductVariant> variantMap = new HashMap<>();
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductVariantRequest varReq : request.getVariants()) {
                ProductVariant variant = new ProductVariant();
                variant.setName(varReq.getName());

                // Auto-generate unique SKU with database duplicate check
                String uniqueSku = generateUniqueSku(product, varReq.getName());
                variant.setSku(uniqueSku);

                variant.setOriginalPrice(varReq.getOriginalPrice());
                variant.setDiscountPrice(varReq.getDiscountPrice());
                variant.setManufacturingDate(varReq.getManufacturingDate());
                variant.setExpiryDate(varReq.getExpiryDate());
                variant.setProduct(product);

                // Add variant-specific images if provided
                if (varReq.getImages() != null && !varReq.getImages().isEmpty()) {
                    for (ProductImageRequest imgReq : varReq.getImages()) {
                        ProductImage variantImage = new ProductImage();
                        variantImage.setImageUrl(imgReq.getImageUrl());
                        variantImage.setPrimary(imgReq.isPrimary());
                        variantImage.setProduct(product); // Still reference the product
                        variantImage.setVariant(variant); // Link to this specific variant
                        variant.getVariantImages().add(variantImage);
                    }
                }

                product.getVariants().add(variant);
                variantMap.put(variant.getSku(), variant);
            }
        }

        // 9. Save Product (cascade will save all children)
        product = productRepository.save(product);
        log.info("Product saved successfully with ID: {}", product.getProductId());

        // Re-build the variant map with persisted variants to ensure they are managed by JPA
        final Map<String, ProductVariant> persistedVariantMap = new HashMap<>();
        product.getVariants().forEach(v -> persistedVariantMap.put(v.getSku(), v));

        // 10. Create Store Inventory (after variants are persisted)
        if (request.getStoreInventory() != null && !request.getStoreInventory().isEmpty()) {
            for (StoreInventoryRequest invReq : request.getStoreInventory()) {
                ProductVariant variant = null;

                // Support both SKU (for updates) and index (for creation)
                if (invReq.getVariantSku() != null && !invReq.getVariantSku().isBlank()) {
                    // Use SKU to find variant
                    variant = persistedVariantMap.get(invReq.getVariantSku());
                    if (variant == null) {
                        log.warn("Variant not found for SKU: {}. Skipping inventory creation.", invReq.getVariantSku());
                        continue;
                    }
                } else if (invReq.getVariantIndex() != null) {
                    // Use index to get variant from the ordered list
                    List<ProductVariant> variantList = new ArrayList<>(product.getVariants());
                    if (invReq.getVariantIndex() >= 0 && invReq.getVariantIndex() < variantList.size()) {
                        variant = variantList.get(invReq.getVariantIndex());
                        log.debug("Found variant by index {}: {}", invReq.getVariantIndex(), variant.getSku());
                    } else {
                        log.warn("Variant index {} out of bounds (size: {}). Skipping inventory creation.",
                                invReq.getVariantIndex(), variantList.size());
                        continue;
                    }
                } else {
                    log.warn("Neither variantSku nor variantIndex provided. Skipping inventory creation.");
                    continue;
                }

                Store store = storeRepository.findById(invReq.getStoreId())
                        .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Store not found with ID: " + invReq.getStoreId()));

                StoreProduct storeProduct = new StoreProduct();
                storeProduct.setStore(store);
                storeProduct.setVariant(variant);
                storeProduct.setStockQuantity(invReq.getStockQuantity());
                storeProduct.setPriceOverride(invReq.getPriceOverride());

                variant.getStoreProducts().add(storeProduct);
                log.info("Added inventory for variant {} at store {}: {} units",
                        variant.getSku(), store.getStoreName(), invReq.getStockQuantity());
            }

            // Save again to persist the newly created StoreProduct entities
            product = productRepository.save(product);
        }

        log.info("Product created successfully: {} with {} variants and {} attributes",
                product.getName(), product.getVariants().size(), product.getAttributes().size());

        // Check and update status based on inventory and expiry
        checkAndUpdateProductStatus(product.getProductId());

        // Reload product to get updated status
        product = productRepository.findById(product.getProductId()).orElseThrow();

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse suspendProduct(String productId, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        product.setStatus(ProductStatus.SUSPENDED);
        product.setSuspensionReason(reason);
        product = productRepository.save(product);

        log.info("Product {} suspended by admin. Reason: {}", productId, reason);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse unsuspendProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        if (product.getStatus() != ProductStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Product is not suspended");
        }

        product.setStatus(ProductStatus.ACTIVE);
        product.setSuspensionReason(null);
        product = productRepository.save(product);

        // Check if should auto-update to SOLD_OUT or EXPIRED
        checkAndUpdateProductStatus(productId);

        // Reload to get updated status
        product = productRepository.findById(productId).orElseThrow();

        log.info("Product {} unsuspended by admin", productId);
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

        // CRITICAL FIX: Only show products from ACTIVE suppliers
        // When supplier is paused/suspended, their products must be hidden from customers
        if (status != null && categoryId != null) {
            products = productRepository.findByStatusAndCategoryFromActiveSuppliers(status, categoryId, pageable);
        } else if (status != null) {
            products = productRepository.findByStatusFromActiveSuppliers(status, pageable);
        } else if (categoryId != null) {
            products = productRepository.findByCategoryFromActiveSuppliers(categoryId, pageable);
        } else if (supplierId != null) {
            // When filtering by specific supplier, show their products regardless of status
            // (used in admin/supplier panel)
            products = productRepository.findBySupplierUserId(supplierId, pageable);
        } else {
            products = productRepository.findAllFromActiveSuppliers(pageable);
        }

        return products.map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(ProductFilterRequest filter, Pageable pageable) {
        log.info("Searching products with filters: status={}, categoryId={}, search={}, " +
                        "priceRange=[{}-{}], expiryRange=[{}-{}], expiringWithinDays={}, " +
                        "location=[{}, {}, {}], userLocation=[{}, {}], maxDistance={}",
                filter.getStatus(), filter.getCategoryId(), filter.getSearch(),
                filter.getMinPrice(), filter.getMaxPrice(),
                filter.getExpiryDateFrom(), filter.getExpiryDateTo(), filter.getExpiringWithinDays(),
                filter.getProvince(), filter.getDistrict(), filter.getWard(),
                filter.getUserLatitude(), filter.getUserLongitude(), filter.getMaxDistanceKm());

        // Build dynamic specification from filter
        Specification<Product> spec = ProductSpecification.buildSpecification(filter);

        // Execute query with specification
        Page<Product> products = productRepository.findAll(spec, pageable);

        log.info("Found {} products matching filter criteria", products.getTotalElements());

        return products.map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getMyProducts(String keycloakId, ProductStatus status, String search, Pageable pageable) {
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
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
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
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
    public ProductResponse toggleProductVisibility(String productId, String keycloakId, boolean makeActive) {
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Validate ownership
        if (!product.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, "You do not have permission to update this product");
        }

        // Check if product is suspended
        if (product.getStatus() == ProductStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Cannot change visibility of suspended product. Contact admin.");
        }

        // Only allow toggling between ACTIVE and INACTIVE
        if (makeActive) {
            product.setStatus(ProductStatus.ACTIVE);
            // Check if should auto-update to SOLD_OUT or EXPIRED
            checkAndUpdateProductStatus(productId);
            product = productRepository.findById(productId).orElseThrow();
        } else {
            product.setStatus(ProductStatus.INACTIVE);
            product = productRepository.save(product);
        }

        log.info("Product {} visibility toggled to {} by supplier {}", productId,
                makeActive ? "ACTIVE" : "INACTIVE", keycloakId);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(String productId, String keycloakId) {
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Validate ownership
        if (!product.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, "You do not have permission to delete this product");
        }

        // Collect all image URLs for Cloudinary cleanup
        List<String> imageUrls = new ArrayList<>();

        // Collect product images
        product.getImages().forEach(img -> imageUrls.add(img.getImageUrl()));

        // Collect variant images
        product.getVariants().forEach(variant ->
                variant.getVariantImages().forEach(img -> imageUrls.add(img.getImageUrl())));

        // Soft delete by setting status to DELETED
        product.setStatus(ProductStatus.DELETED);
        productRepository.save(product);

        // Delete images from Cloudinary
        for (String imageUrl : imageUrls) {
            try {
                fileStorageService.deleteFile(imageUrl, StorageBucket.PRODUCTS);
                log.info("Deleted image from Cloudinary: {}", imageUrl);
            } catch (Exception e) {
                log.error("Failed to delete image from Cloudinary: {}", imageUrl, e);
                // Continue deleting other images even if one fails
            }
        }

        log.info("Product {} soft deleted by supplier {} with {} images cleaned up",
                productId, keycloakId, imageUrls.size());
    }

    @Override
    @Transactional
    public void checkAndUpdateProductStatus(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Don't auto-update if product is SUSPENDED, INACTIVE, or DELETED
        if (product.getStatus() == ProductStatus.SUSPENDED ||
            product.getStatus() == ProductStatus.INACTIVE ||
            product.getStatus() == ProductStatus.DELETED) {
            return;
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        boolean statusChanged = false;

        // Priority 1: Check if ALL variants are expired
        if (product.allVariantsExpired()) {
            if (product.getStatus() != ProductStatus.EXPIRED) {
                product.setStatus(ProductStatus.EXPIRED);
                product.setExpiredSince(today);
                statusChanged = true;
                log.info("Product {} auto-set to EXPIRED (all variants have expired)", productId);
            }
        }
        // Priority 2: Check if ALL variants are out of stock
        else if (product.getTotalInventory() == 0) {
            if (product.getStatus() != ProductStatus.SOLD_OUT) {
                product.setStatus(ProductStatus.SOLD_OUT);
                product.setSoldOutSince(today);
                statusChanged = true;
                log.info("Product {} auto-set to SOLD_OUT (all variants out of stock, total inventory = 0)", productId);
            }
        }
        // Priority 3: If at least one variant is available (in stock and not expired), set ACTIVE
        else if (product.hasAvailableVariant()) {
            if (product.getStatus() == ProductStatus.SOLD_OUT || product.getStatus() == ProductStatus.EXPIRED) {
                product.setStatus(ProductStatus.ACTIVE);
                product.setSoldOutSince(null);
                product.setExpiredSince(null);
                statusChanged = true;
                log.info("Product {} auto-restored to ACTIVE ({} available variants found)", 
                        productId, product.getAvailableVariantCount());
            }
        }
        // Edge case: Has inventory but all variants expired
        else if (product.getTotalInventory() > 0 && product.hasExpiredVariant()) {
            if (product.getStatus() != ProductStatus.EXPIRED) {
                product.setStatus(ProductStatus.EXPIRED);
                product.setExpiredSince(today);
                statusChanged = true;
                log.info("Product {} auto-set to EXPIRED (has inventory but all available variants expired)", productId);
            }
        }

        if (statusChanged) {
            productRepository.save(product);
        }
    }

    @Override
    @Transactional
    public void autoSetInactiveForOldProducts() {
        log.info("Running scheduled task: Auto-set INACTIVE for old SOLD_OUT/EXPIRED products");

        // Find products that are SOLD_OUT or EXPIRED
        List<Product> soldOutProducts = productRepository.findByStatus(ProductStatus.SOLD_OUT);
        List<Product> expiredProducts = productRepository.findByStatus(ProductStatus.EXPIRED);

        List<Product> allEligibleProducts = new ArrayList<>();
        allEligibleProducts.addAll(soldOutProducts);
        allEligibleProducts.addAll(expiredProducts);

        int updatedCount = 0;
        for (Product product : allEligibleProducts) {
            if (product.shouldAutoSetInactive()) {
                product.setStatus(ProductStatus.INACTIVE);
                productRepository.save(product);
                updatedCount++;
                log.info("Product {} auto-set to INACTIVE (old SOLD_OUT/EXPIRED)", product.getProductId());
            }
        }

        log.info("Auto-INACTIVE task completed: {} products updated", updatedCount);
    }

    /**
     * Generate a unique SKU for a product variant
     * Automatically retries with different suffix if SKU already exists in database
     *
     * @param product The product entity
     * @param variantName The variant name
     * @return Unique SKU that doesn't exist in database
     */
    private String generateUniqueSku(Product product, String variantName) {
        String sku;
        int attempts = 0;
        int maxAttempts = 10;

        do {
            // Generate SKU using the utility
            sku = SkuGenerator.generateSku(product, variantName);

            // Check if SKU already exists in database
            if (!productVariantRepository.existsBySku(sku)) {
                log.info("Generated unique SKU: {} for variant: {}", sku, variantName);
                return sku;
            }

            // If duplicate found, log and retry
            log.warn("SKU collision detected: {}. Retrying... (attempt {}/{})", sku, attempts + 1, maxAttempts);
            attempts++;

            // Add small delay to ensure different timestamp if using timestamp-based generation
            try {
                Thread.sleep(1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

        } while (attempts < maxAttempts);

        // If still can't generate unique SKU after max attempts, throw exception
        throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                "Failed to generate unique SKU after " + maxAttempts + " attempts. Please try again.");
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

    @Override
    @Transactional
    public ProductResponse updateVariantStockAtStore(String productId, String variantId, String storeId, 
                                                     Integer newStockQuantity, String keycloakId) {
        log.info("Updating stock for product: {}, variant: {}, store: {} to quantity: {}", 
                productId, variantId, storeId, newStockQuantity);

        // 1. Find and validate product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND));

        // 2. Validate ownership - only supplier can update their product's stock
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!product.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, "You can only update stock for your own products");
        }

        // 3. Find variant
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Product variant not found"));

        // Validate variant belongs to this product
        if (!variant.getProduct().getProductId().equals(productId)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Variant does not belong to this product");
        }

        // 4. Find store
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND));

        // Validate store belongs to this supplier
        if (!store.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, "Store does not belong to you");
        }

        // 5. Find or create StoreProduct
        StoreProduct storeProduct = storeProductRepository
                .findByStoreStoreIdAndVariantVariantId(storeId, variantId)
                .orElseGet(() -> {
                    log.info("Creating new StoreProduct entry for store: {} and variant: {}", storeId, variantId);
                    StoreProduct newStoreProduct = new StoreProduct();
                    newStoreProduct.setStore(store);
                    newStoreProduct.setVariant(variant);
                    newStoreProduct.setStockQuantity(0);
                    return newStoreProduct;
                });

        // 6. Update stock quantity
        int oldStock = storeProduct.getStockQuantity();
        storeProduct.setStockQuantity(newStockQuantity);
        storeProductRepository.save(storeProduct);

        log.info("Stock updated from {} to {} for variant {} at store {}", 
                oldStock, newStockQuantity, variantId, storeId);

        // 7. Check and update product status (EXPIRED/SOLD_OUT/ACTIVE)
        checkAndUpdateProductStatus(productId);

        // 8. Return updated product with all variants
        Product updatedProduct = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND));

        return productMapper.toResponse(updatedProduct);
    }
}
