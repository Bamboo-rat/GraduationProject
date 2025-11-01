package com.example.backend.service;

import com.example.backend.dto.request.AddressRequest;
import com.example.backend.dto.response.AddressResponse;

import java.util.List;

/**
 * Service interface for address management operations
 * Handles customer delivery addresses with default address logic
 */
public interface AddressService {

    /**
     * Get all addresses for a customer
     *
     * @param customerId Customer user ID
     * @return List of addresses ordered by default status
     */
    List<AddressResponse> getCustomerAddresses(String customerId);

    /**
     * Get address by ID
     *
     * @param customerId Customer user ID (for security check)
     * @param addressId Address ID
     * @return Address response
     */
    AddressResponse getAddressById(String customerId, String addressId);

    /**
     * Get default address for a customer
     *
     * @param customerId Customer user ID
     * @return Default address or null if no default set
     */
    AddressResponse getDefaultAddress(String customerId);

    /**
     * Add new address for customer
     * If this is the first address or isDefault=true, it will be set as default
     * If isDefault=true, all other addresses will be set to non-default
     *
     * @param customerId Customer user ID
     * @param request Address details
     * @return Created address
     */
    AddressResponse addAddress(String customerId, AddressRequest request);

    /**
     * Update existing address
     * If isDefault=true in request, all other addresses will be set to non-default
     *
     * @param customerId Customer user ID (for security check)
     * @param addressId Address ID to update
     * @param request Updated address details
     * @return Updated address
     */
    AddressResponse updateAddress(String customerId, String addressId, AddressRequest request);

    /**
     * Delete address
     * If deleting the default address and other addresses exist,
     * automatically set the first remaining address as default
     *
     * @param customerId Customer user ID (for security check)
     * @param addressId Address ID to delete
     */
    void deleteAddress(String customerId, String addressId);

    /**
     * Set an address as default
     * This will automatically unset other addresses as default
     *
     * @param customerId Customer user ID (for security check)
     * @param addressId Address ID to set as default
     * @return Updated address
     */
    AddressResponse setDefaultAddress(String customerId, String addressId);
}
