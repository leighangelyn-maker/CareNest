package com.example.carenest.family.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class FamilyAddressResponse {

    private UUID id;
    private String label;
    private String line1;
    private String city;
    private String region;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean isDefault;
}
