package com.vig.sewa_backend.Exception;

public class DuplicateDoctorException extends RuntimeException {
    public DuplicateDoctorException(String message) {
        super(message);
    }
}