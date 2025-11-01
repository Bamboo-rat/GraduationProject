package com.example.backend.service.impl;

import com.example.backend.dto.request.AddressRequest;
import com.example.backend.dto.response.AddressResponse;
import com.example.backend.entity.Address;
import com.example.backend.entity.Customer;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.AddressMapper;
import com.example.backend.repository.AddressRepository;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.service.AddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of AddressService
 * Handles customer delivery addresses with default address management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;
    private final AddressMapper addressMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getCustomerAddresses(String customerId) {
        log.info("Getting all addresses for customer: {}", customerId);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        List<Address> addresses = addressRepository.findByCustomerId(customerId);
        log.info("Found {} addresses for customer: {}", addresses.size(), customerId);

        return addresses.stream()
                .map(addressMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddressById(String customerId, String addressId) {
        log.info("Getting address: {} for customer: {}", addressId, customerId);

        Address address = addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getDefaultAddress(String customerId) {
        log.info("Getting default address for customer: {}", customerId);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        Address address = addressRepository.findDefaultAddressByCustomerId(customerId)
                .orElse(null);

        if (address == null) {
            log.info("No default address found for customer: {}", customerId);
            return null;
        }

        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse addAddress(String customerId, AddressRequest request) {
        log.info("Adding new address for customer: {}", customerId);

        // Get customer
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if this is the first address or explicitly set as default
        long addressCount = addressRepository.countByCustomerId(customerId);
        boolean shouldBeDefault = addressCount == 0 || request.isDefault();

        // If setting as default, clear all existing defaults
        if (shouldBeDefault) {
            log.info("Setting new address as default for customer: {}", customerId);
            addressRepository.clearDefaultForCustomer(customerId);
        }

        // Create new address
        Address address = addressMapper.toEntity(request);
        address.setCustomer(customer);
        address.setDefault(shouldBeDefault);

        address = addressRepository.save(address);
        log.info("Address created successfully: {} for customer: {}", address.getAddressId(), customerId);

        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(String customerId, String addressId, AddressRequest request) {
        log.info("Updating address: {} for customer: {}", addressId, customerId);

        // Get address with security check
        Address address = addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // If request wants to set as default
        if (request.isDefault() && !address.isDefault()) {
            log.info("Changing default address for customer: {}", customerId);
            addressRepository.clearDefaultForCustomer(customerId);
        }

        // Update address fields
        addressMapper.updateEntityFromRequest(request, address);

        address = addressRepository.save(address);
        log.info("Address updated successfully: {}", addressId);

        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public void deleteAddress(String customerId, String addressId) {
        log.info("Deleting address: {} for customer: {}", addressId, customerId);

        // Get address with security check
        Address address = addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        boolean wasDefault = address.isDefault();

        // Delete the address
        addressRepository.delete(address);
        log.info("Address deleted successfully: {}", addressId);

        // If deleted address was default, set another address as default
        if (wasDefault) {
            List<Address> remainingAddresses = addressRepository.findByCustomerId(customerId);
            if (!remainingAddresses.isEmpty()) {
                Address newDefault = remainingAddresses.get(0);
                newDefault.setDefault(true);
                addressRepository.save(newDefault);
                log.info("Set new default address: {} for customer: {}", newDefault.getAddressId(), customerId);
            }
        }
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(String customerId, String addressId) {
        log.info("Setting default address: {} for customer: {}", addressId, customerId);

        // Get address with security check
        Address address = addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // If already default, no need to change
        if (address.isDefault()) {
            log.info("Address {} is already default for customer: {}", addressId, customerId);
            return addressMapper.toResponse(address);
        }

        // Clear all existing defaults
        addressRepository.clearDefaultForCustomer(customerId);

        // Set this address as default
        address.setDefault(true);
        address = addressRepository.save(address);

        log.info("Default address set successfully: {} for customer: {}", addressId, customerId);
        return addressMapper.toResponse(address);
    }
}
