package com.example.backend.mapper;

import com.example.backend.dto.response.ProductAttributeResponse;
import com.example.backend.dto.response.ProductImageResponse;
import com.example.backend.dto.response.ProductResponse;
import com.example.backend.dto.response.ProductVariantResponse;
import com.example.backend.entity.Product;
import com.example.backend.entity.ProductAttribute;
import com.example.backend.entity.ProductImage;
import com.example.backend.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct Mapper for Product entity to DTO conversion
 */
@Mapper(componentModel = "spring")
public interface ProductMapper {

    /**
     * Convert Product entity to ProductResponse DTO
     */
    @Mapping(target = "categoryId", source = "category.categoryId")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "supplierId", source = "supplier.userId")
    @Mapping(target = "supplierName", source = "supplier.businessName")
    @Mapping(target = "variants", source = "variants")
    @Mapping(target = "images", source = "images")
    @Mapping(target = "attributes", source = "attributes")
    @Mapping(target = "totalInventory", expression = "java(product.getTotalInventory())")
    @Mapping(target = "availableVariantCount", expression = "java(product.getAvailableVariantCount())")
    @Mapping(target = "totalVariantCount", expression = "java((long) product.getVariants().size())")
    ProductResponse toResponse(Product product);

    /**
     * Convert ProductVariant entity to ProductVariantResponse DTO
     */
    @Mapping(target = "variantImages", source = "variantImages")
    @Mapping(target = "totalStock", expression = "java(variant.getTotalStock())")
    @Mapping(target = "isOutOfStock", expression = "java(variant.isOutOfStock())")
    @Mapping(target = "isExpired", expression = "java(variant.isExpired())")
    @Mapping(target = "isAvailable", expression = "java(variant.isAvailable())")
    @Mapping(target = "storeStocks", expression = "java(mapStoreStocks(variant))")
    ProductVariantResponse toVariantResponse(ProductVariant variant);

    /**
     * Map store stocks for a variant
     */
    default List<ProductVariantResponse.StoreStockInfo> mapStoreStocks(ProductVariant variant) {
        return variant.getStoreProducts().stream()
                .map(sp -> ProductVariantResponse.StoreStockInfo.builder()
                        .storeId(sp.getStore().getStoreId())
                        .storeName(sp.getStore().getStoreName())
                        .stockQuantity(sp.getStockQuantity())
                        .priceOverride(sp.getPriceOverride())
                        .build())
                .toList();
    }

    /**
     * Convert list of ProductVariant entities to list of ProductVariantResponse DTOs
     */
    List<ProductVariantResponse> toVariantResponseList(List<ProductVariant> variants);

    /**
     * Convert ProductImage entity to ProductImageResponse DTO
     */
    @Mapping(target = "isPrimary", source = "primary")
    @Mapping(target = "productId", source = "product.productId")
    @Mapping(target = "variantId", source = "variant.variantId")
    ProductImageResponse toImageResponse(ProductImage image);

    /**
     * Convert list of ProductImage entities to list of ProductImageResponse DTOs
     */
    List<ProductImageResponse> toImageResponseList(List<ProductImage> images);

    /**
     * Convert ProductAttribute entity to ProductAttributeResponse DTO
     */
    ProductAttributeResponse toAttributeResponse(ProductAttribute attribute);

    /**
     * Convert list of ProductAttribute entities to list of ProductAttributeResponse DTOs
     */
    List<ProductAttributeResponse> toAttributeResponseList(List<ProductAttribute> attributes);
}
