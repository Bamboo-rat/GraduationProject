package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCancelRequestRequest {

    @NotNull(message = "Quyết định không được để trống")
    private Boolean approved; // true = approve, false = reject

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String reviewNote;
    
    private Boolean customerFault = false;
}
