package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ProductCreateRequest {

    @Valid
    @NotNull(message = "Product information is required")
    private ProductInfoRequest product;

    @Valid
    private List<ProductAttributeRequest> attributes = new ArrayList<>();

    @Valid
    @NotEmpty(message = "At least one variant is required")
    private List<ProductVariantRequest> variants = new ArrayList<>();

    @Valid
    private List<ProductImageRequest> images = new ArrayList<>();

    @Valid
    private List<StoreInventoryRequest> storeInventory = new ArrayList<>();
}
