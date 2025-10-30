package com.example.backend.service.impl;

import com.example.backend.dto.response.District;
import com.example.backend.dto.response.Province;
import com.example.backend.dto.response.Ward;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final RestTemplate restTemplate;
    private static final String API_BASE_URL = "https://provinces.open-api.vn/api/v1";

    @Override
    public List<Province> getAllProvinces() {
        String url = API_BASE_URL + "/p/";
        log.info("Fetching all provinces from: {}", url);
        try {
            // API trả về một List<Province>
            ResponseEntity<List<Province>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Province>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching provinces: {}", e.getMessage());
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Could not fetch provinces: " + e.getMessage());
        }
    }

    @Override
    public List<District> getDistrictsByProvince(int provinceCode) {
        // API trả về một đối tượng Province, bên trong có List<District>
        String url = API_BASE_URL + "/p/" + provinceCode + "?depth=2";
        log.info("Fetching districts for province code {}: {}", provinceCode, url);
        try {
            ResponseEntity<Province> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Province>() {}
            );
            Province province = response.getBody();
            return (province != null) ? province.getDistricts() : List.of();
        } catch (Exception e) {
            log.error("Error fetching districts for province code {}: {}", provinceCode, e.getMessage());
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Could not fetch districts for province code " + provinceCode + ": " + e.getMessage());
        }
    }

    @Override
    public List<Ward> getWardsByDistrict(int districtCode) {
        // API trả về một đối tượng District, bên trong có List<Ward>
        String url = API_BASE_URL + "/d/" + districtCode + "?depth=2";
        log.info("Fetching wards for district code {}: {}", districtCode, url);
        try {
            ResponseEntity<District> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<District>() {}
            );
            District district = response.getBody();
            return (district != null) ? district.getWards() : List.of();
        } catch (Exception e) {
            log.error("Error fetching wards for district code {}: {}", districtCode, e.getMessage());
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Could not fetch wards for district code " + districtCode + ": " + e.getMessage());
        }
    }
}
