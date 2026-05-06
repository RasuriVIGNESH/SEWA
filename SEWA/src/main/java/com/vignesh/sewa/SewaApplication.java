package com.vignesh.sewa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SewaApplication {

	public static void main(String[] args) {
		SpringApplication.run(SewaApplication.class, args);
	}

}
