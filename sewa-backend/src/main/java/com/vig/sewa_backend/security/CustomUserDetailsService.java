package com.vig.sewa_backend.security;

import com.vig.sewa_backend.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private final DoctorRepository doctorRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return doctorRepository.findByEmail(email)
                .map(doctor -> new User(
                        doctor.getEmail(),
                        doctor.getPassword(),
                        List.of(new SimpleGrantedAuthority("ROLE_DOCTOR"))
                ))
                .orElseThrow(() -> new UsernameNotFoundException("Doctor not found: " + email));
    }
}