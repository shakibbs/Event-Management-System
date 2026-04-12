package com.event_management_system.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserResponseDTO {

    private Long id;
    private String fullName;
    private String email;
    private RoleResponseDTO role;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    
    // Transient field for PDF export - stores the role name as a string
    private transient String roleName;
    
    public String getRoleName() {
        if (roleName != null) {
            return roleName;
        }
        return (role != null && role.getName() != null) ? role.getName() : "N/A";
    }
}