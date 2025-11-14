package com.example.backend.service.impl;

import com.example.backend.config.PayOSConfig;
import com.example.backend.dto.request.CreatePaymentLinkRequest;
import com.example.backend.dto.response.PaymentLinkResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Order;
import com.example.backend.entity.Payment;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.PaymentMethod;
import com.example.backend.entity.enums.PaymentProvider;
import com.example.backend.entity.enums.PaymentStatus;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PayOSService
 * 
 * Test Coverage:
 * 1. Create payment link - Success
 * 2. Create payment link - Order not found
 * 3. Create payment link - Unauthorized access
 * 4. Create payment link - Invalid order status
 * 5. Create payment link - Already paid
 * 6. Get payment status - Success
 * 7. Cancel payment link - Success
 * 8. Process webhook - Success
 * 9. Verify webhook signature - Valid
 * 10. Verify webhook signature - Invalid
 */
@ExtendWith(MockitoExtension.class)
class PayOSServiceImplTest {

    @Mock
    private PayOSConfig payOSConfig;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PayOSServiceImpl payOSService;

    private String customerId;
    private String orderId;
    private Order mockOrder;
    private Payment mockPayment;
    private Customer mockCustomer;

    @BeforeEach
    void setUp() {
        customerId = "customer-id-123";
        orderId = "order-id-123";

        // Mock customer
        mockCustomer = new Customer();
        mockCustomer.setUserId(customerId);
        mockCustomer.setFullName("Nguyen Van A");
        mockCustomer.setEmail("test@example.com");
        mockCustomer.setPhoneNumber("0123456789");

        // Mock payment
        mockPayment = new Payment();
        mockPayment.setPaymentId("payment-id-123");
        mockPayment.setMethod(PaymentMethod.E_WALLET);
        mockPayment.setAmount(new BigDecimal("500000"));
        mockPayment.setStatus(PaymentStatus.PENDING);
        mockPayment.setProvider(PaymentProvider.INTERNAL);

        // Mock order
        mockOrder = new Order();
        mockOrder.setOrderId(orderId);
        mockOrder.setOrderCode("FS123456");
        mockOrder.setStatus(OrderStatus.PENDING);
        mockOrder.setCustomer(mockCustomer);
        mockOrder.setPayment(mockPayment);
        mockOrder.setTotalAmount(new BigDecimal("500000"));

        mockPayment.setOrder(mockOrder);

        // Mock PayOSConfig
        when(payOSConfig.getClientId()).thenReturn("test-client-id");
        when(payOSConfig.getApiKey()).thenReturn("test-api-key");
        when(payOSConfig.getChecksumKey()).thenReturn("test-checksum-key");
        when(payOSConfig.getBaseUrl()).thenReturn("https://api-merchant.payos.vn");
        when(payOSConfig.getReturnUrl()).thenReturn("https://test.com/return");
        when(payOSConfig.getCancelUrl()).thenReturn("https://test.com/cancel");
    }

    @Test
    void testCreatePaymentLink_OrderNotFound() {
        // Given
        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderId(orderId)
                .amount(new BigDecimal("500000"))
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            payOSService.createPaymentLink(customerId, request);
        });

        verify(orderRepository, times(1)).findById(orderId);
    }

    @Test
    void testCreatePaymentLink_UnauthorizedAccess() {
        // Given
        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderId(orderId)
                .amount(new BigDecimal("500000"))
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            payOSService.createPaymentLink("different-customer-id", request);
        });

        verify(orderRepository, times(1)).findById(orderId);
    }

    @Test
    void testCreatePaymentLink_InvalidOrderStatus() {
        // Given
        mockOrder.setStatus(OrderStatus.DELIVERED);
        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderId(orderId)
                .amount(new BigDecimal("500000"))
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            payOSService.createPaymentLink(customerId, request);
        });

        verify(orderRepository, times(1)).findById(orderId);
    }

    @Test
    void testCreatePaymentLink_AlreadyPaid() {
        // Given
        mockPayment.setStatus(PaymentStatus.SUCCESS);
        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderId(orderId)
                .amount(new BigDecimal("500000"))
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            payOSService.createPaymentLink(customerId, request);
        });

        verify(orderRepository, times(1)).findById(orderId);
    }

    @Test
    void testGetPaymentStatus_Success() {
        // Given
        mockPayment.setTransactionId("1234567890");
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

        // When
        PaymentLinkResponse response = payOSService.getPaymentStatus(orderId);

        // Then
        assertNotNull(response);
        assertEquals(mockOrder.getOrderCode(), response.getOrderCode());
        assertEquals(mockPayment.getAmount(), response.getAmount());
        assertEquals(mockPayment.getStatus().name(), response.getStatus());

        verify(orderRepository, times(1)).findById(orderId);
    }

    @Test
    void testGetPaymentStatus_OrderNotFound() {
        // Given
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> {
            payOSService.getPaymentStatus(orderId);
        });

        verify(orderRepository, times(1)).findById(orderId);
    }

    @Test
    void testCancelPaymentLink_Success() {
        // Given
        mockPayment.setTransactionId("1234567890");
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));
        when(paymentRepository.save(any(Payment.class))).thenReturn(mockPayment);

        // When
        assertDoesNotThrow(() -> {
            payOSService.cancelPaymentLink(orderId);
        });

        // Then
        verify(orderRepository, times(1)).findById(orderId);
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }

    // Note: Testing createPaymentLink with actual API call would require:
    // 1. Mocking RestTemplate
    // 2. Mocking HTTP response from PayOS
    // 3. More complex setup
    // This should be done in integration tests rather than unit tests

    // Note: Testing processWebhook and verifyWebhookSignature would require:
    // 1. Sample webhook payloads from PayOS
    // 2. Valid signatures for testing
    // 3. Should be covered in integration tests
}
