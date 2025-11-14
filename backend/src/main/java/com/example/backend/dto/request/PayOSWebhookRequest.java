package com.example.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOSWebhookRequest {

    @JsonProperty("code")
    private String code; // "00" = success

    @JsonProperty("desc")
    private String description;

    @JsonProperty("data")
    private WebhookData data;

    @JsonProperty("signature")
    private String signature;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebhookData {
        
        @JsonProperty("orderCode")
        private Long orderCode;

        @JsonProperty("amount")
        private BigDecimal amount;

        @JsonProperty("description")
        private String description;

        @JsonProperty("accountNumber")
        private String accountNumber;

        @JsonProperty("reference")
        private String reference;

        @JsonProperty("transactionDateTime")
        private String transactionDateTime;

        @JsonProperty("currency")
        private String currency;

        @JsonProperty("paymentLinkId")
        private String paymentLinkId;

        @JsonProperty("code")
        private String code;

        @JsonProperty("desc")
        private String desc;

        @JsonProperty("counterAccountBankId")
        private String counterAccountBankId;

        @JsonProperty("counterAccountBankName")
        private String counterAccountBankName;

        @JsonProperty("counterAccountName")
        private String counterAccountName;

        @JsonProperty("counterAccountNumber")
        private String counterAccountNumber;

        @JsonProperty("virtualAccountName")
        private String virtualAccountName;

        @JsonProperty("virtualAccountNumber")
        private String virtualAccountNumber;
    }
}
