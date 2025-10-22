package com.example.backend.service;

import com.example.backend.dto.request.CategoryRequest;
import com.example.backend.dto.response.CategoryResponse;
import org.springframework.data.domain.Page;

public interface CategoryService {

    /**
     * Create a new category
     * @param request Category request
     * @return Created category response
     */
    CategoryResponse createCategory(CategoryRequest request);

    /**
     * Update an existing category
     * @param categoryId Category ID
     * @param request Category request
     * @return Updated category response
     */
    CategoryResponse updateCategory(String categoryId, CategoryRequest request);

    /**
     * Get category by ID
     * @param categoryId Category ID
     * @return Category response
     */
    CategoryResponse getCategoryById(String categoryId);

    /**
     * Get all categories with pagination, search, and filtering
     * @param page Page number
     * @param size Page size
     * @param active Filter by active status (optional)
     * @param search Search by name or description (optional)
     * @param sortBy Sort field
     * @param sortDirection Sort direction (ASC/DESC)
     * @return Page of categories
     */
    Page<CategoryResponse> getAllCategories(
            int page,
            int size,
            Boolean active,
            String search,
            String sortBy,
            String sortDirection
    );

    /**
     * Soft delete a category
     * @param categoryId Category ID
     */
    void deleteCategory(String categoryId);

    /**
     * Toggle category active status
     * @param categoryId Category ID
     * @param active Active status
     * @return Updated category response
     */
    CategoryResponse toggleActive(String categoryId, boolean active);
}
