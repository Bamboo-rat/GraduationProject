package com.example.backend.service;

import com.example.backend.dto.response.District;
import com.example.backend.dto.response.Province;
import com.example.backend.dto.response.Ward;

import java.util.List;

public interface LocationService {
    /**
     * Lấy danh sách tất cả Tỉnh/Thành phố.
     * API: https://provinces.open-api.vn/api/v1/p/
     */
    List<Province> getAllProvinces();

    /**
     * Lấy danh sách Quận/Huyện theo mã Tỉnh/Thành phố.
     * API: https://provinces.open-api.vn/api/v1/p/{provinceCode}?depth=2
     */
    List<District> getDistrictsByProvince(int provinceCode);

    /**
     * Lấy danh sách Phường/Xã theo mã Quận/Huyện.
     * API: https://provinces.open-api.vn/api/v1/d/{districtCode}?depth=2
     */
    List<Ward> getWardsByDistrict(int districtCode);
}
