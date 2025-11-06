package com.example.backend.controller;

import com.example.backend.dto.response.*;
import com.example.backend.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/mobile/stores")
@RequiredArgsConstructor
@Tag(name = "Mobile Store", description = "Public mobile endpoints: store info, categories, products by category")
public class MobileStoreController {

    private final StoreService storeService;

    @GetMapping("/{storeId}")
    @Operation(summary = "Mobile - Get store info", description = "Get public store information for mobile clients")
    public ResponseEntity<ApiResponse<StoreResponse>> getStore(@PathVariable String storeId) {
        log.info("GET /api/mobile/stores/{}", storeId);
        StoreResponse store = storeService.getStoreById(storeId);
        return ResponseEntity.ok(ApiResponse.success("Store retrieved successfully", store));
    }

    @GetMapping("/{storeId}/full")
    @Operation(summary = "Mobile - Get store with categories and products", 
               description = "Get store with nested structure: Store -> Categories -> Products. " +
                           "Each category includes limited products (default 10, max 50). " +
                           "Only shows available products from ACTIVE stores.")
    public ResponseEntity<ApiResponse<StoreWithCategoriesResponse>> getStoreWithCategoriesAndProducts(
            @PathVariable String storeId,
            @RequestParam(required = false, defaultValue = "10") Integer productsPerCategory) {
        log.info("GET /api/mobile/stores/{}/full?productsPerCategory={}", storeId, productsPerCategory);
        
        // Limit max products per category to prevent huge responses
        if (productsPerCategory > 50) {
            productsPerCategory = 50;
        }
        
        StoreWithCategoriesResponse response = storeService.getStoreWithCategoriesAndProducts(storeId, productsPerCategory);
        return ResponseEntity.ok(ApiResponse.success("Store with categories and products retrieved successfully", response));
    }

    @GetMapping("/{storeId}/categories")
    @Operation(summary = "Mobile - Get categories available at store", description = "List categories that currently have purchasable products at this store")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getStoreCategories(@PathVariable String storeId) {
        log.info("GET /api/mobile/stores/{}/categories", storeId);
        List<CategoryResponse> categories = storeService.getAvailableCategoriesForStore(storeId);
        return ResponseEntity.ok(ApiResponse.success("Store categories retrieved successfully", categories));
    }

    @GetMapping("/{storeId}/categories/{categoryId}/products")
    @Operation(summary = "Mobile - Get products by category at store", description = "List AVAILABLE product variants at this store filtered by category. Only stock > 0 and not expired.")
    public ResponseEntity<ApiResponse<Page<StoreProductVariantResponse>>> getProductsByCategory(
            @PathVariable String storeId,
            @PathVariable String categoryId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("GET /api/mobile/stores/{}/categories/{}/products", storeId, categoryId);
        Page<StoreProductVariantResponse> page = storeService.getAvailableProductVariantsForStoreByCategory(storeId, categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Products by category retrieved successfully", page));
    }
}
