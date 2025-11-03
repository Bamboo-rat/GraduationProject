package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSystemConfigRequest {

    @NotBlank(message = "Config key không được để trống")
    private String configKey;

    @NotBlank(message = "Config value không được để trống")
    private String configValue;

    private String description;
}
