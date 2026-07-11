package com.example.carenest.family;

import jakarta.persistence.*;
import lombok.Data;
import com.example.carenest.agency.Agency;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_agencies")
@Data
public class SavedAgency {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private FamilyProfile family;

    @ManyToOne
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    private LocalDateTime createdAt;
}
