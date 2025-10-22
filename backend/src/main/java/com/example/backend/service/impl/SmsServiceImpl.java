package com.example.backend.service.impl;

import com.example.backend.service.SmsService;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Service implementation for SMS operations using SpeedSMS API
 * SpeedSMS is a Vietnamese SMS provider - only sends SMS messages
 * OTP generation and verification is handled by OtpService using Redis
 */
@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    private static final String API_URL = "https://api.speedsms.vn/index.php";
    private static final int DEFAULT_SMS_TYPE = 2; // Type 2: Send randomly (no brandname needed)

    @Value("${speedsms.access-token}")
    private String accessToken;

    @PostConstruct
    private void validateConfig() {
        if (accessToken == null || accessToken.isBlank()) {
            log.error("SpeedSMS access token is not configured. Check SPEEDSMS_ACCESS_TOKEN in environment variables");
            throw new IllegalStateException("SpeedSMS access token missing");
        }
        log.info("SpeedSMS service initialized successfully");
    }

    @Override
    public String sendSms(String phoneNumber, String content) {
        log.info("Sending SMS via SpeedSMS to phone: {}", phoneNumber);

        try {
            // Normalize phone number for SpeedSMS (84xxxxxxxxx format)
            String normalizedPhone = normalizePhoneForSpeedSMS(phoneNumber);

            // Send SMS with type 2 (random sender)
            String response = sendSMSRequest(normalizedPhone, content, DEFAULT_SMS_TYPE);
            log.info("SpeedSMS response: {}", response);

            // Check if SMS was sent successfully
            // SpeedSMS success response: {"status":"success","data":{"tranId":"xxx"}}
            // SpeedSMS error response: {"status":"error","message":"xxx"}
            if (response != null && response.contains("\"status\":\"success\"")) {
                log.info("SMS sent successfully to: {}", phoneNumber);
                return "success";
            } else {
                log.error("SpeedSMS send failed. Response: {}", response);
                return "failed";
            }

        } catch (IOException e) {
            log.error("IOException sending SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return "failed";
        } catch (Exception e) {
            log.error("Unexpected error sending SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return "failed";
        }
    }

    /**
     * Send SMS request to SpeedSMS API
     *
     * @param to Normalized phone number (84xxxxxxxxx)
     * @param content SMS content (will be Unicode-encoded for Vietnamese)
     * @param type SMS type (2=random sender, no brandname)
     * @return JSON response from SpeedSMS API
     * @throws IOException if network error occurs
     */
    private String sendSMSRequest(String to, String content, int type) throws IOException {
        // Build JSON request body
        String json = buildJsonRequest(to, content, type);
        log.debug("SpeedSMS request JSON: {}", json);

        // Create HTTP connection
    URL url = java.net.URI.create(API_URL + "/sms/send").toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");

        // Set Basic Authentication header
    String userCredentials = accessToken + ":x";
    String basicAuth = "Basic " + Base64.getEncoder().encodeToString(userCredentials.getBytes(StandardCharsets.UTF_8));
        conn.setRequestProperty("Authorization", basicAuth);
    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
    conn.setRequestProperty("Accept", "application/json");
    conn.setConnectTimeout(10000);
    conn.setReadTimeout(10000);

        // Send request
        conn.setDoOutput(true);
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        conn.setRequestProperty("Content-Length", String.valueOf(body.length));
        try (DataOutputStream wr = new DataOutputStream(conn.getOutputStream())) {
            wr.write(body);
            wr.flush();
        }

        // Read response
        int responseCode = conn.getResponseCode();
        log.debug("SpeedSMS HTTP response code: {}", responseCode);

        StringBuilder response = new StringBuilder();
    try (BufferedReader in = new BufferedReader(
        new InputStreamReader(
                    responseCode >= 200 && responseCode < 300
                        ? conn.getInputStream()
            : conn.getErrorStream(),
            StandardCharsets.UTF_8
        )
        )) {
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
        }

        return response.toString();
    }

    /**
     * Build JSON request body for SpeedSMS API
     * Type 2 (random sender) does not require brandname field
     */
    private String buildJsonRequest(String to, String content, int type) {
        // Escape special characters for JSON string
        String escapedContent = escapeJsonString(content);

        // Build JSON - no brandname for type 2
        return "{\"to\": [\"" + to + "\"], \"content\": \"" + escapedContent + "\", \"type\":" + type + "}";
    }

    /**
     * Normalize phone number for SpeedSMS API
     * SpeedSMS expects format: 84xxxxxxxxx (without + prefix)
     *
     * @param phone Input phone (+84912345678, 84912345678, 0912345678)
     * @return Normalized phone (84912345678)
     */
    private String normalizePhoneForSpeedSMS(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        // Remove all non-digit characters except +
        String digits = phone.replaceAll("[^0-9+]", "");

        // Remove + prefix if present
        if (digits.startsWith("+")) {
            digits = digits.substring(1);
        }

        // Convert local format (0xxxxxxxxx) to international (84xxxxxxxxx)
        if (digits.startsWith("0")) {
            return "84" + digits.substring(1);
        }

        // Already in international format
        if (digits.startsWith("84")) {
            return digits;
        }

        // Fallback: assume it's a local number without leading 0
        return "84" + digits;
    }

    /**
     * Escape special characters in JSON string
     * Handles quotes, backslashes, and control characters
     *
     * @param value Input string
     * @return JSON-safe escaped string
     */
    private String escapeJsonString(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);

            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\b':
                    sb.append("\\b");
                    break;
                case '\f':
                    sb.append("\\f");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    if (c < 32) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        // Keep all other characters (including Vietnamese) as-is
                        sb.append(c);
                    }
                    break;
            }
        }

        return sb.toString();
    }
}
