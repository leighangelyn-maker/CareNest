package com.example.carenest.notification;

import java.util.List;
import java.util.UUID;

import com.example.carenest.auth.model.User;
import com.example.carenest.notification.dto.NotificationResponse;

public interface NotificationService {

    /**
     * Internal creation hook, called from BookingServiceImpl /
     * PaymentServiceImpl at the relevant lifecycle points - not exposed to
     * clients directly (notifications are system-generated, not
     * user-created).
     */
    void create(User recipient, NotificationType type, String title, String message, UUID bookingId);

    List<NotificationResponse> getNotificationsForUser(UUID userId);

    long getUnreadCount(UUID userId);

    NotificationResponse markAsRead(UUID notificationId, UUID requestingUserId);

    void markAllAsRead(UUID userId);
}