package com.example.backend.controller;

import com.example.backend.dto.request.AddressRequest;
import com.example.backend.dto.response.AddressResponse;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for customer address management
 * All endpoints require CUSTOMER authentication
 */
@Slf4j
@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Tag(name = "Address", description = "Customer delivery address management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasRole('CUSTOMER')")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @Operation(summary = "Get all customer addresses",
               description = "Get list of all delivery addresses for the authenticated customer")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAllAddresses(Authentication authentication) {
        log.info("GET /api/addresses - Getting all addresses for current customer");

        String customerId = extractUserId(authentication);
        List<AddressResponse> addresses = addressService.getCustomerAddresses(customerId);

        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @GetMapping("/{addressId}")
    @Operation(summary = "Get address by ID",
               description = "Get specific address details by ID")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(
            Authentication authentication,
            @PathVariable String addressId) {
        log.info("GET /api/addresses/{} - Getting address details", addressId);

        String customerId = extractUserId(authentication);
        AddressResponse address = addressService.getAddressById(customerId, addressId);

        return ResponseEntity.ok(ApiResponse.success(address));
    }

    @GetMapping("/default")
    @Operation(summary = "Get default address",
               description = "Get the default delivery address for the authenticated customer")
    public ResponseEntity<ApiResponse<AddressResponse>> getDefaultAddress(Authentication authentication) {
        log.info("GET /api/addresses/default - Getting default address for current customer");

        String customerId = extractUserId(authentication);
        AddressResponse address = addressService.getDefaultAddress(customerId);

        if (address == null) {
            return ResponseEntity.ok(ApiResponse.success("No default address set", null));
        }

        return ResponseEntity.ok(ApiResponse.success(address));
    }

    @PostMapping
    @Operation(summary = "Add new address",
               description = "Create a new delivery address. If this is the first address or isDefault=true, it will be set as default.")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            Authentication authentication,
            @Valid @RequestBody AddressRequest request) {
        log.info("POST /api/addresses - Adding new address for current customer");

        String customerId = extractUserId(authentication);
        AddressResponse address = addressService.addAddress(customerId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added successfully", address));
    }

    @PutMapping("/{addressId}")
    @Operation(summary = "Update address",
               description = "Update an existing delivery address. Set isDefault=true to make it the default address.")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            Authentication authentication,
            @PathVariable String addressId,
            @Valid @RequestBody AddressRequest request) {
        log.info("PUT /api/addresses/{} - Updating address", addressId);

        String customerId = extractUserId(authentication);
        AddressResponse address = addressService.updateAddress(customerId, addressId, request);

        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", address));
    }

    @DeleteMapping("/{addressId}")
    @Operation(summary = "Delete address",
               description = "Delete a delivery address. If deleting the default address, another address will be automatically set as default.")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            Authentication authentication,
            @PathVariable String addressId) {
        log.info("DELETE /api/addresses/{} - Deleting address", addressId);

        String customerId = extractUserId(authentication);
        addressService.deleteAddress(customerId, addressId);

        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", null));
    }

    @PatchMapping("/{addressId}/set-default")
    @Operation(summary = "Set default address",
               description = "Set a specific address as the default delivery address. All other addresses will be set to non-default.")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(
            Authentication authentication,
            @PathVariable String addressId) {
        log.info("PATCH /api/addresses/{}/set-default - Setting address as default", addressId);

        String customerId = extractUserId(authentication);
        AddressResponse address = addressService.setDefaultAddress(customerId, addressId);

        return ResponseEntity.ok(ApiResponse.success("Default address updated successfully", address));
    }

    /**
     * Extract user ID from JWT token
     * For customers, the subject is the userId
     */
    private String extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}
