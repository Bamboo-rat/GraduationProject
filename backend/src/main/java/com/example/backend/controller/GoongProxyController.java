package com.example.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

/**
 * Proxy controller for Goong Maps API to avoid CORS issues
 * This allows frontend to call Goong API through backend
 */
@Slf4j
@RestController
@RequestMapping("/api/goong")
@RequiredArgsConstructor
@Tag(name = "Goong Proxy", description = "Proxy endpoints for Goong Maps API")
public class GoongProxyController {

    @Value("${goong.api.key:}")
    private String goongApiKey;

    private final RestTemplate restTemplate;

    @GetMapping("/autocomplete")
    @Operation(summary = "Autocomplete address", description = "Proxy for Goong Place Autocomplete API")
    public ResponseEntity<String> autocomplete(
            @RequestParam("input") String input,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "radius", required = false, defaultValue = "50000") Integer radius
    ) {
        log.info("Goong autocomplete request: input={}", input);

        if (goongApiKey == null || goongApiKey.isEmpty()) {
            log.error("Goong API key not configured");
            return ResponseEntity.badRequest().body("{\"error\":\"Goong API key not configured\"}");
        }

        try {
            StringBuilder url = new StringBuilder("https://rsapi.goong.io/Place/AutoComplete");
            url.append("?api_key=").append(goongApiKey);
            url.append("&input=").append(java.net.URLEncoder.encode(input, "UTF-8"));

            if (location != null && !location.isEmpty()) {
                url.append("&location=").append(location);
            }
            url.append("&radius=").append(radius);

            String response = restTemplate.getForObject(url.toString(), String.class);
            log.info("Goong autocomplete success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Goong autocomplete error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body("{\"error\":\"Failed to fetch autocomplete results\"}");
        }
    }

    @GetMapping("/place-detail")
    @Operation(summary = "Get place details", description = "Proxy for Goong Place Detail API")
    public ResponseEntity<String> placeDetail(@RequestParam("place_id") String placeId) {
        log.info("Goong place detail request: place_id={}", placeId);

        if (goongApiKey == null || goongApiKey.isEmpty()) {
            log.error("Goong API key not configured");
            return ResponseEntity.badRequest().body("{\"error\":\"Goong API key not configured\"}");
        }

        try {
            String url = String.format(
                    "https://rsapi.goong.io/Place/Detail?place_id=%s&api_key=%s",
                    placeId, goongApiKey
            );

            String response = restTemplate.getForObject(url, String.class);
            log.info("Goong place detail success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Goong place detail error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body("{\"error\":\"Failed to fetch place details\"}");
        }
    }
}
