package com.example.backend.controller;

import com.example.backend.dto.request.CategoryRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.CategoryResponse;
import com.example.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for product category management
 */
@Slf4j
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "Product category management endpoints")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Create new category",
               description = "Create a new product category (admin only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request) {
        log.info("POST /api/categories - Creating new category: {}", request.getName());

        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created successfully", response));
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Update category",
               description = "Update an existing category (admin only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable String categoryId,
            @Valid @RequestBody CategoryRequest request) {
        log.info("PUT /api/categories/{} - Updating category", categoryId);

        CategoryResponse response = categoryService.updateCategory(categoryId, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", response));
    }

    @GetMapping("/{categoryId}")
    @Operation(summary = "Get category by ID",
               description = "Get category details by ID (public)")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable String categoryId) {
        log.info("GET /api/categories/{} - Getting category", categoryId);

        CategoryResponse response = categoryService.getCategoryById(categoryId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Get all categories",
               description = "Get list of all categories with pagination, search, and filtering (public)")
    public ResponseEntity<ApiResponse<Page<CategoryResponse>>> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        log.info("GET /api/categories - Getting all categories (page: {}, size: {}, active: {}, search: {})",
                page, size, active, search);

        Page<CategoryResponse> categories = categoryService.getAllCategories(
                page, size, active, search, sortBy, sortDirection);

        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Delete category",
               description = "Soft delete a category (admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String categoryId) {
        log.info("DELETE /api/categories/{} - Soft deleting category", categoryId);

        categoryService.deleteCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }

    @PatchMapping("/{categoryId}/toggle-active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Toggle category active status",
               description = "Activate or deactivate a category (admin only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> toggleActive(
            @PathVariable String categoryId,
            @RequestParam boolean active) {
        log.info("PATCH /api/categories/{}/toggle-active - Setting active={}", categoryId, active);

        CategoryResponse response = categoryService.toggleActive(categoryId, active);
        return ResponseEntity.ok(ApiResponse.success("Category status updated successfully", response));
    }
}
