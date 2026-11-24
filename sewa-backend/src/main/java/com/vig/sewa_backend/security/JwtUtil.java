package com.vig.sewa_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiry-ms:86400000}")
    private long expiryMs;

    private Key signingKey() {
        return Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generate(String email, String role) {
        Date now = new Date();

        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(
                        new Date(now.getTime() + expiryMs)
                )
                .signWith(
                        signingKey(),
                        SignatureAlgorithm.HS256
                )
                .compact();
    }

    public String extractEmail(String token) {
        return parse(token)
                .getBody()
                .getSubject();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    private Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token);
    }
}
