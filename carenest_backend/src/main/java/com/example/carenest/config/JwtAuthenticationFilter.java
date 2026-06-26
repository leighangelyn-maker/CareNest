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

                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            email, 
                            null, 
                            Collections.singletonList(authority)
                        );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("🔐 User authenticated: {} with role: {}", email, role);
                } else {
                    log.warn("⚠️ Invalid token provided");
                }
            } catch (Exception e) {
                log.error("❌ JWT authentication failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else {
            log.debug("No Authorization header found for: {}", request.getServletPath());
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        
        log.debug("Checking shouldNotFilter for path: {}", path);
        
        // ONLY skip JWT validation for truly public endpoints
        // These endpoints are accessible without any authentication
        if (path.startsWith("/auth/register") ||
            path.startsWith("/auth/register-agency") ||
            path.startsWith("/auth/login") ||
            path.startsWith("/auth/refresh") ||
            path.startsWith("/auth/logout") ||
            path.startsWith("/auth/verify-email") ||
            path.startsWith("/auth/forgot-password") ||
            path.startsWith("/auth/reset-password") ||
            path.startsWith("/h2-console") ||
            path.startsWith("/swagger-ui") ||
            path.startsWith("/v3/api-docs") ||
            path.startsWith("/api-docs") ||
            path.startsWith("/public-test")) {
            return true;
        }
        
        // ALL other endpoints require authentication
        // This includes:
        // - /workers/profile (POST, PUT, PATCH, DELETE)
        // - /workers/profile/{id} (GET) - requires authentication
        // - /documents/upload (POST) - requires authentication
        // - /documents/worker/{id} (GET) - requires authentication
        // - /documents/{id} (GET) - requires authentication
        // - /documents/check/{workerId}/{type} (GET) - requires authentication
        // - /documents/pending (GET) - requires authentication
        // - /documents/{id}/verify (PATCH) - requires authentication
        
        return false;
    }
}