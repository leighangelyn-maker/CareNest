package com.example.carenest;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Generated;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.carenest.auth.model.User;

@Entity
@Table(name = "family_profiles")
public class FamilyProfile {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "first_name", nullable = false)
    private String firstName;
    @Column(name = "last_name", nullable = false)
    private String lastName;
    @Column(name = "avatar_url")
    private String avatarUrl;
    @Column(name = "household_notes")
    private String householdNotes;
    @Column(name = "emergency_contact_name", nullable = false)
    private String emergencyContactName;
    @Column(name = "emergency_contact_phone", nullable = false)
    private String emergencyContactPhone;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public FamilyProfile() {
    }

    @Generated
    public UUID getId() {
        return this.id;
    }

    @Generated
    public User getUser() {
        return this.user;
    }

    @Generated
    public String getFirstName() {
        return this.firstName;
    }

    @Generated
    public String getLastName() {
        return this.lastName;
    }

    @Generated
    public String getAvatarUrl() {
        return this.avatarUrl;
    }

    @Generated
    public String getHouseholdNotes() {
        return this.householdNotes;
    }

    @Generated
    public String getEmergencyContactName() {
        return this.emergencyContactName;
    }

    @Generated
    public String getEmergencyContactPhone() {
        return this.emergencyContactPhone;
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
    public void setUser(final User user) {
        this.user = user;
    }

    @Generated
    public void setFirstName(final String firstName) {
        this.firstName = firstName;
    }

    @Generated
    public void setLastName(final String lastName) {
        this.lastName = lastName;
    }

    @Generated
    public void setAvatarUrl(final String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    @Generated
    public void setHouseholdNotes(final String householdNotes) {
        this.householdNotes = householdNotes;
    }

    @Generated
    public void setEmergencyContactName(final String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }

    @Generated
    public void setEmergencyContactPhone(final String emergencyContactPhone) {
        this.emergencyContactPhone = emergencyContactPhone;
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
