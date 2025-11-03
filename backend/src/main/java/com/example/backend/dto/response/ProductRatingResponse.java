package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRatingResponse {

    private String productId;
    private String productName;
    private Double averageRating;
    private long totalReviews;
    
    // Rating distribution: {5: 100, 4: 50, 3: 20, 2: 10, 1: 5}
    private Map<Integer, Long> ratingDistribution;
    
    // Percentage for each star
    private Map<Integer, Double> ratingPercentage;
}
