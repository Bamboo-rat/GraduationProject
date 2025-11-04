package com.example.backend.service.impl;

import com.example.backend.dto.response.NotificationResponse;
import com.example.backend.entity.Notification;
import com.example.backend.entity.User;
import com.example.backend.entity.UserNotificationStatus;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.entity.enums.Role;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.repository.UserNotificationStatusRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InAppNotificationServiceImpl implements InAppNotificationService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationStatusRepository userNotificationStatusRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;

    @Override
    @Transactional
    public String createNotificationForUser(String userId, NotificationType type, String content, String linkUrl) {
        log.info("Creating notification for user: {}, type: {}", userId, type);

        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Create notification
        Notification notification = new Notification();
        notification.setContent(content);
        notification.setType(type);
        notification.setLinkUrl(linkUrl);
        notification.setBroadcast(false);
        notification = notificationRepository.save(notification);

        // Create user notification status
        UserNotificationStatus status = new UserNotificationStatus();
        status.setUser(user);
        status.setNotification(notification);
        status.setRead(false);
        userNotificationStatusRepository.save(status);

        log.info("Notification created successfully: {}", notification.getNotificationId());
        return notification.getNotificationId();
    }

    @Override
    @Transactional
    public String createNotificationForRoles(Role[] roles, NotificationType type, String content, String linkUrl) {
        log.info("Creating notification for roles: {}, type: {}", roles, type);

        // Create notification
        Notification notification = new Notification();
        notification.setContent(content);
        notification.setType(type);
        notification.setLinkUrl(linkUrl);
        notification.setBroadcast(true);
        notification = notificationRepository.save(notification);

        // Find all users with specified roles (only admin roles are supported)
        List<User> users = new ArrayList<>();
        for (Role role : roles) {
            List<User> admins = new ArrayList<>(adminRepository.findByRole(role));
            users.addAll(admins);
        }
        log.info("Found {} users with specified roles", users.size());

        // Create notification status for each user
        for (User user : users) {
            UserNotificationStatus status = new UserNotificationStatus();
            status.setUser(user);
            status.setNotification(notification);
            status.setRead(false);
            userNotificationStatusRepository.save(status);
        }

        log.info("Notification created for {} users", users.size());
        return notification.getNotificationId();
    }

    @Override
    @Transactional
    public String createNotificationForAllAdmins(NotificationType type, String content, String linkUrl) {
        log.info("Creating notification for all admins, type: {}", type);

        Role[] adminRoles = {Role.ROLE_SUPER_ADMIN, Role.ROLE_MODERATOR, Role.ROLE_STAFF};
        return createNotificationForRoles(adminRoles, type, content, linkUrl);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotificationsForUser(String keycloakId, Pageable pageable) {
        log.info("Getting notifications for user with keycloakId: {}", keycloakId);

        // Find user by keycloakId
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Page<UserNotificationStatus> statuses = userNotificationStatusRepository
                .findByUserUserId(user.getUserId(), pageable);

        return statuses.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUnreadNotificationsForUser(String keycloakId, Pageable pageable) {
        log.info("Getting unread notifications for user with keycloakId: {}", keycloakId);

        // Find user by keycloakId
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Page<UserNotificationStatus> statuses = userNotificationStatusRepository
                .findUnreadByUserId(user.getUserId(), pageable);

        return statuses.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String keycloakId) {
        log.debug("Getting unread count for user with keycloakId: {}", keycloakId);

        // Find user by keycloakId
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        return userNotificationStatusRepository.countUnreadByUserId(user.getUserId());
    }

    @Override
    @Transactional
    public void markAsRead(String keycloakId, String notificationId) {
        log.info("Marking notification as read - keycloakId: {}, notification: {}", keycloakId, notificationId);

        // Find user by keycloakId
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        UserNotificationStatus status = userNotificationStatusRepository
                .findByUserIdAndNotificationId(user.getUserId(), notificationId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Notification not found for user"));

        status.setRead(true);
        userNotificationStatusRepository.save(status);

        log.info("Notification marked as read successfully");
    }

    @Override
    @Transactional
    public int markAllAsRead(String keycloakId) {
        log.info("Marking all notifications as read for user with keycloakId: {}", keycloakId);

        // Find user by keycloakId
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        int count = userNotificationStatusRepository.markAllAsReadByUserId(user.getUserId());

        log.info("Marked {} notifications as read", count);
        return count;
    }

    @Override
    @Transactional
    public void deleteOldNotifications(int daysOld) {
        log.info("Deleting notifications older than {} days", daysOld);

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        notificationRepository.deleteByCreatedAtBefore(cutoffDate);

        log.info("Old notifications deleted successfully");
    }

    /**
     * Convert UserNotificationStatus to NotificationResponse
     */
    private NotificationResponse toResponse(UserNotificationStatus status) {
        Notification notification = status.getNotification();

        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .content(notification.getContent())
                .type(notification.getType())
                .typeDisplayName(notification.getType().getDisplayName())
                .linkUrl(notification.getLinkUrl())
                .isRead(status.isRead())
                .isBroadcast(notification.isBroadcast())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
