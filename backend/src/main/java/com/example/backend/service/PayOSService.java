package com.example.backend.service;

import com.example.backend.dto.request.CreatePaymentLinkRequest;
import com.example.backend.dto.request.PayOSWebhookRequest;
import com.example.backend.dto.response.PaymentLinkResponse;

public interface PayOSService {

    /**
     * Create payment link for order
     * @param customerId ID of customer making payment
     * @param request Payment link creation request
     * @return Payment link response with checkout URL and QR code
     */
    PaymentLinkResponse createPaymentLink(String customerId, CreatePaymentLinkRequest request);

    /**
     * Get payment status by order ID
     * @param orderId Order ID
     * @return Payment link response with current status
     */
    PaymentLinkResponse getPaymentStatus(String orderId);

    /**
     * Cancel payment link
     * @param orderId Order ID
     */
    void cancelPaymentLink(String orderId);

    /**
     * Process webhook from PayOS
     * @param webhook Webhook data from PayOS
     */
    void processWebhook(PayOSWebhookRequest webhook);

    /**
     * Verify webhook signature
     * @param webhook Webhook data
     * @return true if signature is valid
     */
    boolean verifyWebhookSignature(PayOSWebhookRequest webhook);
}
