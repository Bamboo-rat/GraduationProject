package com.example.backend.service;

import com.example.backend.dto.request.ProductCreateRequest;
import com.example.backend.dto.request.ProductStatusUpdateRequest;
import com.example.backend.dto.request.ProductUpdateRequest;
import com.example.backend.dto.response.ProductResponse;
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
     * Get all products with pagination and filtering
     * @param status Filter by status (optional)
     * @param categoryId Filter by category (optional)
     * @param supplierId Filter by supplier (optional)
     * @param search Search by name (optional)
     * @param pageable Pagination parameters
     * @return Page of products
     */
    Page<ProductResponse> getAllProducts(ProductStatus status, String categoryId, String supplierId, String search, Pageable pageable);

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
     * Update product status
     * @param productId Product ID
     * @param request Status update request
     * @param keycloakId Keycloak ID from JWT (for ownership validation)
     * @return Updated product
     */
    ProductResponse updateProductStatus(String productId, ProductStatusUpdateRequest request, String keycloakId);

    /**
     * Delete product (soft delete by setting status to DELETED)
     * @param productId Product ID
     * @param keycloakId Keycloak ID from JWT (for ownership validation)
     */
    void deleteProduct(String productId, String keycloakId);

    /**
     * Admin approve product
     * @param productId Product ID
     * @return Updated product
     */
    ProductResponse approveProduct(String productId);

    /**
     * Admin reject product
     * @param productId Product ID
     * @param reason Rejection reason
     * @return Updated product
     */
    ProductResponse rejectProduct(String productId, String reason);
}
