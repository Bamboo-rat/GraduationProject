package com.example.backend.service;

import com.example.backend.dto.response.ShippingPartnerOrderResponse;

import java.util.List;

/**
 * Lightweight service exposing read/update operations for the third-party shipping demo.
 */
public interface ShippingPartnerDemoService {

    /**
     * List all shipments that are currently in transit.
     */
    List<ShippingPartnerOrderResponse> getInTransitOrders(String shippingProvider);

    /**
     * Fetch a single shipment using its tracking number.
     */
    ShippingPartnerOrderResponse getOrderByTrackingNumber(String trackingNumber);

    /**
     * Mark an in-transit order as delivered using the tracking number.
     */
    ShippingPartnerOrderResponse markDelivered(String trackingNumber);
}