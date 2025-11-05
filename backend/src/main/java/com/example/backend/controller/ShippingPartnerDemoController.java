package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.ShippingPartnerOrderResponse;
import com.example.backend.service.ShippingPartnerDemoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/demo/shipping")
@RequiredArgsConstructor
public class ShippingPartnerDemoController {

    private final ShippingPartnerDemoService shippingPartnerDemoService;

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<ShippingPartnerOrderResponse>>> getInTransitOrders(
            @RequestParam(value = "provider", required = false) String provider) {
        List<ShippingPartnerOrderResponse> orders = shippingPartnerDemoService.getInTransitOrders(provider);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng đang giao thành công", orders));
    }

    @GetMapping("/orders/{trackingNumber}")
    public ResponseEntity<ApiResponse<ShippingPartnerOrderResponse>> getOrderByTrackingNumber(
            @PathVariable String trackingNumber) {
        ShippingPartnerOrderResponse order = shippingPartnerDemoService.getOrderByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đơn hàng thành công", order));
    }

    @PostMapping("/orders/{trackingNumber}/deliver")
    public ResponseEntity<ApiResponse<ShippingPartnerOrderResponse>> markDelivered(
            @PathVariable String trackingNumber) {
        ShippingPartnerOrderResponse order = shippingPartnerDemoService.markDelivered(trackingNumber);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái giao hàng thành công", order));
    }
}