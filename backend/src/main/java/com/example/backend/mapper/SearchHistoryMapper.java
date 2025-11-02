package com.example.backend.mapper;

import com.example.backend.dto.response.SearchHistoryResponse;
import com.example.backend.entity.SearchHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SearchHistoryMapper {

    @Mapping(target = "customerId", source = "customer.userId")
    @Mapping(target = "customerName", source = "customer.fullName")
    SearchHistoryResponse toResponse(SearchHistory searchHistory);
}
