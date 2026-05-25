package com.vig.sewa_backend.controller;

import com.vig.sewa_backend.DTO.DoctorRequest;
import com.vig.sewa_backend.DTO.DoctorResponse;
import com.vig.sewa_backend.DTO.LoginRequest;
import com.vig.sewa_backend.DTO.LoginResponse;
import com.vig.sewa_backend.security.JwtUtil;
import com.vig.sewa_backend.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final DoctorService doctorService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        var doctor = doctorService.getByEmail(req.getEmail());
        return ResponseEntity.ok(buildResponse(doctor.getEmail(), doctor.getName(), doctor.getId()));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody DoctorRequest req) {
        DoctorResponse doctor = doctorService.create(req);
        return ResponseEntity.ok(buildResponse(req.getEmail(), doctor.getName(), doctor.getId()));
    }

    private LoginResponse buildResponse(String email, String name, Long doctorId) {
        return LoginResponse.builder()
                .token(jwtUtil.generate(email, "ROLE_DOCTOR"))
                .name(name)
                .doctorId(doctorId)
                .build();
    }
}