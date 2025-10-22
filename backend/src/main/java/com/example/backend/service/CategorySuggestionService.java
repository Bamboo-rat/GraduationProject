package com.example.backend.service;

import com.example.backend.dto.request.CategorySuggestionRequest;
import com.example.backend.dto.response.CategorySuggestionResponse;
import com.example.backend.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategorySuggestionService {

    /**
     * Supplier suggests a new category
     * @param request Category suggestion details
     * @param keycloakId Keycloak ID from JWT
     * @return Created suggestion
     */
    CategorySuggestionResponse createSuggestion(CategorySuggestionRequest request, String keycloakId);

    /**
     * Get all suggestions with optional status filter
     * @param status Filter by status (optional)
     * @param pageable Pagination parameters
     * @return Page of suggestions
     */
    Page<CategorySuggestionResponse> getAllSuggestions(SuggestionStatus status, Pageable pageable);

    /**
     * Get suggestions by current supplier
     * @param keycloakId Keycloak ID from JWT
     * @param status Filter by status (optional)
     * @param pageable Pagination parameters
     * @return Page of supplier's suggestions
     */
    Page<CategorySuggestionResponse> getMySuggestions(String keycloakId, SuggestionStatus status, Pageable pageable);

    /**
     * Get suggestion by ID
     * @param suggestionId Suggestion ID
     * @return Suggestion details
     */
    CategorySuggestionResponse getSuggestionById(String suggestionId);

    /**
     * Admin approves a suggestion and creates the category
     * @param suggestionId Suggestion ID
     * @param keycloakId Admin's Keycloak ID
     * @param adminNotes Optional notes from admin
     * @return Approved suggestion
     */
    CategorySuggestionResponse approveSuggestion(String suggestionId, String keycloakId, String adminNotes);

    /**
     * Admin rejects a suggestion
     * @param suggestionId Suggestion ID
     * @param keycloakId Admin's Keycloak ID
     * @param adminNotes Reason for rejection
     * @return Rejected suggestion
     */
    CategorySuggestionResponse rejectSuggestion(String suggestionId, String keycloakId, String adminNotes);
}
