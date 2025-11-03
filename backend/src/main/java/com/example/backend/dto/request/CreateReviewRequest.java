package com.example.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    @NotBlank(message = "Order detail ID không được để trống")
    private String orderDetailId;

    @NotNull(message = "Rating không được để trống")
    @Min(value = 1, message = "Rating tối thiểu là 1 sao")
    @Max(value = 5, message = "Rating tối đa là 5 sao")
    private Integer rating;

    @Size(max = 1000, message = "Comment không được vượt quá 1000 ký tự")
    private String comment;

    @Size(max = 1000, message = "Image URL không được vượt quá 1000 ký tự")
    private String imageUrl;
}
