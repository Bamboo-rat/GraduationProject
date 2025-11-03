package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCancelRequestRequest {

    @NotBlank(message = "Lý do hủy không được để trống")
    @Size(min = 10, max = 1000, message = "Lý do hủy phải từ 10 đến 1000 ký tự")
    private String reason;
}
