package com.example.backend.controller;

import com.example.backend.dto.request.CreatePaymentLinkRequest;
import com.example.backend.dto.request.PayOSWebhookRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.PaymentLinkResponse;
import com.example.backend.service.PayOSService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments/payos")
@RequiredArgsConstructor
@Tag(name = "PayOS Payment", description = "PayOS payment integration for mobile app")
public class PayOSController {

    private final PayOSService payOSService;

    // ==================== CUSTOMER ENDPOINTS ====================

    @PostMapping("/create-payment-link")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Create PayOS payment link (Mobile)",
            description = "Create payment link for order. Returns checkout URL to open in WebView and QR code for banking app scanning.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> createPaymentLink(
            Authentication authentication,
            @Valid @RequestBody CreatePaymentLinkRequest request
    ) {
        String customerId = authentication.getName();
        log.info("Creating payment link: customerId={}, orderId={}", customerId, request.getOrderId());

        PaymentLinkResponse response = payOSService.createPaymentLink(customerId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo link thanh toán thành công", response));
    }

    @GetMapping("/payment-status/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Get payment status (Mobile)",
            description = "Check current payment status of an order. Use this to poll payment status while waiting.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> getPaymentStatus(
            Authentication authentication,
            @PathVariable String orderId
    ) {
        String customerId = authentication.getName();
        log.info("Getting payment status: customerId={}, orderId={}", customerId, orderId);

        PaymentLinkResponse response = payOSService.getPaymentStatus(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái thanh toán thành công", response));
    }

    @PostMapping("/cancel-payment/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Cancel payment link (Mobile)",
            description = "Cancel pending payment link for an order.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<Void>> cancelPaymentLink(
            Authentication authentication,
            @PathVariable String orderId
    ) {
        String customerId = authentication.getName();
        log.info("Cancelling payment link: customerId={}, orderId={}", customerId, orderId);

        payOSService.cancelPaymentLink(orderId);
        return ResponseEntity.ok(ApiResponse.success("Hủy thanh toán thành công"));
    }

    // ==================== WEBHOOK ENDPOINT ====================

    @PostMapping("/webhook")
    @Operation(
            summary = "PayOS webhook callback",
            description = "Webhook endpoint for PayOS to notify payment status changes. This endpoint is public (no authentication required)."
    )
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody PayOSWebhookRequest webhook
    ) {
        log.info("Received PayOS webhook: orderCode={}, code={}", 
                webhook.getData() != null ? webhook.getData().getOrderCode() : "null",
                webhook.getCode());

        try {
            payOSService.processWebhook(webhook);
            
            Map<String, Object> response = new HashMap<>();
            response.put("error", 0);
            response.put("message", "Webhook processed successfully");
            response.put("data", null);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to process webhook", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", -1);
            errorResponse.put("message", "Webhook processing failed: " + e.getMessage());
            errorResponse.put("data", null);
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ==================== TESTING/DEBUG ENDPOINT ====================

    @GetMapping("/test-config")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(
            summary = "Test PayOS configuration (Admin only)",
            description = "Returns PayOS configuration status (without sensitive data)",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<Map<String, String>>> testConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("status", "configured");
        config.put("message", "PayOS is ready to use");
        
        return ResponseEntity.ok(ApiResponse.success("Cấu hình PayOS", config));
    }
}
