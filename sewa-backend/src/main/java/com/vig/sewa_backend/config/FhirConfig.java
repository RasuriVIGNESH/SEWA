package com.vig.sewa_backend.config;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FhirConfig {

    @Value("${fhir.server.url:http://localhost:8081/fhir}")
    private String fhirServerUrl;

    @Bean
    public FhirContext fhirContext() {
        return FhirContext.forR4();
    }

    @Bean
    public IGenericClient fhirClient(FhirContext ctx) {
        return ctx.newRestfulGenericClient(fhirServerUrl);
    }
}