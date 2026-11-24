package com.vig.sewa_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || header.isBlank()) {
            if (!request.getRequestURI().startsWith("/ws/")) {
                log.debug(
                        "Missing Bearer token: {} {}",
                        request.getMethod(),
                        request.getRequestURI()
                );
            }

            filterChain.doFilter(request, response);
            return;
        }


        String token = header.substring(7);

        try {
            if (!jwtUtil.isValid(token)) {
                log.error("JWT validation failed for {}", request.getRequestURI());

                filterChain.doFilter(request, response);
                return;
            }

            String email = jwtUtil.extractEmail(token);

            UserDetails user =
                    userDetailsService.loadUserByUsername(email);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            user.getAuthorities()
                    );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

        } catch (Exception exception) {
            SecurityContextHolder.clearContext();
        }filterChain.doFilter(request, response);
    }
}
