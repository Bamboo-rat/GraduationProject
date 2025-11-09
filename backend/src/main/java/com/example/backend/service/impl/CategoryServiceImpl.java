package com.example.backend.service.impl;

import com.example.backend.dto.request.CategoryRequest;
import com.example.backend.dto.response.CategoryResponse;
import com.example.backend.entity.Category;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.CategoryMapper;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        log.info("Creating new category: {}", request.getName());

        // Check if category name already exists
        if (categoryRepository.existsByName(request.getName())) {
            throw new ConflictException(ErrorCode.CATEGORY_NAME_ALREADY_EXISTS);
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        category.setActive(request.getActive() != null ? request.getActive() : true);

        category = categoryRepository.save(category);
        log.info("Category created successfully: {}", category.getCategoryId());

        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(String categoryId, CategoryRequest request) {
        log.info("Updating category: {}", categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        // Check if name is being changed and if new name already exists
        if (!category.getName().equals(request.getName()) &&
            categoryRepository.existsByNameAndCategoryIdNot(request.getName(), categoryId)) {
            throw new ConflictException(ErrorCode.CATEGORY_NAME_ALREADY_EXISTS);
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }

        category = categoryRepository.save(category);
        log.info("Category updated successfully: {}", categoryId);

        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(String categoryId) {
        log.info("Getting category by ID: {}", categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CategoryResponse> getAllCategories(
            int page,
            int size,
            Boolean active,
            String search,
            String sortBy,
            String sortDirection
    ) {
        log.info("Getting all categories: page={}, size={}, active={}, search={}",
                page, size, active, search);

        // Validate and set defaults
        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "createdAt";
        }
        if (sortDirection == null || sortDirection.isBlank()) {
            sortDirection = "DESC";
        }

        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Category> categories = categoryRepository.findByActiveAndSearch(active, search, pageable);

        return categories.map(categoryMapper::toResponse);
    }

    @Override
    @Transactional
    public CategoryResponse toggleActive(String categoryId, boolean active) {
        log.info("Toggling category active status: categoryId={}, active={}", categoryId, active);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        // Validation: If deactivating (hiding) category, check for active products
        if (!active) {
            long activeProductCount = productRepository.countByCategoryIdAndStatus(
                    categoryId, 
                    ProductStatus.ACTIVE
            );
            
            if (activeProductCount > 0) {
                log.warn("Cannot deactivate category {} - it has {} active products", 
                        categoryId, activeProductCount);
                throw new ConflictException(
                    ErrorCode.CATEGORY_HAS_ACTIVE_PRODUCTS,
                    String.format("Không thể ẩn danh mục vì còn %d sản phẩm đang hoạt động. " +
                                "Vui lòng ẩn hoặc xóa tất cả sản phẩm trước.", activeProductCount)
                );
            }
            
            log.info("Category {} has no active products, proceeding with deactivation", categoryId);
        }

        category.setActive(active);
        category = categoryRepository.save(category);

        log.info("Category active status toggled successfully: categoryId={}, active={}", 
                categoryId, active);

        return categoryMapper.toResponse(category);
    }
}
