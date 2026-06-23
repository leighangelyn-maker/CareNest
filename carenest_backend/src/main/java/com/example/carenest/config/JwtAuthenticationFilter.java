package com.example.carenest.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@SuppressWarnings("null")
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (jwtUtils.validateToken(token)) {
                    String email = jwtUtils.getEmailFromToken(token);
                    String role = jwtUtils.getRoleFromToken(token);

                    // Create authority with ROLE_ prefix for Spring Security
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

                    // Create authentication token
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            email, 
                            null, 
                            Collections.singletonList(authority)
                        );

                    // Set authentication in security context
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    log.debug("User authenticated: {} with role: {}", email, role);
                }
            } catch (Exception e) {
                log.error("JWT authentication failed: {}", e.getMessage());
                // Clear security context on error
                SecurityContextHolder.clearContext();
            }
        }

        // Continue the filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Skip JWT authentication for public endpoints
     * This improves performance by not checking JWT for public endpoints
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        
        // Public endpoints that don't require JWT authentication
        return path.startsWith("/auth/register") ||
               path.startsWith("/auth/login") ||
               path.startsWith("/auth/refresh") ||
               path.startsWith("/auth/verify-email") ||
               path.startsWith("/auth/forgot-password") ||
               path.startsWith("/auth/reset-password") ||
               path.startsWith("/api-docs") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/h2-console") ||
               path.startsWith("/actuator/health") ||
               path.startsWith("/payments/webhook/paystack");
    }
}