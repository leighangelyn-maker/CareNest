package com.example.carenest.common.exception;

/**
 * Thrown for client-caused validation/business-rule failures (HTTP 400).
 * Mirrors ResourceNotFoundException's pattern - if you have a global
 * @ControllerAdvice / exception handler already mapping ResourceNotFoundException
 * to a 404, add a matching case here mapping BadRequestException to a 400.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}