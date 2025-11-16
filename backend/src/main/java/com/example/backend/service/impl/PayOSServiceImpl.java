package com.example.backend.service.impl;

import com.example.backend.config.PayOSConfig;
import com.example.backend.dto.request.CreatePaymentLinkRequest;
import com.example.backend.dto.request.PayOSWebhookRequest;
import com.example.backend.dto.response.PaymentLinkResponse;
import com.example.backend.entity.Order;
import com.example.backend.entity.Payment;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.PaymentProvider;
import com.example.backend.entity.enums.PaymentStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.service.PayOSService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayOSServiceImpl implements PayOSService {

    private final PayOSConfig payOSConfig;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public PaymentLinkResponse createPaymentLink(String customerId, CreatePaymentLinkRequest request) {
        log.info("Creating PayOS payment link: customerId={}, orderId={}", customerId, request.getOrderId());

        // Get order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        // Validate customer ownership
        if (!order.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS, 
                    "Bạn không có quyền thanh toán đơn hàng này");
        }

        // Validate order status
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS, 
                    "Chỉ có thể thanh toán đơn hàng ở trạng thái PENDING");
        }

        // Get existing payment
        Payment payment = order.getPayment();
        if (payment == null) {
            throw new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy thông tin thanh toán");
        }

        // Check if already paid
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException(ErrorCode.PAYMENT_ALREADY_PROCESSED, "Đơn hàng đã được thanh toán");
        }

        try {
            // Generate unique order code (use timestamp to ensure uniqueness)
            long orderCode = System.currentTimeMillis() / 1000; // Unix timestamp in seconds

            // Prepare PayOS request
            Map<String, Object> payosRequest = new HashMap<>();
            payosRequest.put("orderCode", orderCode);
            payosRequest.put("amount", request.getAmount().intValue());
            payosRequest.put("description", request.getDescription() != null 
                    ? request.getDescription() 
                    : "Thanh toán đơn hàng #" + order.getOrderCode());
            payosRequest.put("returnUrl", request.getReturnUrl() != null 
                    ? request.getReturnUrl() 
                    : payOSConfig.getReturnUrl());
            payosRequest.put("cancelUrl", request.getCancelUrl() != null 
                    ? request.getCancelUrl() 
                    : payOSConfig.getCancelUrl());

            // Add buyer information (top-level fields, NOT nested object)
            payosRequest.put("buyerName", order.getCustomer().getFullName());
            payosRequest.put("buyerEmail", order.getCustomer().getEmail());
            payosRequest.put("buyerPhone", order.getCustomer().getPhoneNumber());

            // Generate signature
            String returnUrl = (String) payosRequest.get("returnUrl");
            String cancelUrl = (String) payosRequest.get("cancelUrl");
            String description = (String) payosRequest.get("description");
            int amount = (Integer) payosRequest.get("amount");
            
            String signature = generateSignature(amount, cancelUrl, description, orderCode, returnUrl);
            payosRequest.put("signature", signature);

            // Call PayOS API
            String url = payOSConfig.getBaseUrl() + "/v2/payment-requests";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", payOSConfig.getClientId());
            headers.set("x-api-key", payOSConfig.getApiKey());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payosRequest, headers);
            
            log.info("Calling PayOS API: url={}, orderCode={}", url, orderCode);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            log.info("PayOS API response: status={}, body={}", response.getStatusCode(), response.getBody());

            // Parse response
            JsonNode responseData = objectMapper.readTree(response.getBody());
            
            // Check response code
            String responseCode = responseData.has("code") ? responseData.get("code").asText() : null;
            if (!"00".equals(responseCode)) {
                String errorDesc = responseData.has("desc") ? responseData.get("desc").asText() : "Unknown error";
                log.error("PayOS API returned error: code={}, desc={}", responseCode, errorDesc);
                throw new BadRequestException(ErrorCode.PAYMENT_GATEWAY_ERROR, 
                        "PayOS error: " + errorDesc);
            }
            
            JsonNode data = responseData.get("data");
            if (data == null) {
                log.error("PayOS response missing 'data' field. Full response: {}", responseData.toPrettyString());
                throw new BadRequestException(ErrorCode.PAYMENT_GATEWAY_ERROR, 
                        "PayOS response không hợp lệ");
            }

            // Extract fields with null checks
            String paymentLinkId = data.has("paymentLinkId") ? data.get("paymentLinkId").asText() : String.valueOf(orderCode);
            String checkoutUrl = data.has("checkoutUrl") ? data.get("checkoutUrl").asText() : null;
            String qrCode = data.has("qrCode") ? data.get("qrCode").asText() : null;
            
            if (checkoutUrl == null) {
                log.error("PayOS response missing 'checkoutUrl'. Data: {}", data.toPrettyString());
                throw new BadRequestException(ErrorCode.PAYMENT_GATEWAY_ERROR, 
                        "PayOS response thiếu checkout URL");
            }

            // Update payment record
            payment.setProvider(PaymentProvider.PAYOS);
            payment.setTransactionId(String.valueOf(orderCode));
            payment.setStatus(PaymentStatus.PENDING);
            paymentRepository.save(payment);

            log.info("PayOS payment link created successfully: orderId={}, orderCode={}, paymentLinkId={}", 
                    request.getOrderId(), orderCode, paymentLinkId);

            // Build response
            return PaymentLinkResponse.builder()
                    .paymentLinkId(paymentLinkId)
                    .orderCode(order.getOrderCode())
                    .amount(request.getAmount())
                    .checkoutUrl(checkoutUrl)
                    .qrCode(qrCode)
                    .status("PENDING")
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusMinutes(15)) // PayOS links expire after 15 minutes
                    .build();

        } catch (HttpClientErrorException e) {
            log.error("PayOS API error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException(ErrorCode.PAYMENT_LINK_CREATION_FAILED, 
                    "Lỗi khi tạo link thanh toán PayOS: " + e.getMessage());
        } catch (Exception e) {
            log.error("Failed to create PayOS payment link", e);
            throw new BadRequestException(ErrorCode.PAYMENT_LINK_CREATION_FAILED, 
                    "Không thể tạo link thanh toán: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentLinkResponse getPaymentStatus(String orderId) {
        log.info("Getting payment status: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        Payment payment = order.getPayment();
        if (payment == null || payment.getTransactionId() == null) {
            throw new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND, 
                    "Không tìm thấy thông tin thanh toán");
        }

        try {
            // Call PayOS API to get payment status
            String url = payOSConfig.getBaseUrl() + "/v2/payment-requests/" + payment.getTransactionId();
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-client-id", payOSConfig.getClientId());
            headers.set("x-api-key", payOSConfig.getApiKey());

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            JsonNode responseData = objectMapper.readTree(response.getBody());
            JsonNode data = responseData.get("data");

            if (data == null) {
                throw new BadRequestException(ErrorCode.PAYMENT_GATEWAY_ERROR, 
                        "PayOS response không hợp lệ");
            }

            String status = data.get("status").asText(); // PENDING, PAID, CANCELLED

            // Auto-update order if payment is successful and order is still pending
            if ("PAID".equals(status) && payment.getStatus() != PaymentStatus.SUCCESS) {
                payment.setStatus(PaymentStatus.SUCCESS);
                paymentRepository.save(payment);

                if (order.getStatus() == OrderStatus.PENDING) {
                    order.setStatus(OrderStatus.CONFIRMED);
                    order.setPaymentStatus(PaymentStatus.SUCCESS);
                    orderRepository.save(order);
                    log.info("Order auto-confirmed after checking PAID status: orderId={}, orderCode={}", 
                            order.getOrderId(), order.getOrderCode());
                }
            }

            return PaymentLinkResponse.builder()
                    .paymentLinkId(data.get("id").asText())
                    .orderCode(order.getOrderCode())
                    .amount(payment.getAmount())
                    .checkoutUrl(data.has("checkoutUrl") ? data.get("checkoutUrl").asText() : null)
                    .qrCode(data.has("qrCode") ? data.get("qrCode").asText() : null)
                    .status(status)
                    .createdAt(payment.getCreatedAt())
                    .build();

        } catch (Exception e) {
            log.error("Failed to get payment status from PayOS", e);
            // Return local status if PayOS API fails
            return PaymentLinkResponse.builder()
                    .orderCode(order.getOrderCode())
                    .amount(payment.getAmount())
                    .status(payment.getStatus().name())
                    .createdAt(payment.getCreatedAt())
                    .build();
        }
    }

    @Override
    @Transactional
    public void cancelPaymentLink(String orderId) {
        log.info("Cancelling payment link: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        Payment payment = order.getPayment();
        if (payment == null || payment.getTransactionId() == null) {
            throw new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND, 
                    "Không tìm thấy thông tin thanh toán");
        }

        try {
            // Call PayOS API to cancel payment
            String url = payOSConfig.getBaseUrl() + "/v2/payment-requests/" + payment.getTransactionId() + "/cancel";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", payOSConfig.getClientId());
            headers.set("x-api-key", payOSConfig.getApiKey());

            Map<String, String> cancelRequest = new HashMap<>();
            cancelRequest.put("cancellationReason", "Khách hàng hủy thanh toán");

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(cancelRequest, headers);
            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            // Update payment status
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);

            log.info("Payment link cancelled successfully: orderId={}", orderId);

        } catch (Exception e) {
            log.error("Failed to cancel payment link", e);
            // Still update local status even if PayOS API fails
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
    }

    @Override
    @Transactional
    public void processWebhook(PayOSWebhookRequest webhook) {
        log.info("Processing PayOS webhook: orderCode={}, code={}", 
                webhook.getData().getOrderCode(), webhook.getCode());

        // Verify signature
        if (!verifyWebhookSignature(webhook)) {
            log.error("Invalid webhook signature");
            throw new BadRequestException(ErrorCode.WEBHOOK_SIGNATURE_INVALID, "Chữ ký webhook không hợp lệ");
        }

        // Get payment by transaction ID
        String transactionId = String.valueOf(webhook.getData().getOrderCode());
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND, 
                        "Không tìm thấy giao dịch"));

        Order order = payment.getOrder();

        // Check webhook code (00 = success)
        if ("00".equals(webhook.getCode())) {
            // Payment successful
            payment.setStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);

            // Update order status to CONFIRMED (ready for supplier to process)
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.CONFIRMED);
                order.setPaymentStatus(PaymentStatus.SUCCESS); // Update payment status
                orderRepository.save(order);
                log.info("Order confirmed after successful payment: orderId={}, orderCode={}", 
                        order.getOrderId(), order.getOrderCode());
            }

            log.info("Payment successful via webhook: orderId={}, transactionId={}", 
                    order.getOrderId(), transactionId);
        } else {
            // Payment failed
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);

            // Update order payment status to FAILED
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);

            log.warn("Payment failed via webhook: orderId={}, transactionId={}, code={}", 
                    order.getOrderId(), transactionId, webhook.getCode());
        }
    }

    @Override
    public boolean verifyWebhookSignature(PayOSWebhookRequest webhook) {
        try {
            // PayOS signature verification logic
            // Build data string from webhook data (sorted by key)
            StringBuilder dataStr = new StringBuilder();
            PayOSWebhookRequest.WebhookData data = webhook.getData();
            
            dataStr.append("amount=").append(data.getAmount())
                   .append("&code=").append(data.getCode())
                   .append("&desc=").append(data.getDesc())
                   .append("&orderCode=").append(data.getOrderCode());

            // Generate HMAC SHA256 signature
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    payOSConfig.getChecksumKey().getBytes(StandardCharsets.UTF_8), 
                    "HmacSHA256");
            hmac.init(secretKey);

            byte[] hash = hmac.doFinal(dataStr.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            String calculatedSignature = hexString.toString();
            boolean isValid = calculatedSignature.equals(webhook.getSignature());

            if (!isValid) {
                log.warn("Signature mismatch - Expected: {}, Got: {}", 
                        calculatedSignature, webhook.getSignature());
            }

            return isValid;

        } catch (Exception e) {
            log.error("Failed to verify webhook signature", e);
            return false;
        }
    }

    /**
     * Generate PayOS signature for payment request
     * Format: amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl
     */
    private String generateSignature(int amount, String cancelUrl, String description, long orderCode, String returnUrl) {
        try {
            // Build data string (sorted alphabetically)
            String data = "amount=" + amount + 
                         "&cancelUrl=" + cancelUrl + 
                         "&description=" + description + 
                         "&orderCode=" + orderCode + 
                         "&returnUrl=" + returnUrl;
            
            log.debug("Signature data: {}", data);
            
            // Create HMAC SHA256
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    payOSConfig.getChecksumKey().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256");
            hmac.init(secretKey);

            // Calculate hash
            byte[] hash = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            String signature = hexString.toString();
            log.debug("Generated signature: {}", signature);
            
            return signature;
            
        } catch (Exception e) {
            log.error("Failed to generate signature", e);
            throw new BadRequestException(ErrorCode.PAYMENT_GATEWAY_ERROR, 
                    "Không thể tạo chữ ký thanh toán");
        }
    }
}
