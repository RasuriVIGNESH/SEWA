package com.vig.sewa_backend.config;

import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JacksonJsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();

        configProps.put(
                ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,
                bootstrapServers
        );

        return new DefaultKafkaProducerFactory<>(
                configProps,
                new StringSerializer(),
                new JacksonJsonSerializer<>()
        );
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
