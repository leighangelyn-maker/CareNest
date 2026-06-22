package com.example.carenest;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Generated;

@Entity
@Table(name = "service_category")
public class ServiceCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    @Column(name = "slug", nullable = false)
    private String slug;
    @Column(name = "service_type", nullable = false)
    private String name;
    @Column(name = "work_description")
    private String description;

    public ServiceCategory() {
    }

    @Generated
    public Long getId() {
        return this.id;
    }

    @Generated
    public String getSlug() {
        return this.slug;
    }

    @Generated
    public String getName() {
        return this.name;
    }

    @Generated
    public String getDescription() {
        return this.description;
    }

    @Generated
    public void setId(final Long id) {
        this.id = id;
    }

    @Generated
    public void setSlug(final String slug) {
        this.slug = slug;
    }

    @Generated
    public void setName(final String name) {
        this.name = name;
    }

    @Generated
    public void setDescription(final String description) {
        this.description = description;
    }
}
