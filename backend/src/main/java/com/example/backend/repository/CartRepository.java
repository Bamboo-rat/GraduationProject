package com.example.backend.repository;

import com.example.backend.entity.Cart;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Store;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, String> {

    /**
     * Find cart by customer and store (enforces one cart per store per customer)
     */
    Optional<Cart> findByCustomerAndStore(Customer customer, Store store);

    /**
     * Find cart by customer and store with pessimistic write lock
     * Used to prevent race condition when creating new carts
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Cart c WHERE c.customer = :customer AND c.store = :store")
    Optional<Cart> findByCustomerAndStoreForUpdate(@Param("customer") Customer customer, @Param("store") Store store);

    /**
     * Find all carts for a customer
     */
    List<Cart> findByCustomer(Customer customer);

    /**
     * Find all carts by customer ID
     */
    @Query("SELECT c FROM Cart c WHERE c.customer.userId = :customerId")
    List<Cart> findByCustomerId(@Param("customerId") String customerId);

    /**
     * Find most recently updated cart for a customer
     */
    @Query("SELECT c FROM Cart c WHERE c.customer.userId = :customerId ORDER BY c.updatedAt DESC LIMIT 1")
    Optional<Cart> findMostRecentCartByCustomerId(@Param("customerId") String customerId);

    /**
     * Delete all carts for a specific customer
     */
    @Modifying
    @Query("DELETE FROM Cart c WHERE c.customer.userId = :customerId")
    void deleteByCustomerId(@Param("customerId") String customerId);

    /**
     * Delete all carts (for end of day reset)
     */
    @Modifying
    @Query("DELETE FROM Cart c")
    void deleteAllCarts();

    /**
     * Count carts by customer
     */
    long countByCustomer(Customer customer);

    /**
     * Check if cart exists for customer and store
     */
    boolean existsByCustomerAndStore(Customer customer, Store store);
}
