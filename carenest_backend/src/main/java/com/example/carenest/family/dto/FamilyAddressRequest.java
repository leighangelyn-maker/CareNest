package com.example.carenest.family.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FamilyAddressRequest {

    private String label;
    private String line1;
    private String line2;
    private String city;
    private String region;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean isDefault;
}
