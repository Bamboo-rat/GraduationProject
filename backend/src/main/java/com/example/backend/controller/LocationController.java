package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.District;
import com.example.backend.dto.response.Province;
import com.example.backend.dto.response.Ward;
import com.example.backend.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations") // Base path cho API
@RequiredArgsConstructor
@Tag(name = "Location", description = "Endpoints for fetching location data (provinces, districts, wards)")
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/provinces")
    @Operation(summary = "Get all provinces", description = "Lấy danh sách tất cả tỉnh/thành phố của Việt Nam")
    public ResponseEntity<ApiResponse<List<Province>>> getAllProvinces() {
        List<Province> provinces = locationService.getAllProvinces();
        // Giả sử bạn có một lớp ApiResponse tiêu chuẩn để bọc dữ liệu
        return ResponseEntity.ok(ApiResponse.success("Fetched all provinces successfully", provinces));
    }

    @GetMapping("/districts/{provinceCode}")
    @Operation(summary = "Get districts by province code", description = "Lấy danh sách quận/huyện theo mã tỉnh/thành phố")
    public ResponseEntity<ApiResponse<List<District>>> getDistrictsByProvince(
            @PathVariable int provinceCode
    ) {
        List<District> districts = locationService.getDistrictsByProvince(provinceCode);
        return ResponseEntity.ok(ApiResponse.success("Fetched districts for province code " + provinceCode, districts));
    }

    @GetMapping("/wards/{districtCode}")
    @Operation(summary = "Get wards by district code", description = "Lấy danh sách phường/xã theo mã quận/huyện")
    public ResponseEntity<ApiResponse<List<Ward>>> getWardsByDistrict(
            @PathVariable int districtCode
    ) {
        List<Ward> wards = locationService.getWardsByDistrict(districtCode);
        return ResponseEntity.ok(ApiResponse.success("Fetched wards for district code " + districtCode, wards));
    }
}