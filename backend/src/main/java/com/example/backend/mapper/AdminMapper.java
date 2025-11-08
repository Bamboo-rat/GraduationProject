package com.example.backend.mapper;

import com.example.backend.dto.response.AdminResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.Gender;
import com.example.backend.entity.enums.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

/**
 * MapStruct Mapper for Admin entity to DTO conversion
 */
@Mapper(componentModel = "spring")
public interface

AdminMapper {

    /**
     * Convert Admin entity to AdminResponse DTO
     */
    @Mapping(target = "gender", source = "gender", qualifiedByName = "genderToString")
    @Mapping(target = "role", source = "role", qualifiedByName = "roleToString")
    @Mapping(target = "status", source = "status", qualifiedByName = "adminStatusToString")
    AdminResponse toResponse(Admin admin);

    /**
     * Convert list of Admin entities to list of AdminResponse DTOs
     */
    List<AdminResponse> toResponseList(List<Admin> admins);

    // Custom enum converters
    @Named("genderToString")
    default String genderToString(Gender gender) {
        return gender != null ? gender.name() : null;
    }

    @Named("roleToString")
    default String roleToString(Role role) {
        return role != null ? role.name() : null;
    }

    @Named("adminStatusToString")
    default String adminStatusToString(AdminStatus status) {
        return status != null ? status.name() : null;
    }
}
