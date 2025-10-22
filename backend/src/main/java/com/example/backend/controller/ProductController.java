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
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        ProductResponse response = productService.createProduct(request, keycloakId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully. Waiting for admin approval.", response));
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

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Update product status",
            description = "Update product status (e.g., ACTIVE, SOLD_OUT, etc.)"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStatus(
            @PathVariable String id,
            @Valid @RequestBody ProductStatusUpdateRequest request,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("PATCH /api/products/{}/status - Updating status to {} by supplier {}", 
                id, request.getStatus(), keycloakId);

        ProductResponse product = productService.updateProductStatus(id, request, keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Product status updated successfully", product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Delete product (soft delete)",
            description = "Soft delete product by setting status to SOLD_OUT"
    )
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable String id,
            Authentication authentication) {

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        log.info("DELETE /api/products/{} - Soft deleting product by supplier {}", id, keycloakId);

        productService.deleteProduct(id, keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Approve product (Super Admin only)",
            description = "Super Admin approves a pending product"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> approveProduct(@PathVariable String id) {

        log.info("PATCH /api/products/{}/approve - Admin approving product", id);

        ProductResponse product = productService.approveProduct(id);

        return ResponseEntity.ok(ApiResponse.success("Product approved successfully", product));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Reject product (Super Admin only)",
            description = "Super Admin rejects a pending product"
    )
    public ResponseEntity<ApiResponse<ProductResponse>> rejectProduct(
            @PathVariable String id,
            @RequestParam String reason) {

        log.info("PATCH /api/products/{}/reject - Admin rejecting product. Reason: {}", id, reason);

        ProductResponse product = productService.rejectProduct(id, reason);

        return ResponseEntity.ok(ApiResponse.success("Product rejected successfully", product));
    }
}
