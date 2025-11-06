package com.example.backend.service.impl;

import com.example.backend.dto.response.ShippingPartnerOrderResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Order;
import com.example.backend.entity.Shipment;
import com.example.backend.entity.Store;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.ShipmentStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ShipmentRepository;
import com.example.backend.service.ShippingPartnerDemoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShippingPartnerDemoServiceImpl implements ShippingPartnerDemoService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;

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
        log.info("Marking order as delivered via tracking number: {}", trackingNumber);

        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SHIPMENT_NOT_FOUND, 
                        "Không tìm thấy vận đơn với mã: " + trackingNumber));

        Order order = shipment.getOrder();
        if (order == null) {
            throw new NotFoundException(ErrorCode.ORDER_NOT_FOUND);
        }

        // Validate order status
        if (order.getStatus() != OrderStatus.SHIPPING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể hoàn thành đơn hàng từ trạng thái SHIPPING");
        }

        // Validate shipment status
        if (shipment.getStatus() != ShipmentStatus.SHIPPING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    String.format("Không thể xác nhận giao hàng. Vận đơn đang ở trạng thái %s, cần ở trạng thái SHIPPING",
                            shipment.getStatus()));
        }

        // Update shipment status
        shipment.setStatus(ShipmentStatus.DELIVERED);
        shipment = shipmentRepository.save(shipment);

        // Update order status
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        order.setBalanceReleased(false); // Will be released after 7-day hold period
        order = orderRepository.save(order);

        log.info("Order marked as delivered: orderId={}, trackingNumber={}", order.getOrderId(), trackingNumber);

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