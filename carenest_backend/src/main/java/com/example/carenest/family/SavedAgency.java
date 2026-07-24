package com.example.carenest.family;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.example.carenest.agency.Agency;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Matches the "saved_agencies" table already present in V1__init_schema.sql
 * (id, family_id, agency_id, created_at) - this entity didn't exist yet,
 * built fresh off that table's actual columns.
 */
@Entity
@Table(name = "saved_agencies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedAgency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private FamilyProfile family;

    @ManyToOne
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}