package com.example.backend.controller;

import com.example.backend.dto.request.ProductCreateRequest;
import com.example.backend.dto.request.ProductStatusUpdateRequest;
import com.example.backend.dto.request.ProductUpdateRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.ProductResponse;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.service.ProductService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
@Tag(name = "Product", description = "Product management endpoints (GET methods are public, write operations require authentication)")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Create new product with variants and attributes",
            description = "Create a complete product with all variants, attributes, images, and inventory in a single request"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request,
            Authentication authentication) {

        log.info("POST /api/products - Creating new product: {}", request.getProduct().getName());

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        ProductResponse response = productService.createProduct(request, keycloakId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully and is now active.", response));
    }

    @GetMapping
    @Operation(
            summary = "Get all products",
            description = "Get all products with optional filters (status, category, supplier, search)"
    )
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {

        log.info("GET /api/products - Filters: status={}, categoryId={}, supplierId={}, search={}",
                status, categoryId, supplierId, search);

        Page<ProductResponse> products = productService.getAllProducts(status, categoryId, supplierId, search, pageable);

        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", products));
    }

    @GetMapping("/my-products")
    @PreAuthorize("hasRole('SUPPLIER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Get my products",
            description = "Get products of current supplier with optional filters"
    )
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getMyProducts(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("GET /api/products/my-products - Supplier: {}, status={}, search={}", keycloakId, status, search);

        Page<ProductResponse> products = productService.getMyProducts(keycloakId, status, search, pageable);

        return ResponseEntity.ok(ApiResponse.success("My products retrieved successfully", products));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get product by ID",
            description = "Get detailed information of a specific product"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable String id) {

        log.info("GET /api/products/{} - Get product details", id);

        ProductResponse product = productService.getProductById(id);

        return ResponseEntity.ok(ApiResponse.success("Product retrieved successfully", product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Update product",
            description = "Update product basic information (name, description, category)"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody ProductUpdateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PUT /api/products/{} - Updating product by supplier {}", id, keycloakId);

        ProductResponse product = productService.updateProduct(id, request, keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", product));
    }

    @PatchMapping("/{id}/visibility")
    @PreAuthorize("hasRole('SUPPLIER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Toggle product visibility",
            description = "Supplier can hide (INACTIVE) or show (ACTIVE) their product"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> toggleProductVisibility(
            @PathVariable String id,
            @RequestParam boolean makeActive,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/products/{}/visibility - Toggle to {} by supplier {}",
                id, makeActive ? "ACTIVE" : "INACTIVE", keycloakId);

        ProductResponse product = productService.toggleProductVisibility(id, keycloakId, makeActive);

        return ResponseEntity.ok(ApiResponse.success("Product visibility updated successfully", product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Delete product (soft delete with Cloudinary cleanup)",
            description = "Soft delete product by setting status to DELETED and removing images from Cloudinary"
    )
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable String id,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("DELETE /api/products/{} - Soft deleting product and cleaning up images by supplier {}", id, keycloakId);

        productService.deleteProduct(id, keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully and images removed from cloud storage", null));
    }

    @PatchMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Suspend product (Admin only)",
            description = "Admin suspends a product for policy violation"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> suspendProduct(
            @PathVariable String id,
            @RequestParam String reason) {

        log.info("PATCH /api/products/{}/suspend - Admin suspending product. Reason: {}", id, reason);

        ProductResponse product = productService.suspendProduct(id, reason);

        return ResponseEntity.ok(ApiResponse.success("Product suspended successfully", product));
    }

    @PatchMapping("/{id}/unsuspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Unsuspend product (Admin only)",
            description = "Admin unsuspends a previously suspended product"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> unsuspendProduct(@PathVariable String id) {

        log.info("PATCH /api/products/{}/unsuspend - Admin unsuspending product", id);

        ProductResponse product = productService.unsuspendProduct(id);

        return ResponseEntity.ok(ApiResponse.success("Product unsuspended successfully", product));
    }

    @PatchMapping("/{productId}/variants/{variantId}/stores/{storeId}/stock")
    @PreAuthorize("hasRole('SUPPLIER')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Update stock quantity for a variant at a store",
            description = "Supplier updates stock quantity for a specific variant at a specific store"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> updateVariantStock(
            @PathVariable String productId,
            @PathVariable String variantId,
            @PathVariable String storeId,
            @Valid @RequestBody com.example.backend.dto.request.StockUpdateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/products/{}/variants/{}/stores/{}/stock - Updating stock to {} by supplier {}",
                productId, variantId, storeId, request.getStockQuantity(), keycloakId);

        ProductResponse product = productService.updateVariantStockAtStore(
                productId, variantId, storeId, request.getStockQuantity(), keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", product));
    }
}
