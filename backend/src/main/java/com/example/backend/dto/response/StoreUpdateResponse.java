package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for store update operations
 * Contains either immediate update result or pending update depending on change type
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreUpdateResponse {

    /**
     * Type of update performed
     * IMMEDIATE: Changes applied directly (minor changes)
     * PENDING: Changes require admin approval (major changes)
     */
    private UpdateType updateType;

    /**
     * Store data (populated when updateType = IMMEDIATE)
     */
    private StoreResponse store;

    /**
     * Pending update data (populated when updateType = PENDING)
     */
    private StorePendingUpdateResponse pendingUpdate;

    /**
     * Human-readable message explaining what happened
     */
    private String message;

    public enum UpdateType {
        IMMEDIATE,  // Minor changes applied immediately
        PENDING     // Major changes awaiting approval
    }
}
