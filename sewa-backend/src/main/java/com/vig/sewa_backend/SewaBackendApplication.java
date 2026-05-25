package com.vig.sewa_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SewaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SewaBackendApplication.class, args);
	}

}
