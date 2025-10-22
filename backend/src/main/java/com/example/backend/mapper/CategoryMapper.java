package com.example.backend.mapper;

import com.example.backend.dto.response.CategoryResponse;
import com.example.backend.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct Mapper for Category entity to DTO conversion
 */
@Mapper(componentModel = "spring")
public interface CategoryMapper {

    /**
     * Convert Category entity to CategoryResponse DTO
     */
    @Mapping(target = "productCount", expression = "java(category.getProducts() != null ? category.getProducts().size() : 0)")
    CategoryResponse toResponse(Category category);

    /**
     * Convert list of Category entities to list of CategoryResponse DTOs
     */
    List<CategoryResponse> toResponseList(List<Category> categories);
}
