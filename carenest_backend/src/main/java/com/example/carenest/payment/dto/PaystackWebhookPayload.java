package com.example.carenest.payment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

/**
 * Minimal shape of a Paystack webhook body - only the fields this service
 * actually needs. Paystack sends more (customer, authorization, etc.);
 * extend as needed.
 * Docs: https://paystack.com/docs/payments/webhooks/
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaystackWebhookPayload {

    private String event; // e.g. "charge.success"

    private WebhookData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WebhookData {
        private String reference;
        private String status; // "success", "failed", etc.
        private Long amount; // in kobo/pesewas (minor units)

        @JsonProperty("id")
        private Long transactionId;
    }
}