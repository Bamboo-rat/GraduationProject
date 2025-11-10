package com.example.backend.service;

import com.example.backend.dto.request.ProductCreateRequest;
import com.example.backend.dto.request.ProductFilterRequest;
import com.example.backend.dto.request.ProductStatusUpdateRequest;
import com.example.backend.dto.request.ProductUpdateRequest;
import com.example.backend.dto.response.ProductResponse;
import com.example.backend.dto.response.ProductSummaryResponse;
import com.example.backend.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    /**
     * Create new product with variants, attributes, images, and inventory
     * @param request Complete product creation request
     * @param keycloakId Keycloak ID from JWT (will find supplier by this)
     * @return Created product with all details
     */
    ProductResponse createProduct(ProductCreateRequest request, String keycloakId);

    /**
     * Get product by ID
     * @param productId Product ID
     * @return Product details
     */
    ProductResponse getProductById(String productId);

    /**
     * Get products summary (lightweight for list views)
     * @param status Filter by status (optional)
     * @param categoryId Filter by category (optional)
     * @param supplierId Filter by supplier (optional)
     * @param search Search by name (optional)
     * @param pageable Pagination parameters
     * @return Page of lightweight product summaries
     */
    Page<ProductSummaryResponse> getProductsSummary(ProductStatus status, String categoryId, String supplierId, String search, Pageable pageable);

    /**
     * Get all products with FULL details (pagination and filtering)
     * ⚠️ Heavy payload with variants, images, attributes, and store inventory
     * @param status Filter by status (optional)
     * @param categoryId Filter by category (optional)
     * @param supplierId Filter by supplier (optional)
     * @param search Search by name (optional)
     * @param pageable Pagination parameters
     * @return Page of products with full details
     */
    Page<ProductResponse> getAllProducts(ProductStatus status, String categoryId, String supplierId, String search, Pageable pageable);

    /**
     * Get all products with advanced filtering for shopping experience
     * Supports: search, price range, expiry date, location/distance filters
     * @param filter Comprehensive filter request
     * @param pageable Pagination parameters
     * @return Page of filtered products
     */
    Page<ProductResponse> searchProducts(ProductFilterRequest filter, Pageable pageable);

    /**
     * Get products for current supplier
     * @param keycloakId Keycloak ID from JWT
     * @param status Filter by status (optional)
     * @param search Search by name (optional)
     * @param pageable Pagination parameters
     * @return Page of supplier's products
     */
    Page<ProductResponse> getMyProducts(String keycloakId, ProductStatus status, String search, Pageable pageable);

    /**
     * Update product basic info (name, description, category)
     * @param productId Product ID
     * @param request Update request
     * @param keycloakId Keycloak ID from JWT (for ownership validation)
     * @return Updated product
     */
    ProductResponse updateProduct(String productId, ProductUpdateRequest request, String keycloakId);

    /**
     * Supplier toggles product visibility (ACTIVE ↔ INACTIVE)
     * @param productId Product ID
     * @param keycloakId Keycloak ID from JWT (for ownership validation)
     * @param makeActive true to set ACTIVE, false to set INACTIVE
     * @return Updated product
     */
    ProductResponse toggleProductVisibility(String productId, String keycloakId, boolean makeActive);

    /**
     * Delete product (soft delete by setting status to DELETED and cleanup Cloudinary files)
     * @param productId Product ID
     * @param keycloakId Keycloak ID from JWT (for ownership validation)
     */
    void deleteProduct(String productId, String keycloakId);

    /**
     * Admin suspends product for policy violation
     * @param productId Product ID
     * @param reason Suspension reason
     * @return Updated product
     */
    ProductResponse suspendProduct(String productId, String reason);

    /**
     * Admin unsuspends product (restores to ACTIVE or previous status)
     * @param productId Product ID
     * @return Updated product
     */
    ProductResponse unsuspendProduct(String productId);

    /**
     * Check and update product status based on inventory and expiry
     * Called after inventory changes or by scheduler
     * @param productId Product ID
     */
    void checkAndUpdateProductStatus(String productId);

    /**
     * Auto-set INACTIVE for products that have been SOLD_OUT or EXPIRED for 1+ days
     * Called by scheduler
     */
    void autoSetInactiveForOldProducts();

    /**
     * Update stock quantity for a specific variant at a specific store
     * @param productId Product ID
     * @param variantId Variant ID
     * @param storeId Store ID
     * @param newStockQuantity New stock quantity
     * @param keycloakId Keycloak ID from JWT (for ownership validation)
     * @return Updated product with all variants
     */
    ProductResponse updateVariantStockAtStore(String productId, String variantId, String storeId, Integer newStockQuantity, String keycloakId);

    /**
     * Get best-selling products (customer-facing, public access)
     * Returns top 10 products based on total quantity sold from DELIVERED orders
     * @param pageable Pagination (default size: 10)
     * @return Page of best-selling products
     */
    Page<ProductResponse> getBestSellingProducts(Pageable pageable);

    /**
     * Get cheapest products with highest discount percentage (customer-facing, public access)
     * Returns top 5 products with highest (originalPrice - discountPrice) / originalPrice
     * Only returns ACTIVE products from ACTIVE stores with positive stock
     * @param pageable Pagination (default size: 5)
     * @return Page of cheapest products
     */
    Page<ProductResponse> getCheapestProducts(Pageable pageable);

    /**
     * Get new products on sale today (customer-facing, public access)
     * Returns products created today that have discount (discountPrice < originalPrice)
     * Only returns ACTIVE products from ACTIVE stores with positive stock
     * @param pageable Pagination (default size: 20)
     * @return Page of new products on sale
     */
    Page<ProductResponse> getNewProductsOnSaleToday(Pageable pageable);
}
