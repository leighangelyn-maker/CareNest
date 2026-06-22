package com.example.carenest;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Generated;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "app_user")
public class User {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;
    @Column(name = "email", nullable = false)
    private String email;
    @Column(name = "contact", nullable = false)
    private String contact;
    @Column(name = "password", nullable = false)
    private String passwordHash;
    @Column(name = "role", nullable = false)
    private Status status;
    @Column(name = "user_status", nullable = false)
    private UserStatus userStatus;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public User() {
    }

    @Generated
    public UUID getId() {
        return this.id;
    }

    @Generated
    public String getEmail() {
        return this.email;
    }

    @Generated
    public String getContact() {
        return this.contact;
    }

    @Generated
    public String getPasswordHash() {
        return this.passwordHash;
    }

    @Generated
    public Status getStatus() {
        return this.status;
    }

    @Generated
    public UserStatus getUserStatus() {
        return this.userStatus;
    }

    @Generated
    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }

    @Generated
    public LocalDateTime getUpdatedAt() {
        return this.updatedAt;
    }

    @Generated
    public void setId(final UUID id) {
        this.id = id;
    }

    @Generated
    public void setEmail(final String email) {
        this.email = email;
    }

    @Generated
    public void setContact(final String contact) {
        this.contact = contact;
    }

    @Generated
    public void setPasswordHash(final String passwordHash) {
        this.passwordHash = passwordHash;
    }

    @Generated
    public void setStatus(final Status status) {
        this.status = status;
    }

    @Generated
    public void setUserStatus(final UserStatus userStatus) {
        this.userStatus = userStatus;
    }

    @Generated
    public void setCreatedAt(final LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Generated
    public void setUpdatedAt(final LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
