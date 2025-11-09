package com.example.backend.mapper;

import com.example.backend.dto.response.ChatMessageResponse;
import com.example.backend.dto.response.UserInfoResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.ChatMessage;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.MessageStatus;
import com.example.backend.entity.enums.MessageType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

/**
 * MapStruct Mapper for ChatMessage entity to DTO conversion
 */
@Mapper(componentModel = "spring")
public interface ChatMessageMapper {

    /**
     * Convert ChatMessage entity to ChatMessageResponse DTO
     */
    @Mapping(target = "sender", source = "sender", qualifiedByName = "userToUserInfoResponse")
    @Mapping(target = "receiver", source = "receiver", qualifiedByName = "userToUserInfoResponse")
    @Mapping(target = "status", source = "status", qualifiedByName = "messageStatusToEnum")
    @Mapping(target = "type", source = "type", qualifiedByName = "messageTypeToEnum")
    @Mapping(target = "fileUrl", ignore = true) // Will be set from content if needed
    @Mapping(target = "storeId", source = "store.storeId")
    @Mapping(target = "storeName", source = "store.storeName")
    ChatMessageResponse toResponse(ChatMessage chatMessage);

    /**
     * Convert list of ChatMessage entities to list of ChatMessageResponse DTOs
     */
    List<ChatMessageResponse> toResponseList(List<ChatMessage> chatMessages);

    /**
     * Convert User entity to UserInfoResponse DTO
     * This method handles polymorphic User types (Customer, Supplier, Admin)
     */
    @Named("userToUserInfoResponse")
    default UserInfoResponse userToUserInfoResponse(User user) {
        if (user == null) {
            return null;
        }

        UserInfoResponse.UserInfoResponseBuilder builder = UserInfoResponse.builder()
                .userId(user.getUserId())
                .keycloakId(user.getKeycloakId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .active(user.isActive())
                .roles(null) // Roles not needed for chat display
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        // Add user type and status based on polymorphic type
        if (user instanceof Customer customer) {
            builder.userType("CUSTOMER")
                    .status(customer.getStatus().name());
        } else if (user instanceof Supplier supplier) {
            builder.userType("SUPPLIER")
                    .status(supplier.getStatus().name());
        } else if (user instanceof Admin admin) {
            builder.userType("ADMIN")
                    .status(admin.getStatus().name());
        }

        return builder.build();
    }

    /**
     * Convert MessageStatus enum to itself (pass-through for clarity)
     */
    @Named("messageStatusToEnum")
    default MessageStatus messageStatusToEnum(MessageStatus status) {
        return status;
    }

    /**
     * Convert MessageType enum to itself (pass-through for clarity)
     */
    @Named("messageTypeToEnum")
    default MessageType messageTypeToEnum(MessageType type) {
        return type;
    }
}
