package com.example.backend.repository;

import com.example.backend.entity.Address;
import com.example.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Address entity
 * Handles customer delivery addresses with default address management
 */
@Repository
public interface AddressRepository extends JpaRepository<Address, String> {

    /**
     * Find all addresses for a specific customer
     * @param customerId Customer user ID
     * @return List of addresses ordered by default status then creation date
     */
    @Query("SELECT a FROM Address a WHERE a.customer.userId = :customerId ORDER BY a.isDefault DESC, a.addressId DESC")
    List<Address> findByCustomerId(@Param("customerId") String customerId);

    /**
     * Find all addresses by customer entity
     * @param customer Customer entity
     * @return List of addresses
     */
    List<Address> findByCustomer(Customer customer);

    /**
     * Find default address for a specific customer
     * @param customerId Customer user ID
     * @return Optional default address
     */
    @Query("SELECT a FROM Address a WHERE a.customer.userId = :customerId AND a.isDefault = true")
    Optional<Address> findDefaultAddressByCustomerId(@Param("customerId") String customerId);

    /**
     * Find address by ID and customer ID (for security check)
     * @param addressId Address ID
     * @param customerId Customer user ID
     * @return Optional address
     */
    @Query("SELECT a FROM Address a WHERE a.addressId = :addressId AND a.customer.userId = :customerId")
    Optional<Address> findByIdAndCustomerId(@Param("addressId") String addressId, @Param("customerId") String customerId);

    /**
     * Set all addresses of a customer to non-default
     * Used before setting a new default address
     * @param customerId Customer user ID
     */
    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.customer.userId = :customerId")
    void clearDefaultForCustomer(@Param("customerId") String customerId);

    /**
     * Count addresses for a customer
     * @param customerId Customer user ID
     * @return Number of addresses
     */
    @Query("SELECT COUNT(a) FROM Address a WHERE a.customer.userId = :customerId")
    long countByCustomerId(@Param("customerId") String customerId);
}
