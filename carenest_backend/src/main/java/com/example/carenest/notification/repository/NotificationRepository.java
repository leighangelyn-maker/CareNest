package com.example.carenest.notification.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carenest.notification.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByRecipient_IdOrderByCreatedAtDesc(UUID recipientUserId);

    long countByRecipient_IdAndIsReadFalse(UUID recipientUserId);

    List<Notification> findByRecipient_IdAndIsReadFalse(UUID recipientUserId);
}