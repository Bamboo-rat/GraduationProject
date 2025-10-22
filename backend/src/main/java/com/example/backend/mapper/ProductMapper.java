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
    ProductResponse toResponse(Product product);

    /**
     * Convert ProductVariant entity to ProductVariantResponse DTO
     */
    @Mapping(target = "variantImages", source = "variantImages")
    ProductVariantResponse toVariantResponse(ProductVariant variant);

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
