package com.example.backend.service.impl;

import com.example.backend.dto.response.ShippingPartnerOrderResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Order;
import com.example.backend.entity.Shipment;
import com.example.backend.entity.Store;
import com.example.backend.entity.enums.ShipmentStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.ShipmentRepository;
import com.example.backend.service.OrderService;
import com.example.backend.service.ShippingPartnerDemoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShippingPartnerDemoServiceImpl implements ShippingPartnerDemoService {

    private final ShipmentRepository shipmentRepository;
    private final OrderService orderService;

    @Override
    public List<ShippingPartnerOrderResponse> getInTransitOrders(String shippingProvider) {
        return shipmentRepository.findByStatus(ShipmentStatus.SHIPPING)
                .stream()
                .filter(shipment -> shippingProvider == null
                        || shippingProvider.isBlank()
                        || shippingProvider.equalsIgnoreCase(shipment.getShippingProvider()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ShippingPartnerOrderResponse getOrderByTrackingNumber(String trackingNumber) {
        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SHIPMENT_NOT_FOUND));
        return mapToResponse(shipment);
    }

    @Override
    @Transactional
    public ShippingPartnerOrderResponse markDelivered(String trackingNumber) {
        orderService.markAsDeliveredByTrackingNumber(trackingNumber);

        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SHIPMENT_NOT_FOUND));
        return mapToResponse(shipment);
    }

    private ShippingPartnerOrderResponse mapToResponse(Shipment shipment) {
        Order order = shipment.getOrder();
        if (order == null) {
            throw new NotFoundException(ErrorCode.ORDER_NOT_FOUND);
        }

        Customer customer = order.getCustomer();
        Store store = order.getStore();

        return ShippingPartnerOrderResponse.builder()
                .trackingNumber(shipment.getTrackingNumber())
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .shippingProvider(shipment.getShippingProvider())
                .orderStatus(order.getStatus().name())
                .shipmentStatus(shipment.getStatus().name())
                .storeName(store != null ? store.getStoreName() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerPhone(customer != null ? customer.getPhoneNumber() : null)
                .shippingAddress(order.getShippingAddress())
                .codAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .estimatedDeliveryDate(shipment.getEstimatedDeliveryDate())
                .deliveredAt(order.getDeliveredAt())
                .build();
    }
}