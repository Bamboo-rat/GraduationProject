package com.example.backend.controller;

import com.example.backend.dto.request.CreateReturnRequestRequest;
import com.example.backend.dto.request.ReviewReturnRequestRequest;
import com.example.backend.dto.response.ReturnRequestResponse;
import com.example.backend.enums.ReturnReason;
import com.example.backend.enums.ReturnRequestStatus;
import com.example.backend.service.ReturnRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ReturnRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReturnRequestService returnRequestService;

    @Test
    @WithMockUser(username = "customer-id", roles = "CUSTOMER")
    void testCreateReturnRequest() throws Exception {
        CreateReturnRequestRequest request = CreateReturnRequestRequest.builder()
                .reason(ReturnReason.DEFECTIVE_PRODUCT)
                .description("Sản phẩm bị lỗi, không hoạt động")
                .imageUrls(Arrays.asList("https://example.com/image1.jpg"))
                .build();

        ReturnRequestResponse response = ReturnRequestResponse.builder()
                .id("return-id")
                .orderId("order-id")
                .orderCode("ORD-001")
                .customerId("customer-id")
                .customerName("Nguyễn Văn A")
                .storeId("store-id")
                .storeName("Cửa hàng A")
                .reason(ReturnReason.DEFECTIVE_PRODUCT)
                .reasonDescription("Sản phẩm lỗi/hỏng")
                .description("Sản phẩm bị lỗi, không hoạt động")
                .imageUrls(Arrays.asList("https://example.com/image1.jpg"))
                .status(ReturnRequestStatus.PENDING)
                .statusDescription("Đang chờ xử lý")
                .orderTotalAmount(1000000.0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(returnRequestService.createReturnRequest(anyString(), anyString(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/return-requests")
                        .param("orderId", "order-id")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("return-id"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "supplier-id", roles = "SUPPLIER")
    void testApproveReturnRequest() throws Exception {
        ReviewReturnRequestRequest request = ReviewReturnRequestRequest.builder()
                .reviewNote("Đã kiểm tra và chấp nhận trả hàng")
                .build();

        ReturnRequestResponse response = ReturnRequestResponse.builder()
                .id("return-id")
                .status(ReturnRequestStatus.APPROVED)
                .statusDescription("Đã chấp nhận")
                .reviewerId("supplier-id")
                .reviewerName("Supplier A")
                .reviewNote("Đã kiểm tra và chấp nhận trả hàng")
                .reviewedAt(LocalDateTime.now())
                .refundAmount(1000000.0)
                .build();

        when(returnRequestService.approveReturnRequest(anyString(), anyString(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/return-requests/return-id/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @WithMockUser(username = "customer-id", roles = "CUSTOMER")
    void testGetMyRequests() throws Exception {
        ReturnRequestResponse response = ReturnRequestResponse.builder()
                .id("return-id")
                .orderId("order-id")
                .orderCode("ORD-001")
                .status(ReturnRequestStatus.PENDING)
                .build();

        Page<ReturnRequestResponse> page = new PageImpl<>(Collections.singletonList(response));

        when(returnRequestService.getCustomerReturnRequests(anyString(), anyInt(), anyInt()))
                .thenReturn(page);

        mockMvc.perform(get("/api/return-requests/my-requests")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].id").value("return-id"));
    }
}
