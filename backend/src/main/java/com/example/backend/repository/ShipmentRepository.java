package com.example.backend.repository;

import com.example.backend.entity.Order;
import com.example.backend.entity.Shipment;
import com.example.backend.entity.enums.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, String> {

    /**
     * Find shipment by order
     */
    Optional<Shipment> findByOrder(Order order);

    /**
     * Find shipment by order ID
     */
    @Query("SELECT s FROM Shipment s WHERE s.order.orderId = :orderId")
    Optional<Shipment> findByOrderId(@Param("orderId") String orderId);

    /**
     * Find shipment by tracking number
     */
    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    /**
     * Find shipments by status
     */
    List<Shipment> findByStatus(ShipmentStatus status);

    /**
     * Count shipments by status
     */
    long countByStatus(ShipmentStatus status);

    /**
     * Check if tracking number exists
     */
    boolean existsByTrackingNumber(String trackingNumber);
}
